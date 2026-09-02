from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import client, initialize_database
from .routers import articles, audio, auth, breaking, categories, users

app = FastAPI(title="NEWS24x7 India API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=list(settings.allowed_origins), allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(breaking.router)
app.include_router(audio.router)
app.include_router(articles.router)
app.include_router(categories.router)

@app.on_event("startup")
def startup() -> None:
    initialize_database()

@app.get("/health", tags=["system"])
def health() -> dict[str, bool]:
    client.admin.command("ping")
    return {"ok": True}
