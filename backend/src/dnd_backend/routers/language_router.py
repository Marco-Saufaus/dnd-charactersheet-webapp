from fastapi import APIRouter, HTTPException
from typing import Optional
import re
from dnd_backend.config.database import MongoManager
from dnd_backend.models.language_model import Language

router = APIRouter(prefix="/languages", tags=["languages"])

CATEGORY_MAP: dict[str, dict] = {
    "standard": {"code": "standard", "label": "Standard Languages"},
    "rare": {"code": "rare", "label": "Rare Languages"},
}

def _serialize(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc

@router.get("/search", response_model=list[Language])
async def list_languagess(q: Optional[str] = None, source: Optional[str] = None, skip: int = 0, limit: int = 50):
    query: dict = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if source:
        query["source"] = source

    languages: list[dict] = []
    cursor = MongoManager.db.languages.find(query).skip(skip).limit(limit)
    async for doc in cursor:
        languages.append(_serialize(doc))
    return languages

@router.get("/categories")
async def list_categories():
    out = []
    for slug, meta in CATEGORY_MAP.items():
        codes: list[str]
        if "codes" in meta:
            codes = meta["codes"]
            query = {"type": {"$in": codes}}
        else:
            codes = [meta["code"]]
            query = {"type": codes[0]}
        count = await MongoManager.db.languages.count_documents(query)

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
        raise HTTPException(status_code=404, detail="Unknown language category")
    
    codes: list[str] = meta.get("codes") or [meta["code"]]
    languages: list[dict] = []
    cursor = MongoManager.db.languages.find({"type": {"$in": codes}})

    async for doc in cursor:
        languages.append(_serialize(doc))
    category_payload = {
        "slug": slug.lower(),
        **({"code": codes[0]} if len(codes) == 1 else {}),
        "codes": codes,
        "label": meta["label"],
        "count": len(languages),
    }
    # Return under key "category" to mirror feats endpoint structure; keep legacy alias "type" for safety.
    return {"category": category_payload, "type": category_payload, "languages": languages}

@router.get("/{language_name}")
async def get_language(language_name: str):
    escaped = re.escape(language_name)
    query = {"name": {"$regex": f"^{escaped}$", "$options": "i"}}
    doc = await MongoManager.db.languages.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail="Language not found")
    return _serialize(doc)
