from fastapi import APIRouter, HTTPException
from typing import Optional
import re
from dnd_backend.config.database import MongoManager
from dnd_backend.models.variant_model import Variant

router = APIRouter(prefix="/variant-rules", tags=["variants"])

@router.get("/search", response_model=list[Variant])
async def list_variants(q: Optional[str] = None, source: Optional[str] = None, skip: int = 0, limit: int = 50):
    query: dict = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if source:
        query["source"] = source
    variants = []
    cursor = MongoManager.db.variants.find(query).skip(skip).limit(limit)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        variants.append(doc)
    return variants

@router.get("/{variant_id}")
async def get_variant(variant_id: str):
    escaped = re.escape(variant_id)
    query = {"name": {"$regex": f"^{escaped}$", "$options": "i"}}
    doc = await MongoManager.db.variants.find_one(query)
    if doc:
        doc["_id"] = str(doc["_id"])
        return doc
    raise HTTPException(status_code=404, detail="Variant Rule not found")
