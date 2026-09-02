import os
from dataclasses import dataclass

@dataclass(frozen=True)
class Settings:
    mongodb_uri: str = os.environ.get("MONGODB_URI", "")
    database_name: str = os.environ.get("MONGODB_DATABASE", "news24x7")
    jwt_secret: str = os.environ.get("JWT_SECRET", "dev-only-change-me")
    backend_url: str = os.environ.get("BACKEND_URL", "http://localhost:8000").rstrip("/")
    frontend_url: str = os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    google_client_id: str = os.environ.get("GOOGLE_CLIENT_ID", "")
    google_client_secret: str = os.environ.get("GOOGLE_CLIENT_SECRET", "")
    cookie_secure: bool = os.environ.get("COOKIE_SECURE", "false").lower() == "true"
    allowed_origins: tuple[str, ...] = tuple(x.strip() for x in os.environ.get("ALLOWED_ORIGINS", os.environ.get("FRONTEND_URL", "http://localhost:3000")).split(","))

settings = Settings()
if not settings.mongodb_uri:
    raise RuntimeError("MONGODB_URI is required")
