from fastapi import APIRouter, HTTPException
from typing import Optional, List, Dict, Any
import re
from dnd_backend.config.database import MongoManager
from dnd_backend.models.feat_model import Feat

router = APIRouter(prefix="/feats", tags=["feats"])

CATEGORY_MAP: dict[str, dict[str, Any]] = {
    # Single-code categories keep the previous shape {code: str}
    "origin": {"code": "O", "label": "Origin Feats"},
    "general": {"code": "G", "label": "General Feats"},
    # Fighting styles span multiple category codes in the data source; expose via "codes"
    "fighting-style": {"codes": ["FS", "FS:P", "FS:R"], "label": "Fighting Styles"},
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
        # Support either a single code (legacy) or multiple codes.
        codes: List[str]
        if "codes" in meta:
            codes = meta["codes"]
            query = {"category": {"$in": codes}}
        else:
            codes = [meta["code"]]
            query = {"category": codes[0]}
        count = await MongoManager.db.feats.count_documents(query)
        # Keep "code" field for backward compatibility when there is only one; also add "codes" consistently.
        payload = {
            "slug": slug,
            "label": meta["label"],
            "count": count,
            "codes": codes,
        }
        if len(codes) == 1:
            payload["code"] = codes[0]
        out.append(payload)
    return out

@router.get("/category/{slug}")
async def get_category(slug: str):
    meta = CATEGORY_MAP.get(slug.lower())
    if not meta:
        raise HTTPException(status_code=404, detail="Unknown feat category")
    # Determine codes list
    codes: List[str] = meta.get("codes") or [meta["code"]]
    feats: List[Dict[str, Any]] = []
    cursor = MongoManager.db.feats.find({"category": {"$in": codes}})
    async for doc in cursor:
        feats.append(_serialize(doc))
    return {
        "category": {
            "slug": slug.lower(),
            # Preserve original single-code field if applicable
            **({"code": codes[0]} if len(codes) == 1 else {}),
            "codes": codes,
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
