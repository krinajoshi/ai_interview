from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv
import logging
import json
from typing import Optional
import requests
from huggingface_hub import HfApi

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

router = APIRouter()

HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/openai/whisper-large-v3"
HUGGING_FACE_TOKEN = os.getenv("HUGGING_FACE_TOKEN")

@router.post("/transcribe")
async def transcribe_media(file: UploadFile = File(...)):
    try:
        if not os.getenv("HUGGING_FACE_TOKEN"):
            raise HTTPException(status_code=500, detail="Hugging Face token not configured")

        # Read file content
        file_content = await file.read()
        if not file_content:
            logger.error("Empty file received")
            raise HTTPException(status_code=400, detail="Empty file received")

        # Check file size (10MB limit)
        if len(file_content) > 10 * 1024 * 1024:
            logger.error("File too large")
            raise HTTPException(status_code=400, detail="File too large (max 10MB)")

        # Get file extension and validate content type
        file_ext = os.path.splitext(file.filename)[1].lower()
        content_type = file.content_type or ""
        
        valid_audio_types = {
            ".mp3": ["audio/mpeg", "audio/mp3"],
            ".wav": ["audio/wav", "audio/x-wav", "audio/wave"],
            ".m4a": ["audio/mp4", "audio/x-m4a"],
            ".ogg": ["audio/ogg", "application/ogg"],
            ".webm": ["audio/webm", "video/webm"]
        }

        is_valid = False
        for ext, types in valid_audio_types.items():
            if file_ext == ext or any(t in content_type.lower() for t in types):
                is_valid = True
                break

        if not is_valid:
            logger.error(f"Invalid file type: {content_type} with extension {file_ext}")
            raise HTTPException(status_code=400, detail="Invalid audio file format")

        # Save file temporarily
        temp_file = f"temp_audio{file_ext}"
        with open(temp_file, "wb") as f:
            f.write(file_content)

        try:
            # Initialize Hugging Face client
            hf = HfApi()
            
            # Upload file for transcription
            logger.info(f"Uploading file for transcription: {temp_file}")
            files = {
                "file": (temp_file, open(temp_file, "rb"), f"audio/{file_ext[1:]}")
            }
            headers = {
                "Authorization": f"Bearer {os.getenv('HUGGING_FACE_TOKEN')}"
            }
            
            response = requests.post(
                "https://api-inference.huggingface.co/models/openai/whisper-large-v3",
                headers=headers,
                files=files,
                timeout=30
            )
            
            if response.status_code != 200:
                logger.error(f"Transcription failed with status {response.status_code}: {response.text}")
                raise HTTPException(status_code=response.status_code, detail="Transcription failed")

            result = response.json()
            
            if not result or "text" not in result:
                logger.error("Invalid response format from Hugging Face API")
                raise HTTPException(status_code=500, detail="Invalid transcription response")

            transcription = result["text"].strip()
            if not transcription:
                logger.warning("Empty transcription received")
                return {"transcription": "", "message": "No speech detected"}

            logger.info(f"Transcription successful: {transcription[:100]}...")
            return {"transcription": transcription}

        finally:
            # Clean up temporary file
            if os.path.exists(temp_file):
                os.remove(temp_file)

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}") 