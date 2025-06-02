from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Optional
import logging

from ....models.user import User
from ....core.deps import get_current_user
from ....services.ai_service import generate_questions

# Configure logging
logger = logging.getLogger(__name__)

# Request models
class GenerateQuestionsRequest(BaseModel):
    job_title: str
    job_description: Optional[str] = None
    language: str = "en"

router = APIRouter()

@router.post("/generate-questions")
async def generate_interview_questions(
    request: GenerateQuestionsRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate interview questions based on job title and description"""
    try:
        logger.info(f"Generating questions for job title: {request.job_title}, language: {request.language}")
        
        # Generate questions using AI service
        questions = await generate_questions(
            request.job_title, 
            request.job_description, 
            request.language
        )
        
        logger.info(f"Generated {len(questions)} questions")
        
        return {
            "questions": questions,
            "job_title": request.job_title,
            "language": request.language
        }
    except Exception as e:
        logger.error(f"Error generating questions: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate questions: {str(e)}"
        )

@router.get("/{interview_id}")
async def get_interview(
    interview_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get interview by ID"""
    # This would normally fetch from database
    return {
        "id": interview_id,
        "user_id": current_user.id,
        "status": "in_progress",
        "questions": [
            {
                "id": "q1",
                "text": "Tell me about yourself",
                "type": "behavioral"
            }
        ]
    }

class CreateInterviewRequest(BaseModel):
    job_title: str
    language: str = "en"

@router.post("")
async def create_interview(
    request: CreateInterviewRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a new interview"""
    return {
        "id": "interview_123",
        "user_id": current_user.id,
        "job_title": request.job_title,
        "language": request.language,
        "status": "created"
    }