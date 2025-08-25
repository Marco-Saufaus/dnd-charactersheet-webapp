from typing import Optional
from pydantic import BaseModel, Field

class Spell(BaseModel):
    id: str = Field(alias="_id")
    name: str
    source: Optional[str] = None
    page: Optional[int] = None
    basicRules: Optional[bool] = None
    level: Optional[int] = None
    school: Optional[str] = None
    time: Optional[str] = None
    range: Optional[str] = None
    components: Optional[str] = None
    duration: Optional[str] = None
    entries: Optional[list[str]] = None
    entriesHigherLevel: Optional[list[str]] = None
    damageInflict: Optional[str] = None
    savingThrow: Optional[str] = None
    areaTags: Optional[list[str]] = None
    miscTags: Optional[list[str]] = None

    class Config:
        populate_by_name = True
