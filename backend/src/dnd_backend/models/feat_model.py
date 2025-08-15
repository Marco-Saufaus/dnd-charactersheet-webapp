from typing import Optional
from pydantic import BaseModel, Field

class Feat(BaseModel):
    id: str = Field(alias="_id")
    name: str
    source: Optional[str] = None
    page: Optional[int] = None
    basicRules: Optional[bool] = None
    category: Optional[str] = None

    class Config:
        populate_by_name = True
