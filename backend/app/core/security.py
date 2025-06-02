from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
import logging
from bson import ObjectId

from app.core.config import settings

# Configure logging
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    """
    Create a JWT access token.
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    # Convert ObjectId to string if needed
    if isinstance(subject, ObjectId):
        subject = str(subject)
    
    to_encode = {"exp": expire, "sub": subject}
    logger.info(f"Creating token for user: {subject}")
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hash a password.
    """
    return pwd_context.hash(password)

def verify_token(token: str) -> dict:
    """
    Verify a JWT token and return the payload.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        logger.info(f"Token verified with payload: {payload}")
        return payload
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise