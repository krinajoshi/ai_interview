from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv
import logging
import json
from typing import Optional
import requests
import time
import tempfile

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

router = APIRouter()

ASSEMBLY_AI_TOKEN = os.getenv("ASSEMBLY_AI_TOKEN")

@router.post("/transcribe")
async def transcribe_media(file: UploadFile = File(...)):
    try:
        if not os.getenv("ASSEMBLY_AI_TOKEN"):
            raise HTTPException(status_code=500, detail="AssemblyAI token not configured")

        # Read file content
        file_content = await file.read()
        if not file_content:
            logger.error("Empty file received")
            raise HTTPException(status_code=400, detail="Empty file received")

        # Check file size (10MB limit)
        if len(file_content) > 10 * 1024 * 1024:
            logger.error("File too large")
            raise HTTPException(status_code=400, detail="File too large (max 10MB)")

        # Log file details
        logger.info(f"Received file: {file.filename}, type: {file.content_type}, size: {len(file_content)} bytes")

        # Step 1: Upload the audio file to AssemblyAI
        headers = {
            "authorization": os.getenv("ASSEMBLY_AI_TOKEN"),
            "content-type": "application/json"
        }
        
        # Upload the file
        upload_response = requests.post(
            "https://api.assemblyai.com/v2/upload",
            headers=headers,
            data=file_content
        )
        
        if upload_response.status_code != 200:
            logger.error(f"Upload failed: {upload_response.text}")
            raise HTTPException(status_code=500, detail="Failed to upload audio file")
            
        upload_url = upload_response.json()["upload_url"]
        logger.info(f"File uploaded successfully: {upload_url}")

        # Step 2: Submit for transcription
        transcript_request = {
            "audio_url": upload_url,
            "language_code": "en",
            "punctuate": True
        }
        
        transcript_response = requests.post(
            "https://api.assemblyai.com/v2/transcript",
            json=transcript_request,
            headers=headers
        )
        
        if transcript_response.status_code != 200:
            logger.error(f"Transcription request failed: {transcript_response.text}")
            raise HTTPException(status_code=500, detail="Failed to submit transcription request")
            
        transcript_id = transcript_response.json()["id"]
        logger.info(f"Transcription submitted: {transcript_id}")

        # Step 3: Poll for results
        while True:
            polling_response = requests.get(
                f"https://api.assemblyai.com/v2/transcript/{transcript_id}",
                headers=headers
            )
            
            if polling_response.status_code != 200:
                logger.error(f"Polling failed: {polling_response.text}")
                raise HTTPException(status_code=500, detail="Failed to get transcription status")
                
            transcript_result = polling_response.json()
            
            if transcript_result["status"] == "completed":
                transcription = transcript_result["text"].strip()
                if not transcription:
                    return {"transcription": "", "message": "No speech detected"}
                return {"transcription": transcription}
                
            elif transcript_result["status"] == "error":
                error_msg = transcript_result.get("error", "Unknown error")
                logger.error(f"Transcription failed: {error_msg}")
                raise HTTPException(status_code=500, detail=f"Transcription failed: {error_msg}")
                
            time.sleep(1)  # Wait 1 second before polling again

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}") 