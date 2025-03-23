from datetime import datetime
from typing import Optional, List
from fastapi import HTTPException
from ..db.mongodb import find_one, find_many, insert_one, update_one
from ..models.interview import Interview, Question, Answer, InterviewCreate, VoiceMetrics, FacialMetrics
from ..models.role import Role
from ..services.ai_service import (
    generate_questions,
    evaluate_answer,
    analyze_voice,
    analyze_facial_metrics,
    generate_feedback
)
import bson

async def create_interview(user_id: str, interview_data: InterviewCreate) -> Interview:
    # Import logging module
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"Creating interview for user {user_id} with role {interview_data.role_id}")
    
    # Ensure role_id is used properly
    try:
        role_id = interview_data.role_id
        # If role_id is already an ObjectId instance, use it as is
        if not isinstance(role_id, bson.ObjectId) and not isinstance(role_id, str):
            role_id = str(role_id)  # Convert to string if it's another type
    except Exception as e:
        logger.error(f"Error processing role_id: {str(e)}")
        role_id = str(bson.ObjectId())  # Generate a new ID in case of error
    
    # Create interview
    interview = Interview(
        user_id=user_id,
        role_id=role_id,
        language=interview_data.language,
        status="scheduled",
        improvement_areas=[],
        questions=[],
        answers=[]
    )
    
    # Insert interview
    interview_id = await insert_one("interviews", interview.dict(by_alias=True))
    interview.id = interview_id
    logger.info(f"Created interview with ID: {interview_id}")
    
    # Generate initial questions
    questions = await generate_questions(interview)
    logger.info(f"Generated {len(questions)} questions for interview {interview_id}")
    
    # Insert questions
    for q in questions:
        q.interview_id = interview_id
        question_id = await insert_one("questions", q.dict(by_alias=True))
        q.id = question_id
        interview.questions.append(q)
    
    logger.info(f"Inserted {len(questions)} questions for interview {interview_id}")
    return interview

async def get_interview(interview_id: str) -> Optional[Interview]:
    interview_dict = await find_one("interviews", {"_id": interview_id})
    if interview_dict:
        # Load questions and answers
        questions = await find_many("questions", {"interview_id": interview_id})
        answers = await find_many("answers", {
            "question_id": {"$in": [q["_id"] for q in questions]}
        })
        
        interview_dict["questions"] = questions
        interview_dict["answers"] = answers
        return Interview(**interview_dict)
    return None

async def get_user_interviews(user_id: str, status: Optional[str] = None) -> List[Interview]:
    query = {"user_id": user_id}
    if status:
        query["status"] = status
    
    interviews = await find_many("interviews", query)
    return [Interview(**i) for i in interviews]

async def submit_answer(
    interview_id: str,
    question_id: str,
    transcribed_text: str,
    audio_duration: int,
    code_submission: Optional[str] = None,
    whiteboard_submission: Optional[str] = None
) -> Answer:
    # Get question
    question = await find_one("questions", {"_id": question_id})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Evaluate answer
    evaluation = await evaluate_answer(
        question["text"],
        question["reference_answer"],
        transcribed_text,
        code_submission
    )
    
    # Create answer
    answer = Answer(
        question_id=question_id,
        transcribed_text=transcribed_text,
        audio_duration=audio_duration,
        correctness_score=evaluation["correctness_score"],
        clarity_score=evaluation["clarity_score"],
        depth_score=evaluation["depth_score"],
        confidence_score=evaluation["confidence_score"],
        feedback=evaluation["feedback"],
        learning_resources=evaluation["resources"],
        code_submission=code_submission,
        whiteboard_submission=whiteboard_submission
    )
    
    answer_id = await insert_one("answers", answer.dict(by_alias=True))
    answer.id = answer_id
    
    return answer

async def update_interview_metrics(
    interview_id: str,
    voice_data: Optional[bytes] = None,
    facial_data: Optional[bytes] = None
) -> dict:
    metrics = {}
    
    if voice_data:
        voice_metrics = await analyze_voice(voice_data)
        metrics["voice_metrics"] = VoiceMetrics(**voice_metrics)
    
    if facial_data:
        facial_metrics = await analyze_facial_metrics(facial_data)
        metrics["facial_metrics"] = FacialMetrics(**facial_metrics)
    
    if metrics:
        await update_one("interviews", {"_id": interview_id}, metrics)
    
    return metrics

async def complete_interview(interview_id: str) -> Interview:
    interview = await get_interview(interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Calculate scores
    answers = interview.answers
    if not answers:
        raise HTTPException(status_code=400, detail="No answers submitted")
    
    technical_score = sum(a.correctness_score * 0.7 + a.depth_score * 0.3 for a in answers) / len(answers)
    
    communication_score = 0
    if interview.voice_metrics and interview.facial_metrics:
        communication_score = (
            interview.voice_metrics.confidence * 0.3 +
            interview.voice_metrics.clarity * 0.3 +
            interview.facial_metrics.engagement * 0.2 +
            interview.facial_metrics.confidence * 0.2
        )
    
    overall_score = technical_score * 0.7 + communication_score * 0.3
    
    # Generate feedback
    feedback = await generate_feedback(interview)
    
    # Update interview
    update_data = {
        "status": "completed",
        "end_time": datetime.utcnow(),
        "overall_score": overall_score,
        "technical_score": technical_score,
        "communication_score": communication_score,
        "feedback_summary": feedback["summary"],
        "improvement_areas": feedback["improvement_areas"]
    }
    
    await update_one("interviews", {"_id": interview_id}, update_data)
    
    # Return updated interview
    return await get_interview(interview_id)

async def pause_interview(interview_id: str) -> bool:
    updated = await update_one(
        "interviews",
        {"_id": interview_id},
        {"status": "paused"}
    )
    return bool(updated)

async def resume_interview(interview_id: str) -> bool:
    updated = await update_one(
        "interviews",
        {"_id": interview_id},
        {"status": "in_progress"}
    )
    return bool(updated)

async def abandon_interview(interview_id: str) -> bool:
    updated = await update_one(
        "interviews",
        {"_id": interview_id},
        {"status": "abandoned", "end_time": datetime.utcnow()}
    )
    return bool(updated) 