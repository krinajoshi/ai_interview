from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, List
from ....models.user import User
from ....core.deps import get_current_user
from ....services.cohere_service import analyze_sentiment

router = APIRouter()

@router.post("/analyze")
async def analyze_text_sentiment(
    text: str,
    current_user: User = Depends(get_current_user)
) -> Dict:
    """Analyze sentiment of text using Cohere API"""
    try:
        sentiment_result = await analyze_sentiment(text)
        return sentiment_result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze sentiment: {str(e)}"
        )

@router.post("/batch")
async def analyze_batch_sentiment(
    texts: List[str],
    current_user: User = Depends(get_current_user)
) -> List[Dict]:
    """Analyze sentiment of multiple texts using Cohere API"""
    try:
        results = []
        for text in texts:
            sentiment_result = await analyze_sentiment(text)
            results.append(sentiment_result)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze batch sentiment: {str(e)}"
        )