from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from ....models.user import User
from ....models.interview import Interview, InterviewCreate, InterviewInResponse, Question
from ....services.interview_service import (
    create_interview,
    get_interview,
    get_user_interviews,
    submit_answer,
    update_interview_metrics,
    complete_interview,
    pause_interview,
    resume_interview,
    abandon_interview
)
from ....services.ai_service import generate_questions
from ....core.deps import get_current_user

router = APIRouter()

@router.post("", response_model=Interview)
async def create_new_interview(
    interview_data: InterviewCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new interview session"""
    return await create_interview(str(current_user.id), interview_data)

@router.get("", response_model=List[Interview])
async def list_user_interviews(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """List all interviews for the current user"""
    return await get_user_interviews(str(current_user.id), status)

@router.get("/{interview_id}", response_model=Interview)
async def get_interview_details(
    interview_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get details of a specific interview"""
    interview = await get_interview(interview_id)
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    if str(interview.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this interview"
        )
    
    return interview

@router.post("/{interview_id}/answers")
async def submit_interview_answer(
    interview_id: str,
    question_id: str,
    transcribed_text: str,
    audio_duration: int,
    code_submission: Optional[str] = None,
    whiteboard_submission: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user)
):
    """Submit an answer for an interview question"""
    # Verify interview belongs to user
    interview = await get_interview(interview_id)
    if not interview or str(interview.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this interview"
        )
    
    # Handle whiteboard submission
    whiteboard_url = None
    if whiteboard_submission:
        whiteboard_content = await whiteboard_submission.read()
        # Here you would upload to S3 and get URL
        # whiteboard_url = await upload_to_s3(whiteboard_content)
    
    return await submit_answer(
        interview_id,
        question_id,
        transcribed_text,
        audio_duration,
        code_submission,
        whiteboard_url
    )

@router.post("/{interview_id}/metrics")
async def update_metrics(
    interview_id: str,
    voice_data: Optional[UploadFile] = File(None),
    facial_data: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user)
):
    """Update interview metrics with voice and facial data"""
    # Verify interview belongs to user
    interview = await get_interview(interview_id)
    if not interview or str(interview.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this interview"
        )
    
    voice_bytes = await voice_data.read() if voice_data else None
    facial_bytes = await facial_data.read() if facial_data else None
    
    return await update_interview_metrics(
        interview_id,
        voice_bytes,
        facial_bytes
    )

@router.post("/{interview_id}/complete", response_model=Interview)
async def complete_interview_session(
    interview_id: str,
    current_user: User = Depends(get_current_user)
):
    """Complete an interview session"""
    # Verify interview belongs to user
    interview = await get_interview(interview_id)
    if not interview or str(interview.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this interview"
        )
    
    return await complete_interview(interview_id)

@router.post("/{interview_id}/pause")
async def pause_interview_session(
    interview_id: str,
    current_user: User = Depends(get_current_user)
):
    """Pause an interview session"""
    # Verify interview belongs to user
    interview = await get_interview(interview_id)
    if not interview or str(interview.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this interview"
        )
    
    success = await pause_interview(interview_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to pause interview"
        )
    return {"message": "Interview paused successfully"}

@router.post("/{interview_id}/resume")
async def resume_interview_session(
    interview_id: str,
    current_user: User = Depends(get_current_user)
):
    """Resume a paused interview session"""
    # Verify interview belongs to user
    interview = await get_interview(interview_id)
    if not interview or str(interview.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this interview"
        )
    
    success = await resume_interview(interview_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to resume interview"
        )
    return {"message": "Interview resumed successfully"}

@router.post("/{interview_id}/abandon")
async def abandon_interview_session(
    interview_id: str,
    current_user: User = Depends(get_current_user)
):
    """Abandon an interview session"""
    # Verify interview belongs to user
    interview = await get_interview(interview_id)
    if not interview or str(interview.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this interview"
        )
    
    success = await abandon_interview(interview_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to abandon interview"
        )
    return {"message": "Interview abandoned successfully"}

@router.post("/{interview_id}/generate-questions", response_model=List[Question])
async def generate_interview_questions(
    interview_id: str,
    current_user: User = Depends(get_current_user)
):
    """Generate questions for an existing interview"""
    # Import logging module
    import logging
    logger = logging.getLogger(__name__)
    
    # Log attempt to generate questions
    logger.info(f"Attempting to generate questions for interview {interview_id}")
    
    # Verify interview belongs to user
    interview = await get_interview(interview_id)
    if not interview:
        logger.error(f"Interview not found: {interview_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    if str(interview.user_id) != str(current_user.id):
        logger.error(f"User {current_user.id} not authorized to access interview {interview_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this interview"
        )
    
    # Generate questions
    try:
        logger.info(f"Calling generate_questions for interview {interview_id}")
        questions = await generate_questions(interview)
        logger.info(f"Successfully generated {len(questions)} questions for interview {interview_id}")
        return questions
    except ValueError as ve:
        # Specific error for value-related issues
        logger.error(f"Value error in question generation: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error generating questions: {str(ve)}"
        )
    except Exception as e:
        # Generic error handling
        logger.error(f"Unexpected error in question generation: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate questions: {str(e)}"
        )