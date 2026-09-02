from gridfs import GridFS
from pymongo import ASCENDING, MongoClient
from .config import settings

client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=8000)
db = client[settings.database_name]
audio_files = GridFS(db, collection="audio_files")

def initialize_database() -> None:
    client.admin.command("ping")
    db.users.create_index("email", unique=True)
    db.oauth_codes.create_index("expires_at", expireAfterSeconds=0)
    db.audio_tracks.create_index([("position", ASCENDING)])
    db.breaking_news.create_index([("created_at", ASCENDING)])
    db.articles.create_index("slug", unique=True)
    db.articles.create_index([("status", ASCENDING), ("published_at", -1)])
    db.articles.create_index([("category", ASCENDING), ("published_at", -1)])
    db.articles.create_index([("title", "text"), ("excerpt", "text"), ("body", "text")])
    if db.articles.count_documents({}) == 0:
        try:
            from backend.seed_data import sample_articles
        except ModuleNotFoundError:
            from seed_data import sample_articles
        db.articles.insert_many(sample_articles())
