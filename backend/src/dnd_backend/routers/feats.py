from fastapi import APIRouter, HTTPException
from typing import Optional, List, Dict, Any
import re
from dnd_backend.config.database import MongoManager
from dnd_backend.models.feat_model import Feat

router = APIRouter(prefix="/feats", tags=["feats"])

# Slug -> { code, label }
CATEGORY_MAP: dict[str, dict[str, str]] = {
    "origin": {"code": "O", "label": "Origin Feats"},
    "general": {"code": "G", "label": "General Feats"},
    "fighting-style": {"code": "FS", "label": "Fighting Styles"},
    "epic-boon": {"code": "EB", "label": "Epic Boons"},
}

def _serialize(doc: Dict[str, Any]) -> Dict[str, Any]:
    doc["_id"] = str(doc["_id"])
    return doc

@router.get("/search", response_model=list[Feat])
async def list_feats(q: Optional[str] = None, source: Optional[str] = None, skip: int = 0, limit: int = 80):

    query: dict = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if source:
        query["source"] = source

    feats: List[Dict[str, Any]] = []
    
    cursor = MongoManager.db.feats.find(query).skip(skip).limit(limit)
    async for doc in cursor:
        feats.append(_serialize(doc))
    return feats

@router.get("/categories")
async def list_categories():

    out = []
    for slug, meta in CATEGORY_MAP.items():
        count = await MongoManager.db.feats.count_documents({"category": meta["code"]})
        out.append({
            "slug": slug,
            "code": meta["code"],
            "label": meta["label"],
            "count": count,
        })
    return out

@router.get("/category/{slug}")
async def get_category(slug: str):
    meta = CATEGORY_MAP.get(slug.lower())
    if not meta:
        raise HTTPException(status_code=404, detail="Unknown feat category")
    feats: List[Dict[str, Any]] = []
    cursor = MongoManager.db.feats.find({"category": meta["code"]})
    async for doc in cursor:
        feats.append(_serialize(doc))
    return {
        "category": {
            "slug": slug.lower(),
            "code": meta["code"],
            "label": meta["label"],
            "count": len(feats),
        },
        "feats": feats,
    }

@router.get("/{feat_name}")
async def get_feat(feat_name: str):
    escaped = re.escape(feat_name)
    query = {"name": {"$regex": f"^{escaped}$", "$options": "i"}}
    doc = await MongoManager.db.feats.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail="Feat not found")
    return _serialize(doc)
