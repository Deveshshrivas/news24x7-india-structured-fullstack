from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from ..database import db
from ..schemas import BreakingNewsInput
from ..security import require_permission
from ..serializers import object_id

router = APIRouter(prefix="/breaking", tags=["breaking-news"])

@router.get("")
def list_breaking():
    return {"items": [{"id": str(x["_id"]), "text": x["text"], "articleSlug": x.get("article_slug"), "active": x["active"]} for x in db.breaking_news.find().sort("created_at", 1)]}

@router.post("")
def create_breaking(body: BreakingNewsInput, _=Depends(require_permission("breaking"))):
    db.breaking_news.insert_one({**body.model_dump(), "created_at": datetime.now(timezone.utc)})
    return {"ok": True}

@router.patch("/{item_id}")
def update_breaking(item_id: str, body: BreakingNewsInput, _=Depends(require_permission("breaking"))):
    db.breaking_news.update_one({"_id": object_id(item_id)}, {"$set": body.model_dump()})
    return {"ok": True}

@router.delete("/{item_id}")
def delete_breaking(item_id: str, _=Depends(require_permission("breaking"))):
    db.breaking_news.delete_one({"_id": object_id(item_id)})
    return {"ok": True}
