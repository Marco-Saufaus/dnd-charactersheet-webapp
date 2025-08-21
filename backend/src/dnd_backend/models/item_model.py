from typing import Optional
from pydantic import BaseModel, Field

class Item(BaseModel):
    id: str = Field(alias="_id")
    name: str
    source: Optional[str] = None
    page: Optional[int] = None
    basicRules: Optional[bool] = None
    category: Optional[str] = None
    rarity: Optional[str] = None
    type: Optional[str] = None
    tier: Optional[str] = None
    wondrous: Optional[bool] = None
    reqAttune: Optional[bool] = None
    weight: Optional[float] = None
    value: Optional[int] = None
    weaponCategory: Optional[str] = None
    property: Optional[str] = None
    mastery: Optional[str] = None
    range: Optional[str] = None
    dmg1: Optional[str] = None
    dmg2: Optional[str] = None
    dmgType: Optional[str] = None
    age: Optional[str] = None


    class Config:
        populate_by_name = True
