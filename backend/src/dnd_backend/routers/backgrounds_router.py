from fastapi import APIRouter, HTTPException
from typing import Optional
import re
from dnd_backend.config.database import MongoManager
from dnd_backend.models.background_model import Condition

router = APIRouter(prefix="/backgrounds", tags=["backgrounds"])

@router.get("/search", response_model=list[Condition])
async def list_backgrounds(q: Optional[str] = None, source: Optional[str] = None, skip: int = 0, limit: int = 50):
    query: dict = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if source:
        query["source"] = source

    backgrounds = []
    cursor = MongoManager.db.backgrounds.find(query).skip(skip).limit(limit)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        backgrounds.append(doc)
    return backgrounds

@router.get("/{background_id}")
async def get_background(background_id: str):
    escaped = re.escape(background_id)
    query = {"name": {"$regex": f"^{escaped}$", "$options": "i"}}
    doc = await MongoManager.db.backgrounds.find_one(query)
    if doc:
        doc["_id"] = str(doc["_id"])
        return doc
    raise HTTPException(status_code=404, detail="Background not found")
