from typing import Optional
from pydantic import BaseModel, Field

class ItemProperty(BaseModel):
    id: str = Field(alias="_id")
    name: str
    source: Optional[str] = None
    page: Optional[int] = None
    basicRules: Optional[bool] = None
    abbreviation: Optional[str] = None
    entries: Optional[list] = None


    class Config:
        populate_by_name = True
