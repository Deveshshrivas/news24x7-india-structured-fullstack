import io
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import StreamingResponse
from ..database import audio_files, db
from ..security import ROLE_PERMISSIONS, current_user, require_permission
from ..serializers import object_id

router = APIRouter(prefix="/audio", tags=["audio-highlights"])

def response_item(item: dict) -> dict:
    return {"id": str(item["_id"]), "title": item["title"], "filename": item["filename"], "size": item["size"], "active": item["active"], "position": item["position"], "audioUrl": f"/audio/{item['_id']}/stream"}

@router.get("")
def list_audio(request: Request, admin: bool = False):
    if admin:
        user = current_user(request); allowed = ROLE_PERMISSIONS.get(user["role"], set())
        if "*" not in allowed and "audio" not in allowed: raise HTTPException(403, "Insufficient permission")
    query, limit = ({} if admin else {"active": True}), (0 if admin else 10)
    cursor = db.audio_tracks.find(query).sort("position", 1)
    if limit: cursor = cursor.limit(limit)
    return {"items": [response_item(x) for x in cursor]}

@router.post("")
def upload_audio(title: str = Form(...), audio: UploadFile = File(...), _=Depends(require_permission("audio"))):
    if not (audio.filename or "").lower().endswith(".mp3"): raise HTTPException(415, "Only MP3 files are allowed")
    data = audio.file.read(25 * 1024 * 1024 + 1)
    if len(data) > 25 * 1024 * 1024: raise HTTPException(413, "MP3 must be 25 MB or smaller")
    file_id = audio_files.put(data, filename=audio.filename, content_type="audio/mpeg")
    position = (db.audio_tracks.find_one(sort=[("position", -1)]) or {}).get("position", 0) + 1
    document = {"title": title.strip(), "filename": audio.filename, "size": len(data), "file_id": file_id, "active": True, "position": position, "created_at": datetime.now(timezone.utc)}
    document["_id"] = db.audio_tracks.insert_one(document).inserted_id
    return response_item(document)

@router.patch("/{item_id}")
async def update_audio(item_id: str, request: Request, _=Depends(require_permission("audio"))):
    body = await request.json(); current = db.audio_tracks.find_one({"_id": object_id(item_id)}); direction = body.get("direction")
    if current and direction in {"up", "down"}:
        operator, order = ("$lt", -1) if direction == "up" else ("$gt", 1)
        other = db.audio_tracks.find_one({"position": {operator: current["position"]}}, sort=[("position", order)])
        if other:
            db.audio_tracks.update_one({"_id": current["_id"]}, {"$set": {"position": other["position"]}})
            db.audio_tracks.update_one({"_id": other["_id"]}, {"$set": {"position": current["position"]}})
    updates = {k: v for k, v in body.items() if k in {"title", "active", "position"}}
    if updates: db.audio_tracks.update_one({"_id": object_id(item_id)}, {"$set": updates})
    return {"ok": True}

@router.delete("/{item_id}")
def delete_audio(item_id: str, _=Depends(require_permission("audio"))):
    row = db.audio_tracks.find_one_and_delete({"_id": object_id(item_id)})
    if row:
        try: audio_files.delete(row["file_id"])
        except Exception: pass
    return {"ok": True}

@router.get("/{item_id}/stream")
def stream_audio(item_id: str):
    row = db.audio_tracks.find_one({"_id": object_id(item_id), "active": True})
    if not row: raise HTTPException(404, "Not found")
    file = audio_files.get(row["file_id"])
    return StreamingResponse(io.BytesIO(file.read()), media_type="audio/mpeg", headers={"Content-Disposition": f'inline; filename="{row["filename"]}"', "Cache-Control": "public, max-age=3600"})
