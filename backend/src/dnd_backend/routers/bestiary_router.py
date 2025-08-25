from fastapi import APIRouter, HTTPException
from typing import Optional
import re
from dnd_backend.config.database import MongoManager
from dnd_backend.models.bestiary_model import Bestiary

router = APIRouter(prefix="/bestiary", tags=["bestiary"])

CATEGORY_MAP: dict[str, dict] = {
    # Example categories for bestiary (adjust as needed)
    "beast": {"code": "B", "label": "Beasts"},
    "dragon": {"code": "D", "label": "Dragons"},
    "undead": {"code": "U", "label": "Undead"},
    # Add more as needed
}

def _serialize(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc

@router.get("/search", response_model=list[Bestiary])
async def list_bestiary(q: Optional[str] = None, source: Optional[str] = None, skip: int = 0, limit: int = 80):
    query: dict = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if source:
        query["source"] = source

    bestiary: list[dict] = []
    cursor = MongoManager.db.bestiary.find(query).skip(skip).limit(limit)
    async for doc in cursor:
        bestiary.append(_serialize(doc))
    return bestiary

@router.get("/categories")
async def list_categories():
    out = []
    for slug, meta in CATEGORY_MAP.items():
        codes: list[str]
        if "codes" in meta:
            codes = meta["codes"]
            query = {"category": {"$in": codes}}
        else:
            codes = [meta["code"]]
            query = {"category": codes[0]}
        count = await MongoManager.db.bestiary.count_documents(query)
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
        raise HTTPException(status_code=404, detail="Unknown bestiary category")
    codes: list[str] = meta.get("codes") or [meta["code"]]
    bestiary: list[dict] = []
    cursor = MongoManager.db.bestiary.find({"category": {"$in": codes}})
    async for doc in cursor:
        bestiary.append(_serialize(doc))
    return {
        "category": {
            "slug": slug.lower(),
            **({"code": codes[0]} if len(codes) == 1 else {}),
            "codes": codes,
            "label": meta["label"],
            "count": len(bestiary),
        },
        "bestiary": bestiary,
    }

@router.get("/{bestiary_name}")
async def get_bestiary(bestiary_name: str):
    escaped = re.escape(bestiary_name)
    query = {"name": {"$regex": f"^{escaped}$", "$options": "i"}}
    doc = await MongoManager.db.bestiary.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail="Bestiary entry not found")
    return _serialize(doc)
