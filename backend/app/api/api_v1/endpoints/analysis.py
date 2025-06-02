from fastapi import APIRouter, Depends, HTTPException, status, Body
from pydantic import BaseModel
from typing import List, Dict, Optional
import logging

from ....models.user import User
from ....core.deps import get_current_user
from ....services.ai_service import evaluate_answer, analyze_voice, analyze_facial_metrics

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

class AnswerRequest(BaseModel):
    question: str
    answer: str
    reference_answer: Optional[str] = None
    code_submission: Optional[str] = None

@router.post("/answer")
async def analyze_answer(
    request: AnswerRequest,
    current_user: User = Depends(get_current_user)
):
    """Analyze an interview answer"""
    try:
        logger.info(f"Analyzing answer for question: {request.question[:50]}...")
        
        # Evaluate the answer
        result = await evaluate_answer(
            question=request.question,
            reference_answer=request.reference_answer or "",
            user_answer=request.answer,
            code_submission=request.code_submission
        )
        
        # Log the result structure for debugging
        logger.info(f"Evaluation result keys: {result.keys()}")
        
        # Transform the result to match the expected format
        transformed_result = {
            "correctness_score": result.get("correctness_score", 0.5),
            "clarity_score": result.get("clarity_score", 0.5),
            "depth_score": result.get("depth_score", 0.5),
            "confidence_score": result.get("confidence_score", 0.5),
            "feedback": result.get("feedback", "No feedback available"),
            "strengths": result.get("strengths", ["Clear explanation"]),
            "improvements": result.get("weaknesses", ["Could provide more examples"]),
            "suggestions": result.get("suggestions", ["Consider adding more details"]),
            "score": result.get("score", 0.5)
        }
        
        # Handle keywords
        if "keywords" in result and isinstance(result["keywords"], dict):
            transformed_result["keywords_found"] = result["keywords"].get("found", ["experience"])
            transformed_result["keywords_missing"] = result["keywords"].get("missing", ["specific examples"])
        else:
            transformed_result["keywords_found"] = result.get("keywords_found", ["experience"])
            transformed_result["keywords_missing"] = result.get("keywords_missing", ["specific examples"])
        
        # Add resources
        transformed_result["resources"] = result.get("resources", [
            {"title": "How to Answer Interview Questions Effectively", "url": "https://example.com/interview-tips"}
        ])
        
        return transformed_result
    except Exception as e:
        logger.error(f"Error analyzing answer: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze answer: {str(e)}"
        )

@router.post("/voice")
async def analyze_voice_recording(
    audio_data: bytes = Body(...),
    current_user: User = Depends(get_current_user)
):
    """Analyze voice recording"""
    try:
        result = await analyze_voice(audio_data)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze voice recording: {str(e)}"
        )

@router.post("/facial")
async def analyze_facial_expressions(
    video_data: bytes = Body(...),
    current_user: User = Depends(get_current_user)
):
    """Analyze facial expressions"""
    try:
        result = await analyze_facial_metrics(video_data)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze facial expressions: {str(e)}"
        )