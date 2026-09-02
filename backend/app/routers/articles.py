import re
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from ..database import db
from ..schemas import ArticleInput
from ..security import ROLE_PERMISSIONS, current_user, require_permission
from ..serializers import article_response, object_id
from ..slug import slugify_title

router = APIRouter(prefix="/articles", tags=["articles"])

def unique_slug(value: str) -> str:
    base = slugify_title(value)
    slug, suffix = base, 2
    while db.articles.find_one({"slug": slug}): slug, suffix = f"{base}-{suffix}", suffix + 1
    return slug

def search_filter(value: str) -> dict:
    term = value.strip()
    escaped = re.escape(term)
    slug_term = re.escape(re.sub(r"[\s_]+", "-", term))
    return {"$or": [
        {"title": {"$regex": escaped, "$options": "i"}},
        {"slug": {"$regex": slug_term, "$options": "i"}},
        {"excerpt": {"$regex": escaped, "$options": "i"}},
        {"category": {"$regex": escaped, "$options": "i"}},
        {"author_name": {"$regex": escaped, "$options": "i"}},
        {"seo_keywords": {"$regex": escaped, "$options": "i"}},
    ]}

@router.get("")
def list_articles(request: Request, page: int = 1, limit: int = 12, category: str | None = None, q: str | None = None, admin: bool = False, status: str | None = None):
    page, limit, query = max(1, page), max(1, min(50, limit)), {}
    if admin:
        user = current_user(request); allowed = ROLE_PERMISSIONS.get(user["role"], set())
        if "*" not in allowed and "articles" not in allowed: raise HTTPException(403, "Insufficient permission")
        if status: query["status"] = status
    else: query["status"] = "published"
    if category: query["category"] = category
    if q and q.strip(): query.update(search_filter(q))
    total = db.articles.count_documents(query)
    items = [article_response(x, admin) for x in db.articles.find(query).sort("published_at", -1).skip((page - 1) * limit).limit(limit)]
    return {"items": items, "page": page, "limit": limit, "total": total, "pages": max(1, (total + limit - 1) // limit), "categories": db.articles.distinct("category", {"status": "published"})}

@router.get("/{slug}")
def get_article(slug: str, track_view: bool = True):
    row = db.articles.find_one({"slug": slug, "status": "published"})
    if not row: raise HTTPException(404, "News not found")
    if track_view: db.articles.update_one({"_id": row["_id"]}, {"$inc": {"views": 1}})
    return article_response(row, True)

@router.post("")
def create_article(body: ArticleInput, user=Depends(require_permission("articles"))):
    now = datetime.now(timezone.utc)
    document = {**body.model_dump(), "slug": unique_slug(body.title), "author_id": user["_id"], "author_name": user["name"], "views": 0, "created_at": now, "updated_at": now, "published_at": now if body.status == "published" else None}
    document["_id"] = db.articles.insert_one(document).inserted_id
    return article_response(document, True)

@router.patch("/{item_id}")
def update_article(item_id: str, body: ArticleInput, _=Depends(require_permission("articles"))):
    existing = db.articles.find_one({"_id": object_id(item_id)})
    if not existing: raise HTTPException(404, "News not found")
    now = datetime.now(timezone.utc); updates = {**body.model_dump(), "updated_at": now}
    if body.status == "published" and not existing.get("published_at"): updates["published_at"] = now
    db.articles.update_one({"_id": existing["_id"]}, {"$set": updates})
    return {"ok": True}

@router.delete("/{item_id}")
def delete_article(item_id: str, _=Depends(require_permission("articles"))):
    db.articles.delete_one({"_id": object_id(item_id)})
    return {"ok": True}
