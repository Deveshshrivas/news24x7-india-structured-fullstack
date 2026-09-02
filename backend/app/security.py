from datetime import datetime, timedelta, timezone
from bson import ObjectId
from fastapi import Depends, HTTPException, Request, Response
from jose import JWTError, jwt
from passlib.context import CryptContext
from .config import settings
from .database import db

passwords = CryptContext(schemes=["bcrypt"], deprecated="auto")
ROLE_PERMISSIONS = {"super_admin": {"*"}, "admin": {"articles", "categories", "breaking", "audio", "ads"}, "editor": {"articles", "categories", "breaking", "audio"}, "reporter": {"articles"}, "ad_manager": {"ads"}}

def public_user(user: dict) -> dict:
    return {"id": str(user["_id"]), "name": user["name"], "email": user["email"], "role": user["role"], "active": user.get("active", True), "avatar": user.get("avatar")}

def create_token(user: dict, minutes: int = 60 * 24 * 7) -> str:
    payload = {"sub": str(user["_id"]), "email": user["email"], "exp": datetime.now(timezone.utc) + timedelta(minutes=minutes)}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

def set_session_cookie(response: Response, value: str) -> None:
    response.set_cookie("news_token", value, max_age=604800, httponly=True, secure=settings.cookie_secure, samesite="none" if settings.cookie_secure else "lax", path="/")

def current_user(request: Request) -> dict:
    raw = request.cookies.get("news_token") or (request.headers.get("authorization", "").removeprefix("Bearer ") or None)
    if not raw: raise HTTPException(401, "Authentication required")
    try: user = db.users.find_one({"_id": ObjectId(jwt.decode(raw, settings.jwt_secret, algorithms=["HS256"])["sub"])})
    except (JWTError, Exception): raise HTTPException(401, "Invalid session")
    if not user or not user.get("active", True): raise HTTPException(403, "Account disabled")
    return user

def require_permission(section: str):
    def check(user=Depends(current_user)):
        allowed = ROLE_PERMISSIONS.get(user["role"], set())
        if "*" not in allowed and section not in allowed: raise HTTPException(403, "Insufficient permission")
        return user
    return check

def require_super_admin(user=Depends(current_user)):
    if user.get("role") != "super_admin":
        raise HTTPException(403, "Only the super admin can manage users")
    return user
