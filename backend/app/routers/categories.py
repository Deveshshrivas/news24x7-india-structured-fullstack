from datetime import datetime, timezone
import re

from fastapi import APIRouter, Depends, HTTPException

from ..database import db
from ..schemas import CategoryInput
from ..security import require_permission
from ..serializers import object_id
from ..slug import slugify_title

router = APIRouter(prefix="/categories", tags=["categories"])


def category_response(item: dict) -> dict:
    return {
        "id": str(item["_id"]),
        "name": item["name"],
        "slug": item["slug"],
        "parentId": str(item["parent_id"]) if item.get("parent_id") else None,
        "active": item.get("active", True),
        "position": item.get("position", 0),
    }


def unique_slug(name: str, exclude_id=None) -> str:
    base = slugify_title(name)
    slug, suffix = base, 2
    query = {"slug": slug}
    if exclude_id is not None:
        query["_id"] = {"$ne": exclude_id}
    while db.categories.find_one(query):
        slug = f"{base}-{suffix}"
        suffix += 1
        query["slug"] = slug
    return slug


def parent_object_id(parent_id: str | None, item_id=None):
    if not parent_id:
        return None
    parent = object_id(parent_id)
    if item_id is not None and parent == item_id:
        raise HTTPException(400, "A category cannot be its own parent")
    parent_row = db.categories.find_one({"_id": parent})
    if not parent_row:
        raise HTTPException(400, "Parent category not found")
    if parent_row.get("parent_id"):
        raise HTTPException(400, "Only one subcategory level is supported")
    return parent


@router.get("")
def list_categories():
    items = db.categories.find({}).sort([("position", 1), ("name", 1)])
    return {"items": [category_response(item) for item in items]}


@router.post("")
def create_category(body: CategoryInput, _=Depends(require_permission("categories"))):
    name = body.name.strip()
    if db.categories.find_one({"name": {"$regex": f"^{re.escape(name)}$", "$options": "i"}}):
        raise HTTPException(409, "Category already exists")
    now = datetime.now(timezone.utc)
    document = {
        "name": name,
        "slug": unique_slug(name),
        "parent_id": parent_object_id(body.parent_id),
        "active": body.active,
        "position": body.position,
        "created_at": now,
        "updated_at": now,
    }
    document["_id"] = db.categories.insert_one(document).inserted_id
    return category_response(document)


@router.patch("/{item_id}")
def update_category(item_id: str, body: CategoryInput, _=Depends(require_permission("categories"))):
    category_id = object_id(item_id)
    existing = db.categories.find_one({"_id": category_id})
    if not existing:
        raise HTTPException(404, "Category not found")
    parent_id = parent_object_id(body.parent_id, category_id)
    if parent_id and db.categories.count_documents({"parent_id": category_id}):
        raise HTTPException(409, "A category with subcategories cannot become a subcategory")
    name = body.name.strip()
    duplicate = db.categories.find_one({"_id": {"$ne": category_id}, "name": {"$regex": f"^{re.escape(name)}$", "$options": "i"}})
    if duplicate:
        raise HTTPException(409, "Category already exists")
    updates = {
        "name": name,
        "slug": unique_slug(name, category_id),
        "parent_id": parent_id,
        "active": body.active,
        "position": body.position,
        "updated_at": datetime.now(timezone.utc),
    }
    db.categories.update_one({"_id": category_id}, {"$set": updates})
    return category_response({**existing, **updates})


@router.delete("/{item_id}")
def delete_category(item_id: str, _=Depends(require_permission("categories"))):
    category_id = object_id(item_id)
    existing = db.categories.find_one({"_id": category_id})
    if not existing:
        raise HTTPException(404, "Category not found")
    if db.categories.count_documents({"parent_id": category_id}):
        raise HTTPException(409, "Delete its subcategories first")
    if db.articles.count_documents({"category": existing["name"]}):
        raise HTTPException(409, "This category is used by news articles")
    db.categories.delete_one({"_id": category_id})
    return {"ok": True}
