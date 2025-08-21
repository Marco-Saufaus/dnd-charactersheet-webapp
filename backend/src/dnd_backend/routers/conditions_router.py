from fastapi import APIRouter, HTTPException
from typing import Optional
import re
from dnd_backend.config.database import MongoManager
from dnd_backend.models.condition_model import Condition

router = APIRouter(prefix="/conditions", tags=["conditions"])

@router.get("/search", response_model=list[Condition])
async def list_conditions(q: Optional[str] = None, source: Optional[str] = None, skip: int = 0, limit: int = 50):
    query: dict = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if source:
        query["source"] = source

    conditions = []
    cursor = MongoManager.db.conditions.find(query).skip(skip).limit(limit)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        conditions.append(doc)
    return conditions

@router.get("/{condition_id}")
async def get_condition(condition_id: str):
    escaped = re.escape(condition_id)
    query = {"name": {"$regex": f"^{escaped}$", "$options": "i"}}
    doc = await MongoManager.db.conditions.find_one(query)
    if doc:
        doc["_id"] = str(doc["_id"])
        return doc
    raise HTTPException(status_code=404, detail="Condition not found")
