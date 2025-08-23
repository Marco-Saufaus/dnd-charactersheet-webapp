from fastapi import APIRouter, HTTPException
from typing import Optional
import re
from dnd_backend.config.database import MongoManager
from dnd_backend.models.item_properties_model import ItemProperty

router = APIRouter(prefix="/item-properties", tags=["item-properties"])

@router.get("/search", response_model=list[ItemProperty])
async def list_properties(q: Optional[str] = None, source: Optional[str] = None, skip: int = 0, limit: int = 50):
    query: dict = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if source:
        query["source"] = source

    properties = []
    cursor = MongoManager.db.properties.find(query).skip(skip).limit(limit)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        properties.append(doc)
    return properties

@router.get("/{property_id}")
async def get_property(property_id: str):
    escaped = re.escape(property_id)
    query = {"name": {"$regex": f"^{escaped}$", "$options": "i"}}
    doc = await MongoManager.db.properties.find_one(query)
    if doc:
        doc["_id"] = str(doc["_id"])
        return doc
    raise HTTPException(status_code=404, detail="Property not found")
