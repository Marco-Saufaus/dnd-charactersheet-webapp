from typing import Optional
from pydantic import BaseModel, Field

class ItemGroup(BaseModel):
    id: str = Field(alias="_id")
    name: str
    source: Optional[str] = None
    page: Optional[int] = None
    entries: Optional[list] = None

    class Config:
        populate_by_name = True
