from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from pydantic import BaseModel
from typing import Optional
import logging
import tempfile
import os

from ....models.user import User
from ....core.deps import get_current_user
from ....services.ai_service import transcribe_audio_huggingface

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("")
async def transcribe_audio(
    file: UploadFile = File(...),
    mediaType: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    """Transcribe audio or video"""
    try:
        logger.info(f"Transcribing {mediaType} file: {file.filename}")
        
        # Save the uploaded file to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{mediaType}") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Transcribe the audio
            transcription = await transcribe_audio_huggingface(temp_file_path)
            return {"transcription": transcription}
        finally:
            # Clean up the temporary file
            os.unlink(temp_file_path)
            
    except Exception as e:
        logger.error(f"Error transcribing audio: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to transcribe audio: {str(e)}"
        )