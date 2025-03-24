from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv
import logging
from typing import Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

router = APIRouter()

HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/openai/whisper-large-v3"
HUGGING_FACE_TOKEN = os.getenv("HUGGING_FACE_TOKEN")

@router.post("/analyze")
async def transcribe_media(
    file: UploadFile = File(...),
    media_type: str = Form(...),  # 'audio' or 'video'
):
    try:
        if not HUGGING_FACE_TOKEN:
            logger.error("Hugging Face API token not configured")
            raise HTTPException(status_code=500, detail="Hugging Face API token not configured")

        logger.info(f"Starting transcription for {media_type} file: {file.filename}")

        # Read the file content
        file_content = await file.read()
        
        if not file_content:
            raise HTTPException(status_code=400, detail="Empty file provided")

        # Send to Hugging Face for transcription
        headers = {
            "Authorization": f"Bearer {HUGGING_FACE_TOKEN}",
            "Content-Type": "application/x-binary"
        }

        async with httpx.AsyncClient() as client:
            logger.info("Sending file to Hugging Face API...")
            response = await client.post(
                HUGGING_FACE_API_URL,
                content=file_content,
                headers=headers,
                timeout=30.0
            )

            if response.status_code == 503:
                logger.warning("Model is loading, please try again in a few seconds")
                return {
                    "transcription": "",
                    "message": "The transcription model is currently loading. Please try again."
                }

            response.raise_for_status()
            result = response.json()

            logger.info(f"Transcription completed successfully: {result}")

            transcribed_text = result.get("text", "").strip()
            if not transcribed_text:
                logger.warning("No text was transcribed from the audio")
                return {
                    "transcription": "",
                    "message": "No speech was detected in the recording"
                }

            return {
                "transcription": transcribed_text,
                "message": "Transcription completed successfully"
            }

    except httpx.HTTPError as e:
        logger.error(f"HTTP error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during transcription: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}") 