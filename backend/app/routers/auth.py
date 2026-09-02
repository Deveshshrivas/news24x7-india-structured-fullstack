import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import RedirectResponse
from httpx import AsyncClient
from jose import JWTError, jwt
from ..config import settings
from ..database import db
from ..schemas import LoginInput, OAuthExchangeInput, RegisterInput
from ..security import create_token, current_user, passwords, public_user, set_session_cookie

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register")
def register(body: RegisterInput, response: Response):
    email = str(body.email).lower()
    if db.users.find_one({"email": email}): raise HTTPException(409, "Email already registered")
    user = {"name": body.name.strip(), "email": email, "password_hash": passwords.hash(body.password), "provider": "email", "role": "super_admin" if db.users.count_documents({}) == 0 else "reporter", "active": True, "created_at": datetime.now(timezone.utc)}
    user["_id"] = db.users.insert_one(user).inserted_id; set_session_cookie(response, create_token(user))
    return {"user": public_user(user)}

@router.post("/login")
def login(body: LoginInput, response: Response):
    user = db.users.find_one({"email": str(body.email).lower()})
    if not user or not user.get("password_hash") or not passwords.verify(body.password, user["password_hash"]): raise HTTPException(401, "Incorrect email or password")
    if not user.get("active", True): raise HTTPException(403, "Account disabled")
    set_session_cookie(response, create_token(user)); return {"user": public_user(user)}

@router.get("/google")
def google_start():
    if not settings.google_client_id or not settings.google_client_secret: raise HTTPException(503, "Google OAuth is not configured")
    state = jwt.encode({"nonce": secrets.token_urlsafe(12), "exp": datetime.now(timezone.utc) + timedelta(minutes=10)}, settings.jwt_secret, algorithm="HS256")
    query = urlencode({"client_id": settings.google_client_id, "redirect_uri": f"{settings.backend_url}/auth/google/callback", "response_type": "code", "scope": "openid email profile", "state": state, "prompt": "select_account"})
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{query}")

@router.get("/google/callback")
async def google_callback(code: str, state: str):
    try: jwt.decode(state, settings.jwt_secret, algorithms=["HS256"])
    except JWTError: raise HTTPException(400, "Invalid OAuth state")
    async with AsyncClient(timeout=15) as http:
        token_response = await http.post("https://oauth2.googleapis.com/token", data={"code": code, "client_id": settings.google_client_id, "client_secret": settings.google_client_secret, "redirect_uri": f"{settings.backend_url}/auth/google/callback", "grant_type": "authorization_code"})
        token_response.raise_for_status(); access = token_response.json()["access_token"]
        info = (await http.get("https://openidconnect.googleapis.com/v1/userinfo", headers={"authorization": f"Bearer {access}"})).json()
    email = info["email"].lower(); user = db.users.find_one({"email": email})
    if not user:
        user = {"name": info.get("name") or email.split("@")[0], "email": email, "provider": "google", "google_sub": info["sub"], "avatar": info.get("picture"), "role": "super_admin" if db.users.count_documents({}) == 0 else "reporter", "active": True, "created_at": datetime.now(timezone.utc)}
        user["_id"] = db.users.insert_one(user).inserted_id
    exchange_code = secrets.token_urlsafe(32)
    db.oauth_codes.insert_one({"code": exchange_code, "user_id": user["_id"], "expires_at": datetime.now(timezone.utc) + timedelta(minutes=2)})
    return RedirectResponse(f"{settings.frontend_url}/auth/callback?code={exchange_code}")

@router.post("/exchange")
def exchange(body: OAuthExchangeInput, response: Response):
    item = db.oauth_codes.find_one_and_delete({"code": body.code, "expires_at": {"$gt": datetime.now(timezone.utc)}})
    if not item: raise HTTPException(400, "Expired login code")
    user = db.users.find_one({"_id": item["user_id"]}); set_session_cookie(response, create_token(user))
    return {"user": public_user(user)}

@router.get("/me")
def me(user=Depends(current_user)): return {"user": public_user(user)}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("news_token", path="/")
    return {"ok": True}
