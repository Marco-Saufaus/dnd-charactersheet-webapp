from fastapi import APIRouter, HTTPException
from typing import Optional
import re
from dnd_backend.config.database import MongoManager
from dnd_backend.models.feat_model import Feat

router = APIRouter(prefix="/feats", tags=["feats"])

@router.get("/search", response_model=list[Feat])
async def list_feats(q: Optional[str] = None, source: Optional[str] = None, skip: int = 0, limit: int = 80):
    query: dict = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if source:
        query["source"] = source

    feats = []
    cursor = MongoManager.db.feats.find(query).skip(skip).limit(limit)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        feats.append(doc)
    return feats

@router.get("/{feat}")
async def get_feat(feat: str):
    escaped = re.escape(feat)
    query = {"name": {"$regex": f"^{escaped}$", "$options": "i"}}
    doc = await MongoManager.db.feats.find_one(query)
    if doc:
        doc["_id"] = str(doc["_id"])
        return doc
    raise HTTPException(status_code=404, detail="Feat not found")
