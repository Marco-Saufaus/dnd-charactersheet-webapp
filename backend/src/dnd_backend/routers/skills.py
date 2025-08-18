from fastapi import APIRouter, HTTPException
from typing import Optional
import re
from dnd_backend.config.database import MongoManager
from dnd_backend.models.skill_model import Skill

router = APIRouter(prefix="/skills", tags=["skills"])

@router.get("/search", response_model=list[Skill])
async def list_skills(q: Optional[str] = None, source: Optional[str] = None, skip: int = 0, limit: int = 50):
    query: dict = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if source:
        query["source"] = source

    skills = []
    cursor = MongoManager.db.skills.find(query).skip(skip).limit(limit)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        skills.append(doc)
    return skills

@router.get("/{skill_id}")
async def get_skill(skill_id: str):
    escaped = re.escape(skill_id)
    query = {"name": {"$regex": f"^{escaped}$", "$options": "i"}}
    doc = await MongoManager.db.skills.find_one(query)
    if doc:
        doc["_id"] = str(doc["_id"])
        return doc
    raise HTTPException(status_code=404, detail="Skill not found")
