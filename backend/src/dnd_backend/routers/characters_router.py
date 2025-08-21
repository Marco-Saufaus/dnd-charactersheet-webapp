from fastapi import APIRouter, HTTPException
from bson import ObjectId
from dnd_backend.config.database import MongoManager
from dnd_backend.models.character_model import Character

router = APIRouter(prefix="/characters", tags=["characters"])

@router.post("/", response_model=Character)
async def create_character(character: Character):
    character_dict = character.model_dump(by_alias=True, exclude={"id"})
    result = await MongoManager.db.characters.insert_one(character_dict)
    created_character = await MongoManager.db.characters.find_one({"_id": result.inserted_id})
    created_character["_id"] = str(created_character["_id"])
    return created_character

@router.get("/", response_model=list[Character])
async def list_characters():
    characters = []
    cursor = MongoManager.db.characters.find()
    async for document in cursor:
        document["_id"] = str(document["_id"])
        characters.append(document)
    return characters

@router.get("/{character_id}", response_model=Character)
async def get_character(character_id: str):
    try:
        character = await MongoManager.db.characters.find_one({"_id": ObjectId(character_id)})
        if character:
            character["_id"] = str(character["_id"])
            return character
        raise HTTPException(status_code=404, detail="Character not found")
    except Exception:
        raise HTTPException(status_code=404, detail="Character not found")
