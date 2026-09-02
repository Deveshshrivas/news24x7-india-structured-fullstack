from bson import ObjectId
from fastapi import HTTPException

def object_id(value: str) -> ObjectId:
    try: return ObjectId(value)
    except Exception as exc: raise HTTPException(400, "Invalid ID") from exc

def article_response(article: dict, full: bool = False) -> dict:
    data = {"id": str(article["_id"]), "title": article["title"], "slug": article["slug"], "excerpt": article["excerpt"], "category": article["category"], "imageUrl": article.get("image_url"), "status": article["status"], "featured": article.get("featured", False), "author": article.get("author_name", "न्यूज़ डेस्क"), "publishedAt": article.get("published_at").isoformat() if article.get("published_at") else None, "updatedAt": article["updated_at"].isoformat(), "seoTitle": article.get("seo_title"), "seoDescription": article.get("seo_description"), "seoKeywords": article.get("seo_keywords"), "seoImageUrl": article.get("seo_image_url")}
    if full: data["body"] = article["body"]
    return data
