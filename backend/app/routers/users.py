from fastapi import APIRouter, Depends, HTTPException
from ..database import db
from datetime import datetime, timezone
from ..schemas import CreateUserInput, UserRoleInput
from ..security import passwords, public_user, require_super_admin
from ..serializers import object_id

router = APIRouter(prefix="/users", tags=["users"])

@router.get("")
def list_users(_=Depends(require_super_admin)):
    return {"items": [public_user(x) for x in db.users.find().sort("created_at", 1)]}

@router.post("", status_code=201)
def create_user(body: CreateUserInput, _=Depends(require_super_admin)):
    email = str(body.email).strip().lower()
    if db.users.find_one({"email": email}):
        raise HTTPException(409, "Email already registered")
    account = {
        "name": body.name.strip(),
        "email": email,
        "password_hash": passwords.hash(body.password),
        "provider": "email",
        "role": body.role,
        "active": True,
        "created_at": datetime.now(timezone.utc),
    }
    account["_id"] = db.users.insert_one(account).inserted_id
    return {"user": public_user(account)}

@router.patch("/{user_id}")
def update_user(user_id: str, body: UserRoleInput, user=Depends(require_super_admin)):
    if str(user["_id"]) == user_id and (not body.active or body.role != user["role"]):
        raise HTTPException(400, "You cannot deactivate or change the role of your own account")
    db.users.update_one({"_id": object_id(user_id)}, {"$set": {"role": body.role, "active": body.active}})
    return {"ok": True}
