from fastapi import APIRouter, HTTPException
from typing import Optional
import re
from dnd_backend.config.database import MongoManager
from dnd_backend.models.item_masteries_model import ItemMastery

router = APIRouter(prefix="/item-masteries", tags=["item-masteries"])

@router.get("/search", response_model=list[ItemMastery])
async def list_masteries(q: Optional[str] = None, source: Optional[str] = None, skip: int = 0, limit: int = 50):
    query: dict = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if source:
        query["source"] = source

    masteries = []
    cursor = MongoManager.db.masteries.find(query).skip(skip).limit(limit)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        masteries.append(doc)
    return masteries

@router.get("/{mastery_id}")
async def get_mastery(mastery_id: str):
    escaped = re.escape(mastery_id)
    query = {"name": {"$regex": f"^{escaped}$", "$options": "i"}}
    doc = await MongoManager.db.masteries.find_one(query)
    if doc:
        doc["_id"] = str(doc["_id"])
        return doc
    raise HTTPException(status_code=404, detail="Mastery not found")
