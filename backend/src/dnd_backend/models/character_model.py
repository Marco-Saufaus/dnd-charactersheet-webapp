from typing import Optional
from pydantic import BaseModel, Field


class Character(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    race: str
    character_class: str
    level: int = 1

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "name": "Gandalf",
                "race": "Human",
                "character_class": "Wizard",
                "level": 20,
            }
        }
