from datetime import datetime
from typing import Optional
from fastapi import HTTPException
from passlib.context import CryptContext
from ..db.mongodb import find_one, find_many, insert_one, update_one
from ..models.user import UserCreate, UserInDB, User, UserUpdate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

async def get_user_by_email(email: str) -> Optional[UserInDB]:
    user_dict = await find_one("users", {"email": email})
    if user_dict:
        return UserInDB(**user_dict)
    return None

async def get_user_by_id(user_id: str) -> Optional[UserInDB]:
    user_dict = await find_one("users", {"_id": user_id})
    if user_dict:
        return UserInDB(**user_dict)
    return None

async def create_user(user: UserCreate) -> UserInDB:
    # Check if user already exists
    existing_user = await get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create new user
    user_dict = user.dict()
    hashed_password = get_password_hash(user_dict.pop("password"))
    db_user = UserInDB(
        **user_dict,
        hashed_password=hashed_password,
        created_date=datetime.utcnow()
    )
    
    user_id = await insert_one("users", db_user.dict(by_alias=True))
    db_user.id = user_id
    
    return db_user

async def authenticate_user(email: str, password: str) -> Optional[UserInDB]:
    user = await get_user_by_email(email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

# Helper function to convert UserInDB to User
def convert_to_user(db_user: UserInDB) -> User:
    user_dict = db_user.dict()
    user_dict["id"] = str(db_user.id)  # Convert ObjectId to string
    return User(**user_dict)

async def update_user(user_id: str, user_update: UserUpdate) -> UserInDB:
    update_data = user_update.dict(exclude_unset=True)
    
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    # Update user
    updated = await update_one(
        "users",
        {"_id": user_id},
        update_data
    )
    
    if not updated:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    return await get_user_by_id(user_id)

async def update_last_login(user_id: str) -> bool:
    updated = await update_one(
        "users",
        {"_id": user_id},
        {"last_login_date": datetime.utcnow()}
    )
    return bool(updated)

async def deactivate_user(user_id: str) -> bool:
    updated = await update_one(
        "users",
        {"_id": user_id},
        {"is_active": False}
    )
    return bool(updated)

async def get_user_statistics(user_id: str) -> dict:
    # Get user's interview statistics
    interviews = await find_many(
        "interviews",
        {"user_id": user_id}
    )
    
    total_interviews = len(interviews)
    completed_interviews = sum(1 for i in interviews if i["status"] == "completed")
    avg_score = sum(i.get("overall_score", 0) for i in interviews) / total_interviews if total_interviews > 0 else 0
    
    return {
        "total_interviews": total_interviews,
        "completed_interviews": completed_interviews,
        "average_score": avg_score,
        "last_interview_date": max((i["start_time"] for i in interviews), default=None)
    } 