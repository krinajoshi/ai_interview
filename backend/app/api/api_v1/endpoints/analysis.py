from typing import Dict
from fastapi import APIRouter, HTTPException
from app.services.cohere_service import CohereService
from app.models.analysis import AnalysisRequest, QuestionForAnalysis
import logging

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()
cohere_service = CohereService()

@router.post("/analyze")
async def analyze_answer(request: AnalysisRequest):
    try:
        logger.debug(f"Received analysis request for question: {request.question}")
        logger.debug(f"Answer length: {len(request.answer)} characters")
        
        # Create a simplified question object for analysis
        question = QuestionForAnalysis(
            text=request.question,
            context=None,
            expected_points=None
        )
        
        # Get analysis from Cohere
        logger.debug("Calling Cohere service for analysis")
        analysis = await cohere_service.analyze_answer(question, request.answer)
        logger.debug(f"Received analysis result: {analysis}")
        
        # Return the analysis result directly
        return analysis
        
    except Exception as e:
        logger.error(f"Error in analyze_answer: {str(e)}", exc_info=True)
        # Return a fallback response
        return {
            "score": 50,
            "feedback": "Analysis service is currently unavailable. Please try again later.",
            "comments": [],
            "suggestions": [],
            "sentiment": {
                "score": 0.5,
                "label": "NEUTRAL"
            },
            "improvement_points": []
        } 