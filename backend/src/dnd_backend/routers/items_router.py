from fastapi import APIRouter, HTTPException
from typing import Optional
import re
from dnd_backend.config.database import MongoManager
from dnd_backend.models.item_model import Item

router = APIRouter(prefix="/items", tags=["items"])

CATEGORY_MAP: dict[str, dict] = {
    # General items
    "general": {"codes": ["G|XPHB", "FD|XPHB", "TAH|XPHB", "EXP|XDMG", "TG|XDMG", "TB|XDMG"], "label": "General Items"},

    # Vehicles and mounts
    "vehicles": {"codes": ["AIR|XPHB", "VEH|XPHB", "SHP|XPHB"], "label": "Vehicles"},
    "mounts": {"codes": ["MNT|XPHB"], "label": "Mounts"},

    # Spellcasting focus
    "focus": {"codes": ["SCF|XPHB"], "label": "Spellcasting Focus"},

    # Tools and kits
    "tools": {"codes": ["AT|XPHB", "GS|XPHB", "T|XPHB"], "label": "Tools"},

    # Potions and Spellscrolls
    "potions": {"codes": ["P|XPHB"], "label": "Potions"},
    "scrolls": {"codes": ["SC|XPHB"], "label": "Spellscrolls"},

    # Magic Items (include empty/missing type via query helper)
    "magic": {"codes": ["M", "RD|XDMG", "WD|XDMG", "RG|XDMG", "S|XPHB", "HA|XPHB", "MA|XPHB", "LA|XPHB", "M|XPHB", "GV|XDMG"], "label": "Magic Items"},

    # Treasure and loot
    "treasure": {"codes": ["$G|XDMG", "$A|XDMG"], "label": "Treasure and Loot"},
}

def _query_for_category(slug: str, codes: list[str]) -> dict:
    # Default: exact match on 'type' against provided codes
    if slug == "magic":
        # Include magic item types: W, RG, RD, WD, GV, S, HA, MA, LA, M
        # Match exact type token immediately followed by a pipe (e.g., "RG|XDMG"), avoiding prefix hits like "MNT|XPHB" or "SC|XPHB".
        return {"$or": [
            {"type": {"$regex": r"^(?:W|RG|RD|WD|GV|S|HA|MA|LA|M)(?=\|)", "$options": "i"}},
            {"type": {"$exists": False}},
            {"type": None},
            {"type": ""},
        ]}
    return {"type": {"$in": codes}}

def _serialize(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc

@router.get("/search", response_model=list[Item])
async def list_items(q: Optional[str] = None, source: Optional[str] = None, skip: int = 0, limit: int = 80):
    query: dict = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if source:
        query["source"] = source

    items: list[dict] = []
    cursor = MongoManager.db.items.find(query).skip(skip).limit(limit)
    async for doc in cursor:
        items.append(_serialize(doc))
    return items

@router.get("/categories")
async def list_categories():
    out = []
    for slug, meta in CATEGORY_MAP.items():
        # Support either a single code (legacy) or multiple codes.
        codes: list[str]
        if "codes" in meta:
            codes = meta["codes"]
            query = _query_for_category(slug, codes)
        else:
            codes = [meta["code"]]
            query = _query_for_category(slug, codes)
        count = await MongoManager.db.items.count_documents(query)
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
    items: list[dict] = []
    cursor = MongoManager.db.items.find(_query_for_category(slug.lower(), codes))
    
    async for doc in cursor:
        items.append(_serialize(doc))
    return {
        "category": {
            "slug": slug.lower(),
            # Preserve original single-code field if applicable
            **({"code": codes[0]} if len(codes) == 1 else {}),
            "codes": codes,
            "label": meta["label"],
            "count": len(items),
        },
        "items": items,
    }

@router.get("/{item_name}")
async def get_item(item_name: str):
    escaped = re.escape(item_name)
    query = {"name": {"$regex": f"^{escaped}$", "$options": "i"}}
    doc = await MongoManager.db.items.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail="Item not found")
    return _serialize(doc)
