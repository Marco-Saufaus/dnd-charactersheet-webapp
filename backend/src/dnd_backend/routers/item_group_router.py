from fastapi import APIRouter, HTTPException
from typing import Optional
import re
from dnd_backend.config.database import MongoManager
from dnd_backend.models.item_group_model import ItemGroup

router = APIRouter(prefix="/item-groups", tags=["item-groups"])

@router.get("/search", response_model=list[ItemGroup])
async def list_itemgroups(q: Optional[str] = None, source: Optional[str] = None, skip: int = 0, limit: int = 50):
    query: dict = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if source:
        query["source"] = source

    itemgroups = []
    cursor = MongoManager.db.itemgroups.find(query).skip(skip).limit(limit)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        itemgroups.append(doc)
    return itemgroups

@router.get("/{itemgroup_id}")
async def get_itemgroup(itemgroup_id: str):
    escaped = re.escape(itemgroup_id)
    query = {"name": {"$regex": f"^{escaped}$", "$options": "i"}}
    doc = await MongoManager.db.itemgroups.find_one(query)
    if doc:
        doc["_id"] = str(doc["_id"])
        return doc
    raise HTTPException(status_code=404, detail="ItemGroup not found")
