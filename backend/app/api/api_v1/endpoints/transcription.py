from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv
import logging
import json
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
    media_type: str = Form(...)
):
    try:
        if not HUGGING_FACE_TOKEN:
            logger.error("Hugging Face API token not configured")
            raise HTTPException(status_code=500, detail="Hugging Face API token not configured")

        logger.info(f"Starting transcription for {media_type} file: {file.filename}")
        logger.info(f"File content type: {file.content_type}")

        # Read file content
        file_content = await file.read()
        if not file_content:
            logger.error("Empty file received")
            return {
                "transcription": "",
                "message": "Empty file received. Please try again with a valid audio file."
            }

        # Send to Hugging Face for transcription
        headers = {
            "Authorization": f"Bearer {HUGGING_FACE_TOKEN}"
        }

        # Log request details
        logger.info(f"Sending request to Hugging Face API with content length: {len(file_content)}")

        async with httpx.AsyncClient(timeout=60.0) as client:  # Increased timeout for large files
            try:
                response = await client.post(
                    HUGGING_FACE_API_URL,
                    content=file_content,
                    headers=headers
                )

                logger.info(f"Hugging Face API Response Status: {response.status_code}")
                
                if response.status_code == 503:
                    logger.warning("Model is loading, please try again in a few seconds")
                    return {
                        "transcription": "",
                        "message": "The transcription model is currently loading. Please try again in a few seconds."
                    }
                elif response.status_code == 413:
                    logger.error("File too large")
                    return {
                        "transcription": "",
                        "message": "Audio file is too large. Please try with a shorter recording."
                    }
                
                response.raise_for_status()
                result = response.json()
                
                logger.info(f"Transcription result: {result}")

                if not result or not isinstance(result, dict):
                    logger.error(f"Unexpected response format: {result}")
                    return {
                        "transcription": "",
                        "message": "Invalid response from transcription service"
                    }

                transcribed_text = result.get("text", "").strip()
                if not transcribed_text:
                    logger.warning("No text transcribed from audio")
                    return {
                        "transcription": "",
                        "message": "No speech detected in the audio. Please try again."
                    }

                return {
                    "transcription": transcribed_text,
                    "message": "Transcription completed successfully"
                }

            except httpx.TimeoutException:
                logger.error("Request timed out")
                return {
                    "transcription": "",
                    "message": "Transcription request timed out. Please try with a shorter recording."
                }
            except httpx.HTTPError as e:
                logger.error(f"HTTP error occurred: {str(e)}")
                if hasattr(e, 'response'):
                    logger.error(f"Response status: {e.response.status_code}")
                    logger.error(f"Response body: {e.response.text}")
                return {
                    "transcription": "",
                    "message": f"Error during transcription: {str(e)}"
                }

    except Exception as e:
        logger.error(f"Unexpected error during transcription: {str(e)}")
        return {
            "transcription": "",
            "message": "An unexpected error occurred during transcription. Please try again."
        } 