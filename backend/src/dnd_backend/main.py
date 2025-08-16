from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from typing import Optional
import re  # Added for name-based lookup

from dnd_backend.config.database import MongoManager
from dnd_backend.models.character_model import Character
from dnd_backend.models.action_model import Action
from dnd_backend.models.background_model import Background
from dnd_backend.models.feat_model import Feat

app = FastAPI(
    title="D&D Character Sheet API",
    description="API for managing D&D character sheets",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    MongoManager.connect_to_database()

@app.on_event("shutdown")
async def shutdown_db_client():
    MongoManager.close_database_connection()

@app.get("/")
async def root():
    return {"message": "Welcome to D&D Character Sheet API"}

@app.post("/characters/", response_model=Character)
async def create_character(character: Character):
    # Remove id if it exists since MongoDB will generate one
    character_dict = character.model_dump(by_alias=True, exclude={"id"})
    
    # Insert the character into MongoDB
    result = await MongoManager.db.characters.insert_one(character_dict)
    
    # Get the created character and return it
    created_character = await MongoManager.db.characters.find_one({"_id": result.inserted_id})
    created_character["_id"] = str(created_character["_id"])  # Convert ObjectId to string
    return created_character

@app.get("/characters/", response_model=list[Character])
async def list_characters():
    characters = []
    cursor = MongoManager.db.characters.find()
    async for document in cursor:
        document["_id"] = str(document["_id"])  # Convert ObjectId to string
        characters.append(document)
    return characters

@app.get("/characters/{character_id}", response_model=Character)
async def get_character(character_id: str):
    try:
        character = await MongoManager.db.characters.find_one({"_id": ObjectId(character_id)})
        if character:
            character["_id"] = str(character["_id"])  # Convert ObjectId to string
            return character
        raise HTTPException(status_code=404, detail="Character not found")
    except:
        raise HTTPException(status_code=404, detail="Character not found")
    
@app.get("/search/actions", response_model=list[Action])
async def list_actions(q: Optional[str] = None, source: Optional[str] = None, skip: int = 0, limit: int = 50):
    # Build filter
    query: dict = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if source:
        query["source"] = source

    actions = []
    cursor = MongoManager.db.actions.find(query).skip(skip).limit(limit)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        actions.append(doc)
    return actions

@app.get("/actions/{action_id}")
async def get_action(action_id: str):
    try:
        query = {}
        if ObjectId.is_valid(action_id):
            query = {"_id": ObjectId(action_id)}
        else:
            # Exact (case-insensitive) name match; ^...$ prevents partial matches.
            escaped = re.escape(action_id)
            query = {"name": {"$regex": f"^{escaped}$", "$options": "i"}}

        doc = await MongoManager.db.actions.find_one(query)
        if not doc:
            raise HTTPException(status_code=404, detail="Action not found")
        doc["_id"] = str(doc["_id"])
        return doc
    except HTTPException:
        raise
    except Exception:
        # Broad except kept to mirror existing pattern; consider logging internally.
        raise HTTPException(status_code=404, detail="Action not found")
    
@app.get("/search/backgrounds", response_model=list[Background])
async def list_backgrounds(q: Optional[str] = None, source: Optional[str] = None, skip: int = 0, limit: int = 50):
    # Build filter
    query: dict = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if source:
        query["source"] = source

    backgrounds = []
    cursor = MongoManager.db.backgrounds.find(query).skip(skip).limit(limit)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        backgrounds.append(doc)
    return backgrounds

@app.get("/backgrounds/{background_id}")
async def get_background(background_id: str):
    try:
        query = {}
        if ObjectId.is_valid(background_id):
            query = {"_id": ObjectId(background_id)}
        else:
            # Exact (case-insensitive) name match; ^...$ prevents partial matches.
            escaped = re.escape(background_id)
            query = {"name": {"$regex": f"^{escaped}$", "$options": "i"}}

        doc = await MongoManager.db.backgrounds.find_one(query)
        if not doc:
            raise HTTPException(status_code=404, detail="Background not found")
        doc["_id"] = str(doc["_id"])
        return doc
    except HTTPException:
        raise
    except Exception:
        # Broad except kept to mirror existing pattern; consider logging internally.
        raise HTTPException(status_code=404, detail="Background not found")
    
@app.get("/search/feats", response_model=list[Feat])
async def list_feats(q: Optional[str] = None, source: Optional[str] = None, skip: int = 0, limit: int = 80):
    # Build filter
    query: dict = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if source:
        query["source"] = source

    feats = []
    cursor = MongoManager.db.feats.find(query).skip(skip).limit(limit)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        feats.append(doc)
    return feats

@app.get("/feats/{feat_id}")
async def get_feat(feat_id: str):
    try:
        query = {}
        if ObjectId.is_valid(feat_id):
            query = {"_id": ObjectId(feat_id)}
        else:
            # Exact (case-insensitive) name match; ^...$ prevents partial matches.
            escaped = re.escape(feat_id)
            query = {"name": {"$regex": f"^{escaped}$", "$options": "i"}}

        doc = await MongoManager.db.feats.find_one(query)
        if not doc:
            raise HTTPException(status_code=404, detail="Feat not found")
        doc["_id"] = str(doc["_id"])
        return doc
    except HTTPException:
        raise
    except Exception:
        # Broad except kept to mirror existing pattern; consider logging internally.
        raise HTTPException(status_code=404, detail="Feat not found")
