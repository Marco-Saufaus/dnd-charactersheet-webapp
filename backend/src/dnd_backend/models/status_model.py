from typing import Optional
from pydantic import BaseModel, Field

class Status(BaseModel):
    id: str = Field(alias="_id")
    name: str
    source: Optional[str] = None
    page: Optional[int] = None
    basicRules: Optional[bool] = None
    entries: Optional[list[str]] = None
    

    class Config:
        populate_by_name = True
