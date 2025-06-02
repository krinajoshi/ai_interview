from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
import logging
from bson import ObjectId

from app.core.config import settings
from app.models.user import User
from app.db.mongodb import get_database
from app.core.security import verify_token

# Configure logging
logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/users/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """
    Get the current user from the token.
    """
    try:
        # Verify token and get user_id
        payload = verify_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            logger.error("Token missing sub field")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get user from database
        db = get_database()
        logger.info(f"Looking for user with ID: {user_id}")
        
        # Convert string ID to ObjectId
        try:
            object_id = ObjectId(user_id)
            user_data = await db["users"].find_one({"_id": object_id})
        except Exception as e:
            logger.error(f"Error converting user_id to ObjectId: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user ID format",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if user_data is None:
            logger.error(f"User not found with ID: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
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
        
        if not user.is_active:
            logger.error(f"Inactive user: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user",
            )
        
        return user
        
    except (JWTError, ValidationError) as e:
        logger.error(f"Token validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )