from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta

from ....core.config import settings
from ....core.security import create_access_token
from ....models.user import User, UserCreate, UserUpdate, UserInResponse
from ....services.user_service import (
    create_user,
    authenticate_user,
    get_user_by_id,
    update_user,
    update_last_login,
    deactivate_user,
    get_user_statistics
)
from ....core.deps import get_current_user

router = APIRouter()

@router.post("/register", response_model=UserInResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    try:
        db_user = await create_user(user_data)
        
        # Create access token
        access_token = create_access_token(
            subject=str(db_user.id),
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        # Convert UserInDB to User
        user = User(
            id=str(db_user.id),
            email=db_user.email,
            name=db_user.name,
            is_active=db_user.is_active,
            is_superuser=db_user.is_superuser,
            hashed_password=db_user.hashed_password,
            preferred_language=db_user.preferred_language,
            subscription_status=db_user.subscription_status
        )
        return UserInResponse(user=user, token=access_token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login", response_model=UserInResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login user and return access token"""
    try:
        db_user = await authenticate_user(form_data.username, form_data.password)
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Update last login
        await update_last_login(str(db_user.id))
        
        # Create access token
        access_token = create_access_token(
            subject=str(db_user.id),
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        # Convert UserInDB to User
        user = User(
            id=str(db_user.id),
            email=db_user.email,
            name=db_user.name,
            is_active=db_user.is_active,
            is_superuser=db_user.is_superuser,
            hashed_password=db_user.hashed_password,
            preferred_language=db_user.preferred_language,
            subscription_status=db_user.subscription_status
        )
        return UserInResponse(user=user, token=access_token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Login failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@router.put("/me", response_model=User)
async def update_user_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update current user information"""
    updated_user = await update_user(str(current_user.id), user_update)
    return updated_user

@router.delete("/me")
async def delete_user_me(current_user: User = Depends(get_current_user)):
    """Deactivate current user account"""
    success = await deactivate_user(str(current_user.id))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate user"
        )
    return {"message": "User deactivated successfully"}

@router.get("/me/statistics")
async def get_user_me_statistics(current_user: User = Depends(get_current_user)):
    """Get current user's statistics"""
    return await get_user_statistics(str(current_user.id))