from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class UserBase(BaseModel):
    email: EmailStr
    name: str
    preferred_language: str = "en"
    subscription_status: str = "free"

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    hashed_password: str
    created_date: datetime = Field(default_factory=datetime.utcnow)
    last_login_date: Optional[datetime] = None
    is_active: bool = True
    is_superuser: bool = False

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        
    @property
    def str_id(self) -> str:
        return str(self.id)

class User(BaseModel):
    id: str
    email: EmailStr
    name: str
    is_active: bool = True
    is_superuser: bool = False
    hashed_password: str
    preferred_language: str = "en"
    subscription_status: str = "free"

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    preferred_language: Optional[str] = None
    password: Optional[str] = None

class UserInResponse(BaseModel):
    user: User
    token: str 