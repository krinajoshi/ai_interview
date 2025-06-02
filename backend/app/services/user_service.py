from typing import Optional, Dict, Any
from bson.objectid import ObjectId
from datetime import datetime
import logging

from ..models.user import UserCreate, UserUpdate, UserInDB, User
from ..core.security import get_password_hash, verify_password
from ..db.mongodb import get_database

# Configure logging
logger = logging.getLogger(__name__)

async def create_user(user_data: UserCreate) -> UserInDB:
    """
    Create a new user.
    """
    db = get_database()
    
    # Check if user with this email already exists
    existing_user = await db["users"].find_one({"email": user_data.email})
    if existing_user:
        raise ValueError("Email already registered")
    
    # Create user
    user_dict = {
        "email": user_data.email,
        "name": user_data.name,
        "hashed_password": get_password_hash(user_data.password),
        "preferred_language": user_data.preferred_language,
        "subscription_status": user_data.subscription_status,
        "created_date": datetime.utcnow(),
        "is_active": True,
        "is_superuser": False
    }
    
    # Insert user into database
    result = await db["users"].insert_one(user_dict)
    
    # Get the inserted user
    user_dict["_id"] = result.inserted_id
    
    # Convert to UserInDB model
    user_in_db = UserInDB(**user_dict)
    
    logger.info(f"Created user: {user_in_db.email} with ID: {user_in_db.id}")
    
    return user_in_db

async def authenticate_user(email: str, password: str) -> Optional[UserInDB]:
    """
    Authenticate a user.
    """
    db = get_database()
    
    # Find user by email
    user_data = await db["users"].find_one({"email": email})
    if not user_data:
        logger.warning(f"User not found with email: {email}")
        return None
    
    # Check if user is active
    if not user_data.get("is_active", True):
        logger.warning(f"Inactive user: {email}")
        return None
    
    # Check password
    if not verify_password(password, user_data["hashed_password"]):
        logger.warning(f"Invalid password for user: {email}")
        return None
    
    # Convert to UserInDB model
    user = UserInDB(**user_data)
    
    logger.info(f"User authenticated: {email} with ID: {user.id}")
    
    return user

async def get_user_by_id(user_id: str) -> Optional[UserInDB]:
    """
    Get a user by ID.
    """
    db = get_database()
    
    try:
        # Convert string ID to ObjectId
        object_id = ObjectId(user_id)
        
        # Find user by ID
        user_data = await db["users"].find_one({"_id": object_id})
        if not user_data:
            logger.warning(f"User not found with ID: {user_id}")
            return None
        
        # Convert to UserInDB model
        user = UserInDB(**user_data)
        
        return user
    except Exception as e:
        logger.error(f"Error getting user by ID: {str(e)}")
        return None

async def update_user(user_id: str, user_update: UserUpdate) -> User:
    """
    Update a user.
    """
    db = get_database()
    
    # Prepare update data
    update_data = user_update.dict(exclude_unset=True)
    
    # Hash password if provided
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    try:
        # Convert string ID to ObjectId
        object_id = ObjectId(user_id)
        
        # Update user
        await db["users"].update_one(
            {"_id": object_id},
            {"$set": update_data}
        )
        
        # Get updated user
        user_data = await db["users"].find_one({"_id": object_id})
        
        # Convert to User model
        user = User(
            id=str(user_data["_id"]),
            email=user_data["email"],
            name=user_data["name"],
            is_active=user_data.get("is_active", True),
            is_superuser=user_data.get("is_superuser", False),
            hashed_password=user_data["hashed_password"],
            preferred_language=user_data.get("preferred_language", "en"),
            subscription_status=user_data.get("subscription_status", "free")
        )
        
        return user
    except Exception as e:
        logger.error(f"Error updating user: {str(e)}")
        raise

async def update_last_login(user_id: str) -> bool:
    """
    Update a user's last login date.
    """
    db = get_database()
    
    try:
        # Convert string ID to ObjectId
        object_id = ObjectId(user_id)
        
        # Update last login date
        result = await db["users"].update_one(
            {"_id": object_id},
            {"$set": {"last_login_date": datetime.utcnow()}}
        )
        
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"Error updating last login: {str(e)}")
        return False

async def deactivate_user(user_id: str) -> bool:
    """
    Deactivate a user.
    """
    db = get_database()
    
    try:
        # Convert string ID to ObjectId
        object_id = ObjectId(user_id)
        
        # Deactivate user
        result = await db["users"].update_one(
            {"_id": object_id},
            {"$set": {"is_active": False}}
        )
        
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"Error deactivating user: {str(e)}")
        return False

async def get_user_statistics(user_id: str) -> Dict[str, Any]:
    """
    Get statistics for a user.
    """
    db = get_database()
    
    # Get interview count
    interview_count = await db["interviews"].count_documents({"user_id": user_id})
    
    # Get completed interview count
    completed_interview_count = await db["interviews"].count_documents({
        "user_id": user_id,
        "status": "completed"
    })
    
    # Get average score
    pipeline = [
        {"$match": {"user_id": user_id, "status": "completed"}},
        {"$group": {
            "_id": None,
            "avg_score": {"$avg": "$overall_score"}
        }}
    ]
    avg_score_result = await db["interviews"].aggregate(pipeline).to_list(1)
    avg_score = avg_score_result[0]["avg_score"] if avg_score_result else 0
    
    # Return statistics
    return {
        "total_interviews": interview_count,
        "completed_interviews": completed_interview_count,
        "average_score": avg_score,
        "last_interview_date": None  # TODO: Implement this
    }

# Add a mock user for testing if no users exist
async def create_mock_user_if_empty():
    """
    Create a mock user if no users exist.
    """
    db = get_database()
    
    try:
        # Check if any users exist
        user_count = await db["users"].count_documents({})
        logger.info(f"Found {user_count} users in database")
        
        if user_count == 0:
            # Create mock user
            mock_user = UserCreate(
                name="Test User",
                email="test@example.com",
                password="password123",
                preferred_language="en",
                subscription_status="free"
            )
            user = await create_user(mock_user)
            logger.info(f"Created mock user: test@example.com / password123 with ID: {user.id}")
            
            # Verify the user was created
            created_user = await db["users"].find_one({"email": "test@example.com"})
            if created_user:
                logger.info(f"Verified mock user exists with ID: {created_user['_id']}")
            else:
                logger.error("Failed to verify mock user creation")
    except Exception as e:
        logger.error(f"Error creating mock user: {str(e)}")

def convert_to_user(user_in_db: UserInDB) -> User:
    """
    Convert UserInDB to User.
    """
    return User(
        id=str(user_in_db.id),
        email=user_in_db.email,
        name=user_in_db.name,
        is_active=user_in_db.is_active,
        is_superuser=user_in_db.is_superuser,
        hashed_password=user_in_db.hashed_password,
        preferred_language=user_in_db.preferred_language,
        subscription_status=user_in_db.subscription_status
    )