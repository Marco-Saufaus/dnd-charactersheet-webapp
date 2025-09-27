from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class BaseClass(BaseModel):
    id: str = Field(alias="_id")
    name: str
    source: str
    page: Optional[int] = None
    srd52: Optional[bool] = None
    basicRules2024: Optional[bool] = None
    edition: Optional[str] = None
    primaryAbility: Optional[List[dict]] = None
    hd: Optional[dict] = None  # Hit die info
    proficiency: Optional[List[str]] = None
    classFeatures: Optional[List[Any]] = None  # List of class features for progression table
    classTableGroups: Optional[List[Dict]] = None  # Additional table data like Second Wind, etc.
    subclassTitle: Optional[str] = None
    hasFluff: Optional[bool] = None
    hasFluffImages: Optional[bool] = None
    entries: Optional[List[Any]] = None  # Class description entries
    startingProficiencies: Optional[Dict] = None
    startingEquipment: Optional[Dict] = None
    multiclassing: Optional[Dict] = None
    featProgression: Optional[List[Dict]] = None

    class Config:
        populate_by_name = True

class Subclass(BaseModel):
    id: str = Field(alias="_id")
    name: str
    shortName: Optional[str] = None
    source: str
    className: str
    classSource: str
    page: Optional[int] = None
    edition: Optional[str] = None
    srd52: Optional[bool] = None
    hasFluffImages: Optional[bool] = None

    class Config:
        populate_by_name = True
