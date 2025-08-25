from fastapi import APIRouter, HTTPException
from typing import Optional
import re
from dnd_backend.config.database import MongoManager
from dnd_backend.models.spell_model import Spell

router = APIRouter(prefix="/spells", tags=["spells"])

CATEGORY_MAP: dict[str, dict] = {
    "0": {"code": "0", "label": "Cantrips"},
    "1": {"code": "1", "label": "Level 1"},
    "2": {"code": "2", "label": "Level 2"},
    "3": {"code": "3", "label": "Level 3"},
    "4": {"code": "4", "label": "Level 4"},
    "5": {"code": "5", "label": "Level 5"},
    "6": {"code": "6", "label": "Level 6"},
    "7": {"code": "7", "label": "Level 7"},
    "8": {"code": "8", "label": "Level 8"},
    "9": {"code": "9", "label": "Level 9"},
}

def _serialize(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc

@router.get("/search", response_model=list[Spell])
async def list_spells(q: Optional[str] = None, source: Optional[str] = None, skip: int = 0, limit: int = 80):
    query: dict = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if source:
        query["source"] = source

    spells: list[dict] = []
    cursor = MongoManager.db.spells.find(query).skip(skip).limit(limit)
    async for doc in cursor:
        spells.append(_serialize(doc))
    return spells

@router.get("/categories")
async def list_categories():
    out = []
    for slug, meta in CATEGORY_MAP.items():
        # Support either a single code (legacy) or multiple codes.
        codes: list[str]
        if "codes" in meta:
            codes = meta["codes"]
            query = {"category": {"$in": codes}}
        else:
            codes = [meta["code"]]
            query = {"category": codes[0]}

        count = await MongoManager.db.spells.count_documents(query)
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
        raise HTTPException(status_code=404, detail="Unknown spell category")
    # Determine codes list
    codes: list[str] = meta.get("codes") or [meta["code"]]
    spells: list[dict] = []
    cursor = MongoManager.db.spells.find({"category": {"$in": codes}})
    
    async for doc in cursor:
        spells.append(_serialize(doc))
    return {
        "category": {
            "slug": slug.lower(),
            # Preserve original single-code field if applicable
            **({"code": codes[0]} if len(codes) == 1 else {}),
            "codes": codes,
            "label": meta["label"],
            "count": len(spells),
        },
        "spells": spells,
    }

@router.get("/{spell_name}")
async def get_spell(spell_name: str):
    escaped = re.escape(spell_name)
    query = {"name": {"$regex": f"^{escaped}$", "$options": "i"}}
    doc = await MongoManager.db.spells.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail="Spell not found")
    return _serialize(doc)
