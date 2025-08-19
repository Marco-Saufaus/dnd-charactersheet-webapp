from fastapi import APIRouter, HTTPException
from typing import Optional
import re
from dnd_backend.config.database import MongoManager
from dnd_backend.models.optionalfeature_model import OptionalFeature

router = APIRouter(prefix="/optional-features", tags=["optional"])

@router.get("/search", response_model=list[OptionalFeature])
async def list_optionalfeatures(q: Optional[str] = None, source: Optional[str] = None, skip: int = 0, limit: int = 50):
    query: dict = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if source:
        query["source"] = source

    optionalfeatures = []
    cursor = MongoManager.db.optionalfeatures.find(query).skip(skip).limit(limit)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        optionalfeatures.append(doc)
    return optionalfeatures

@router.get("/{optionalfeature_id}")
async def get_optionalfeature(optionalfeature: str):
    escaped = re.escape(optionalfeature)
    query = {"name": {"$regex": f"^{escaped}$", "$options": "i"}}
    doc = await MongoManager.db.optionalfeatures.find_one(query)
    if doc:
        doc["_id"] = str(doc["_id"])
        return doc
    raise HTTPException(status_code=404, detail="Optional Feature not found")
