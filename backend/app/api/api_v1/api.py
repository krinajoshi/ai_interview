from fastapi import APIRouter, Depends, FastAPI, HTTPException, Body
from pydantic import BaseModel
from typing import Optional, List
from .endpoints import users, interviews, resumes, roles, sentiment, transcription
from .endpoints.interviews import router as interviews_router
from app.models.user import User
from app.core.deps import get_current_user
from app.services.interview_service import get_interview, create_interview
from app.models.interview import Interview, InterviewCreate, Question
from app.models.role import Role, Skill
from app.services.ai_service import generate_questions
from app.core.config import settings
import bson

# Define the input model for the legacy endpoint
class QuestionGenerationRequest(BaseModel):
    jobTitle: str
    resume: Optional[str] = None
    jobDescription: Optional[str] = None
    language: Optional[str] = "en"

api_router = APIRouter()

# Main routers
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(interviews.router, prefix="/interviews", tags=["interviews"])
api_router.include_router(resumes.router, prefix="/resumes", tags=["resumes"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(sentiment.router, prefix="/sentiment", tags=["sentiment"])
api_router.include_router(transcription.router, prefix="/transcription", tags=["transcription"])

# Create a custom handler for the legacy endpoint
async def legacy_generate_questions(
    request: QuestionGenerationRequest,
    current_user: User = Depends(get_current_user)
):
    """Legacy endpoint for backward compatibility with the frontend"""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"Using legacy endpoint to generate questions for job: {request.jobTitle}")
    logger.info(f"Authenticated user: {current_user.id}")
    
    try:
        # For testing, return a hardcoded set of questions in the exact format expected by the frontend
        formatted_questions = [
            {
                "id": "1",
                "text": {
                    "en": f"Tell me about your experience as a {request.jobTitle}.",
                    "fr": f"Parlez-moi de votre expérience en tant que {request.jobTitle}.",
                    "ar": f".{request.jobTitle} أخبرني عن خبرتك كـ"
                },
                "type": "behavioral"
            },
            {
                "id": "2",
                "text": {
                    "en": "Describe a challenging project you worked on.",
                    "fr": "Décrivez un projet difficile sur lequel vous avez travaillé.",
                    "ar": ".صف مشروعًا صعبًا عملت عليه"
                },
                "type": "behavioral"
            },
            {
                "id": "3",
                "text": {
                    "en": "How do you handle tight deadlines?",
                    "fr": "Comment gérez-vous les délais serrés?",
                    "ar": "كيف تتعامل مع المواعيد النهائية الضيقة؟"
                },
                "type": "behavioral"
            },
            {
                "id": "4",
                "text": {
                    "en": "What are your strengths and weaknesses?",
                    "fr": "Quelles sont vos forces et vos faiblesses?",
                    "ar": "ما هي نقاط قوتك وضعفك؟"
                },
                "type": "behavioral"
            },
            {
                "id": "5",
                "text": {
                    "en": "Where do you see yourself in 5 years?",
                    "fr": "Où vous voyez-vous dans 5 ans?",
                    "ar": "أين ترى نفسك بعد 5 سنوات؟"
                },
                "type": "behavioral"
            }
        ]
        
        # Store resume if provided
        resume_file_name = None
        if request.resume:
            resume_file_name = f"resume_{current_user.id}.txt"
            logger.info(f"Would store resume as {resume_file_name}")
        
        logger.info(f"Successfully generated {len(formatted_questions)} questions")
        # Log the formatted questions for debugging
        logger.info(f"First question sample: {formatted_questions[0] if formatted_questions else 'No questions'}")
        response_data = {
            "status": "success",
            "questions": formatted_questions,
            "resumeFileName": resume_file_name
        }
        logger.info(f"Sending response with {len(formatted_questions)} questions")
        return response_data
    except Exception as e:
        logger.error(f"Error generating questions: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return {
            "status": "error",
            "message": str(e)
        }

# Legacy interview endpoint (singular) for backward compatibility
legacy_interview_router = APIRouter(tags=["interviews"])
legacy_interview_router.add_api_route(
    "/generate-questions", 
    legacy_generate_questions, 
    methods=["POST"],
    deprecated=True,
    description="DEPRECATED: Legacy endpoint for the frontend"
)
api_router.include_router(legacy_interview_router, prefix="/interview") 