from fastapi import APIRouter, HTTPException
from typing import Optional, List, Dict, Any
import re
from dnd_backend.config.database import MongoManager
from dnd_backend.models.optionalfeature_model import OptionalFeature

router = APIRouter(prefix="/optional-features", tags=["optional"])

# Slug -> { code, label }
CATEGORY_MAP: dict[str, dict[str, str]] = {
    "invocation": {"code": "EI", "label": "Eldritch Invocations"},
    "maneuver": {"code": "MV:B", "label": "Battle Master Maneuvers"},
    "metamagic": {"code": "MM", "label": "Meta Magic"},
}

def _serialize(doc: Dict[str, Any]) -> Dict[str, Any]:
    doc["_id"] = str(doc["_id"])
    return doc

@router.get("/search", response_model=list[OptionalFeature])
async def list_optionalfeatures(q: Optional[str] = None, source: Optional[str] = None, skip: int = 0, limit: int = 50):

    query: dict = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if source:
        query["source"] = source

    optionalfeatures: List[Dict[str, Any]] = []

    cursor = MongoManager.db.optionalfeatures.find(query).skip(skip).limit(limit)
    async for doc in cursor:
        optionalfeatures.append(_serialize(doc))
    return optionalfeatures

@router.get("/categories")
async def list_categories():
    """Return optional feature categories with counts (counting optionalfeatures collection)."""
    out = []
    for slug, meta in CATEGORY_MAP.items():
        # Data uses featureType; allow either field (future-proof if we later normalize)
        code = meta["code"]
        count = await MongoManager.db.optionalfeatures.count_documents({
            "$or": [
                {"category": code},
                {"featureType": code},
                {"featureType": {"$in": [code]}},  # in case featureType is an array
            ]
        })
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
        raise HTTPException(status_code=404, detail="Unknown Optional Feature category")
    optionalfeatures: List[Dict[str, Any]] = []
    code = meta["code"]
    cursor = MongoManager.db.optionalfeatures.find({
        "$or": [
            {"category": code},
            {"featureType": code},
            {"featureType": {"$in": [code]}},
        ]
    })
    async for doc in cursor:
        optionalfeatures.append(_serialize(doc))
    return {
        "category": {
            "slug": slug.lower(),
            "code": meta["code"],
            "label": meta["label"],
            "count": len(optionalfeatures),
        },
        "optionalfeatures": optionalfeatures,
    }

@router.get("/{optionalfeature_name}")
async def get_optionalfeature(optionalfeature_name: str):
    escaped = re.escape(optionalfeature_name)
    query = {"name": {"$regex": f"^{escaped}$", "$options": "i"}}
    doc = await MongoManager.db.optionalfeatures.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail="Optional Feature not found")
    return _serialize(doc)