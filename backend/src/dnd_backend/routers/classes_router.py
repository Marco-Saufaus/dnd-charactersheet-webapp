from fastapi import APIRouter, HTTPException
from typing import Optional, List
import re
from dnd_backend.config.database import MongoManager
from dnd_backend.models.class_model import BaseClass

router = APIRouter(prefix="/classes", tags=["classes"])

@router.get("/search", response_model=List[BaseClass])
async def list_classes(q: Optional[str] = None, source: Optional[str] = None, skip: int = 0, limit: int = 50):
    """Search and list D&D classes"""
    query: dict = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if source:
        query["source"] = source

    classes = []
    cursor = MongoManager.db.classes.find(query).skip(skip).limit(limit)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        classes.append(doc)
    return classes

@router.get("/{class_name}")
async def get_class(class_name: str):
    """Get a specific class by name with its available subclasses"""
    escaped = re.escape(class_name)
    query = {"name": {"$regex": f"^{escaped}$", "$options": "i"}}
    
    # Get the class
    class_doc = await MongoManager.db.classes.find_one(query)
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    class_doc["_id"] = str(class_doc["_id"])
    
    # Get available subclasses for this class
    subclass_query = {"className": {"$regex": f"^{escaped}$", "$options": "i"}}
    subclasses = []
    cursor = MongoManager.db.subclasses.find(subclass_query)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        subclasses.append(doc)

    # Get available class features for this class
    classFeature_query = {"className": {"$regex": f"^{escaped}$", "$options": "i"}}
    classFeaturesFull = []
    cursor = MongoManager.db.classFeatures.find(classFeature_query)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        classFeaturesFull.append(doc)

    # Get available subclass features for this class
    subclassFeature_query = {"className": {"$regex": f"^{escaped}$", "$options": "i"}}
    subclassFeaturesFull = []
    cursor = MongoManager.db.subclassFeature.find(subclassFeature_query)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        subclassFeaturesFull.append(doc)

    # Add subclasses, classFeatures and subclassFeatures list to the class response
    class_doc["subclasses"] = subclasses
    class_doc["classFeaturesFull"] = classFeaturesFull
    class_doc["subclassFeaturesFull"] = subclassFeaturesFull
    
    return class_doc