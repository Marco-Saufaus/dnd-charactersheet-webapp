from fastapi import APIRouter, HTTPException
from typing import Optional
import re
from dnd_backend.config.database import MongoManager
from dnd_backend.models.sense_model import Sense

router = APIRouter(prefix="/senses", tags=["senses"])

@router.get("/search", response_model=list[Sense])
async def list_senses(q: Optional[str] = None, source: Optional[str] = None, skip: int = 0, limit: int = 50):
    query: dict = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if source:
        query["source"] = source

    senses = []
    cursor = MongoManager.db.senses.find(query).skip(skip).limit(limit)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        senses.append(doc)
    return senses

@router.get("/{sense_id}")
async def get_sense(sense_id: str):
    escaped = re.escape(sense_id)
    query = {"name": {"$regex": f"^{escaped}$", "$options": "i"}}
    doc = await MongoManager.db.senses.find_one(query)
    if doc:
        doc["_id"] = str(doc["_id"])
        return doc
    raise HTTPException(status_code=404, detail="Sense not found")
