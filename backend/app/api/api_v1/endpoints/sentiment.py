from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
from typing import List, Dict, Any
import os
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

router = APIRouter()

HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/nlptown/bert-base-multilingual-uncased-sentiment"
HUGGING_FACE_TOKEN = os.getenv("HUGGING_FACE_TOKEN")

class SentimentRequest(BaseModel):
    text: str

class AnalysisResponse(BaseModel):
    sentiment: Dict[str, Any]
    feedback: List[str]
    improvement_points: List[str]

@router.post("/analyze", response_model=Dict[str, Any])
async def analyze_sentiment(request: SentimentRequest) -> Dict[str, Any]:
    try:
        if not HUGGING_FACE_TOKEN:
            logger.error("Hugging Face API token not configured")
            raise HTTPException(status_code=500, detail="Hugging Face API token not configured")

        if not request.text.strip():
            return {
                "sentiment": {"label": "NEUTRAL", "score": 0.5},
                "feedback": ["No text provided for analysis"],
                "improvement_points": ["Please provide some text to analyze"]
            }

        logger.info(f"Analyzing text: {request.text[:100]}...")

        headers = {
            "Authorization": f"Bearer {HUGGING_FACE_TOKEN}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                HUGGING_FACE_API_URL,
                json={"inputs": request.text},
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code == 503:
                logger.warning("Model is loading, please try again in a few seconds")
                return {
                    "sentiment": {"label": "NEUTRAL", "score": 0.5},
                    "feedback": ["The analysis model is currently loading. Please try again."],
                    "improvement_points": []
                }
                
            response.raise_for_status()
            sentiment_data = response.json()
            
            logger.info(f"Received sentiment response: {sentiment_data}")

            if not sentiment_data or not isinstance(sentiment_data, list) or not sentiment_data[0]:
                raise HTTPException(status_code=500, detail="Invalid response from sentiment analysis model")

            # Process the sentiment result - the API returns an array of predictions
            predictions = sentiment_data[0]  # Get the first array of predictions
            
            # Sort predictions by score to get the highest rated sentiment
            sorted_predictions = sorted(predictions, key=lambda x: x['score'], reverse=True)
            top_prediction = sorted_predictions[0]
            
            # Extract the star rating from the label (e.g., "5 stars" -> 5)
            star_rating = int(top_prediction['label'].split()[0])
            normalized_score = (star_rating - 1) / 4

            # Generate feedback based on the star rating and confidence
            feedback = []
            improvement_points = []

            confidence_level = top_prediction['score']
            
            if star_rating >= 4:
                feedback.extend([
                    "Your response shows strong confidence and professionalism",
                    f"Your answer is very well structured with a confidence level of {confidence_level:.2%}"
                ])
                improvement_points.extend([
                    "Consider adding more quantifiable achievements",
                    "You could elaborate more on the impact of your actions"
                ])
            elif star_rating == 3:
                feedback.extend([
                    "Your response is clear and professional",
                    f"Your answer shows moderate confidence ({confidence_level:.2%})"
                ])
                improvement_points.extend([
                    "Try to include more specific examples",
                    "Add more details about your direct contributions",
                    "Consider using the STAR method (Situation, Task, Action, Result)"
                ])
            else:
                feedback.extend([
                    "You've addressed the question",
                    f"Your confidence level ({confidence_level:.2%}) could be improved"
                ])
                improvement_points.extend([
                    "Be more specific with your examples",
                    "Use more positive and confident language",
                    "Structure your response with a clear beginning, middle, and end",
                    "Include measurable outcomes from your experiences"
                ])

            # Add length-based feedback
            word_count = len(request.text.split())
            if word_count < 50:
                improvement_points.append("Your response could be more detailed. Aim for at least 100 words.")
            elif word_count > 300:
                improvement_points.append("Consider being more concise while maintaining key details.")

            return {
                "sentiment": {
                    "label": "POSITIVE" if star_rating >= 4 else "NEUTRAL" if star_rating == 3 else "NEGATIVE",
                    "score": normalized_score,
                    "star_rating": star_rating,
                    "confidence": confidence_level
                },
                "feedback": feedback,
                "improvement_points": improvement_points
            }

    except httpx.HTTPError as e:
        logger.error(f"HTTP error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error communicating with sentiment analysis service: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.error(f"Sentiment data: {sentiment_data if 'sentiment_data' in locals() else 'No data'}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}") 