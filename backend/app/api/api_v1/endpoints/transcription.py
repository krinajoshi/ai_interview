from fastapi import APIRouter, Depends, HTTPException, status, Body
from pydantic import BaseModel
from typing import Optional
import logging

from ....models.user import User
from ....core.deps import get_current_user
from ....services.ai_service import transcribe_audio_huggingface

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

class TranscriptionRequest(BaseModel):
    mediaUrl: str
    mediaType: str

@router.post("")
async def transcribe_audio(
    request: TranscriptionRequest,
    current_user: User = Depends(get_current_user)
):
    """Transcribe audio or video"""
    try:
        logger.info(f"Transcribing {request.mediaType} from {request.mediaUrl[:30]}...")
        
        # Transcribe the audio
        transcription = await transcribe_audio_huggingface(request.mediaUrl)
        
        return {"transcription": transcription}
    except Exception as e:
        logger.error(f"Error transcribing audio: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to transcribe audio: {str(e)}"
        )