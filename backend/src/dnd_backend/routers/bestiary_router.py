from fastapi import APIRouter, HTTPException
from typing import Optional
import re
from dnd_backend.config.database import MongoManager
from dnd_backend.models.bestiary_model import Bestiary

router = APIRouter(prefix="/bestiary", tags=["bestiary"])

@router.get("/search", response_model=list[Bestiary])
async def list_bestiary(q: Optional[str] = None, source: Optional[str] = None, skip: int = 0, limit: int = 50):
    query: dict = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if source:
        query["source"] = source

    bestiary = []
    cursor = MongoManager.db.bestiary.find(query).skip(skip).limit(limit)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        bestiary.append(doc)
    return bestiary

@router.get("/{bestiary_id}")
async def get_bestiary(bestiary_id: str):
    escaped = re.escape(bestiary_id)
    query = {"name": {"$regex": f"^{escaped}$", "$options": "i"}}
    doc = await MongoManager.db.bestiary.find_one(query)
    if doc:
        doc["_id"] = str(doc["_id"])
        return doc
    raise HTTPException(status_code=404, detail="Bestiary entry not found")
