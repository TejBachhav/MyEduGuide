from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId
from typing import Optional

class User(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "user"  # 'user' | 'admin'

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class UserInDB(User):
    password_hash: str

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "user"
