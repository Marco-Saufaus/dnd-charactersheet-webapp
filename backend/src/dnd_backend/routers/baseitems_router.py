from fastapi import APIRouter, HTTPException
from typing import Optional
import re
from dnd_backend.config.database import MongoManager
from dnd_backend.models.baseitem_model import BaseItem

router = APIRouter(prefix="/items", tags=["items"])

CATEGORY_MAP: dict[str, dict] = {
    # Weapons
    "weapons": {"codes": ["A|XPHB", "M|XPHB", "R|XPHB"], "label": "Weapons & Ammunition"},

    # Armor and Shields
    "armor": {"codes": ["HA|XPHB", "MA|XPHB", "LA|XPHB", "S|XPHB"], "label": "Armor & Shields"},

    # Spellcasting focus
    "focus": {"codes": ["SCF|XPHB"], "label": "Spellcasting Focus"},

    # Tools and kits
    "tools": {"codes": ["INS|XPHB"], "label": "Tools"},
}

def _serialize(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc

@router.get("/search", response_model=list[BaseItem])
async def list_baseitems(q: Optional[str] = None, source: Optional[str] = None, skip: int = 0, limit: int = 80):
    query: dict = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if source:
        query["source"] = source

    baseitems: list[dict] = []
    cursor = MongoManager.db.baseitems.find(query).skip(skip).limit(limit)
    async for doc in cursor:
        baseitems.append(_serialize(doc))
    return baseitems

@router.get("/categories")
async def list_categories():
    out = []
    for slug, meta in CATEGORY_MAP.items():
        # Support either a single code (legacy) or multiple codes.
        codes: list[str]
        if "codes" in meta:
            codes = meta["codes"]
            query = {"type": {"$in": codes}}
        else:
            codes = [meta["code"]]
            query = {"type": {"$in": codes}}
        count = await MongoManager.db.baseitems.count_documents(query)
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
        raise HTTPException(status_code=404, detail="Unknown item category")
    # Determine codes list
    codes: list[str] = meta.get("codes") or [meta["code"]]
    baseitems: list[dict] = []
    cursor = MongoManager.db.baseitems.find({"type": {"$in": codes}})
    
    async for doc in cursor:
        baseitems.append(_serialize(doc))
    return {
        "category": {
            "slug": slug.lower(),
            # Preserve original single-code field if applicable
            **({"code": codes[0]} if len(codes) == 1 else {}),
            "codes": codes,
            "label": meta["label"],
            "count": len(baseitems),
        },
        "baseitems": baseitems,
    }

@router.get("/{baseitem_name}")
async def get_baseitem(baseitem_name: str):
    escaped = re.escape(baseitem_name)
    query = {"name": {"$regex": f"^{escaped}$", "$options": "i"}}
    doc = await MongoManager.db.baseitems.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail="Item not found")
    return _serialize(doc)
