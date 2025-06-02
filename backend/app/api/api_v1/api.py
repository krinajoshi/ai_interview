from fastapi import APIRouter
from .endpoints import users, analysis, transcription, interviews

api_router = APIRouter()

# Include API endpoints
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
api_router.include_router(transcription.router, prefix="/transcription", tags=["transcription"])
api_router.include_router(interviews.router, prefix="/interviews", tags=["interviews"])