from fastapi import APIRouter, HTTPException
from typing import Optional
import re
from dnd_backend.config.database import MongoManager
from dnd_backend.models.action_model import Action

router = APIRouter(prefix="/actions", tags=["actions"])

@router.get("/search", response_model=list[Action])
async def list_actions(q: Optional[str] = None, source: Optional[str] = None, skip: int = 0, limit: int = 50):
    query: dict = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if source:
        query["source"] = source

    actions = []
    cursor = MongoManager.db.actions.find(query).skip(skip).limit(limit)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        actions.append(doc)
    return actions

@router.get("/{action_id}")
async def get_action(action_id: str):
    escaped = re.escape(action_id)
    query = {"name": {"$regex": f"^{escaped}$", "$options": "i"}}
    doc = await MongoManager.db.actions.find_one(query)
    if doc:
        doc["_id"] = str(doc["_id"])
        return doc
    raise HTTPException(status_code=404, detail="Action not found")
