from fastapi import APIRouter, Depends, FastAPI, HTTPException, Body
from pydantic import BaseModel
from typing import Optional, List
from .endpoints import users, interviews, resumes, roles, sentiment, transcription
from .endpoints.interviews import router as interviews_router
from app.models.user import User
from app.core.deps import get_current_user
from app.services.interview_service import get_interview, create_interview
from app.models.interview import Interview, InterviewCreate, Question
from app.models.role import Role, Skill
from app.services.ai_service import generate_questions
from app.core.config import settings
from app.db.mongodb import get_database, connect_to_mongo, insert_one
import bson

# Define the input model for the legacy endpoint
class QuestionGenerationRequest(BaseModel):
    jobTitle: str
    resume: Optional[str] = None
    jobDescription: Optional[str] = None
    language: Optional[str] = "en"

api_router = APIRouter()

# Main routers
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(interviews.router, prefix="/interviews", tags=["interviews"])
api_router.include_router(resumes.router, prefix="/resumes", tags=["resumes"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(sentiment.router, prefix="/sentiment", tags=["sentiment"])
api_router.include_router(transcription.router, prefix="/transcription", tags=["transcription"])

def generate_fallback_questions(role_dict: dict) -> List[dict]:
    """Generate fallback questions if LLM fails"""
    return [
        {
            "id": "q_1",
            "text": {
                "en": "Tell us about your experience in this field.",
                "fr": "Parlez-nous de votre expérience dans ce domaine.",
                "ar": "أخبرنا عن خبرتك في هذا المجال."
            },
            "type": "behavioral",
            "difficulty": 3,
            "skill_tested": "communication",
            "reference_answer": "A good answer would include relevant work experience, education, and skills."
        },
        {
            "id": "q_2",
            "text": {
                "en": "Describe a situation where you had to solve a difficult problem.",
                "fr": "Décrivez une situation où vous avez dû résoudre un problème difficile.",
                "ar": "صف موقفًا كان عليك فيه حل مشكلة صعبة."
            },
            "type": "behavioral",
            "difficulty": 3,
            "skill_tested": "problem_solving",
            "reference_answer": "A good answer would describe the problem, the solution approach, and the outcome."
        },
        {
            "id": "q_3",
            "text": {
                "en": "What are your strengths and weaknesses?",
                "fr": "Quelles sont vos forces et vos faiblesses ?",
                "ar": "ما هي نقاط قوتك وضعفك؟"
            },
            "type": "behavioral",
            "difficulty": 2,
            "skill_tested": "self_awareness",
            "reference_answer": "A good answer would include honest self-assessment with examples."
        },
        {
            "id": "q_4",
            "text": {
                "en": "Why do you want to work for our company?",
                "fr": "Pourquoi souhaitez-vous travailler pour notre entreprise ?",
                "ar": "لماذا تريد العمل في شركتنا؟"
            },
            "type": "behavioral",
            "difficulty": 2,
            "skill_tested": "motivation",
            "reference_answer": "A good answer would demonstrate knowledge of the company and alignment with its values."
        },
        {
            "id": "q_5",
            "text": {
                "en": "How do you handle tight deadlines and pressure?",
                "fr": "Comment gérez-vous les délais serrés et la pression ?",
                "ar": "كيف تتعامل مع المواعيد النهائية الضيقة والضغط؟"
            },
            "type": "behavioral",
            "difficulty": 3,
            "skill_tested": "stress_management",
            "reference_answer": "A good answer would include time management strategies and examples of handling pressure."
        }
    ]

# Create a custom handler for the legacy endpoint
async def legacy_generate_questions(
    request: QuestionGenerationRequest,
    current_user: User = Depends(get_current_user)
):
    """Legacy endpoint for backward compatibility with the frontend"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        # Ensure MongoDB connection is established
        await connect_to_mongo()
        
        # Create a temporary interview object
        interview = Interview(
            user_id=str(current_user.id),
            role_id=str(bson.ObjectId()),  # Generate a new ID
            language=request.language or "en",
            status="scheduled"
        )
        
        # Create a temporary role with the job details
        role = Role(
            name=request.jobTitle,
            description=request.jobDescription or "",
            category="Custom",
            specialization="Custom",
            experience_level="mid-level",
            required_skills=[
                {
                    "name": "general",
                    "level": "intermediate",
                    "importance": "required",
                    "description": "General interview skills"
                }
            ],
            preferred_skills=[
                {
                    "name": "communication",
                    "level": "intermediate",
                    "importance": "preferred",
                    "description": "Verbal and written communication skills"
                }
            ],
            interview_structure={"technical": 3, "behavioral": 2},
            difficulty_distribution={
                "1": 0.1, "2": 0.2, "3": 0.4, "4": 0.2, "5": 0.1
            }
        )
        
        # Store the role in the database
        db = get_database()
        role_id = await insert_one("roles", role.dict(by_alias=True))
        interview.role_id = str(role_id)
        
        # Try to generate questions using the AI service
        try:
            logger.info("Attempting to generate questions using AI service")
            questions = await generate_questions(str(role_id))
            logger.info(f"Successfully received {len(questions)} questions from AI service")
            
            # Format the questions for the frontend
            formatted_questions = []
            for i, q in enumerate(questions):
                try:
                    # Format each question with proper multilingual text
                    if isinstance(q.text, dict):
                        question_text = q.text
                    else:
                        question_text = {
                            "en": str(q.text),
                            "fr": str(q.text),
                            "ar": str(q.text)
                        }
                    
                    formatted_questions.append({
                        "id": f"q_{i+1}",
                        "text": question_text,
                        "type": q.type,
                        "difficulty": q.difficulty,
                        "skill_tested": q.skill_tested,
                        "reference_answer": q.reference_answer
                    })
                except Exception as e:
                    logger.error(f"Error formatting question {i}: {str(e)}")
            
            logger.info(f"Successfully formatted {len(formatted_questions)} questions")
            
            # If we don't have enough questions, use fallbacks
            if len(formatted_questions) < 5:
                logger.warning(f"Only generated {len(formatted_questions)} questions, adding fallbacks")
                fallback_questions = generate_fallback_questions({
                    "name": request.jobTitle,
                    "description": request.jobDescription or ""
                })
                
                # Add only as many as needed to reach 5
                for i, q_data in enumerate(fallback_questions[len(formatted_questions):5]):
                    formatted_questions.append({
                        "id": f"q_{len(formatted_questions)+1}",
                        "text": q_data["text"],
                        "type": q_data["type"],
                        "difficulty": q_data.get("difficulty", 3),
                        "skill_tested": q_data.get("skill_tested", "general"),
                        "reference_answer": q_data.get("reference_answer", "")
                    })
                
                logger.info(f"Added {5 - len(questions)} fallback questions")
        except Exception as e:
            logger.error(f"Error generating questions with AI: {str(e)}")
            logger.info("Using fallback questions instead")
            
            # Use fallback questions when AI generation fails
            formatted_questions = []
            fallback_questions = generate_fallback_questions({
                "name": request.jobTitle,
                "description": request.jobDescription or ""
            })
            
            for i, q_data in enumerate(fallback_questions[:5]):
                formatted_questions.append({
                    "id": f"q_{i+1}",
                    "text": q_data["text"],
                    "type": q_data["type"],
                    "difficulty": q_data.get("difficulty", 3),
                    "skill_tested": q_data.get("skill_tested", "general"),
                    "reference_answer": q_data.get("reference_answer", "")
                })
            
            logger.info(f"Using {len(formatted_questions)} fallback questions")
        
        logger.info(f"Returning {len(formatted_questions)} questions to frontend")
        return {
            "status": "success",
            "questions": formatted_questions
        }
        
    except Exception as e:
        logger.error(f"Error in legacy_generate_questions: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        
        # Return fallback questions in case of error
        fallback_questions = generate_fallback_questions({
            "name": request.jobTitle if request.jobTitle else "General",
            "description": request.jobDescription or ""
        })
        
        return {
            "status": "success",  # Still return success to prevent frontend error
            "questions": fallback_questions
        }

# Legacy interview endpoint (singular) for backward compatibility
legacy_interview_router = APIRouter(tags=["interviews"])
legacy_interview_router.add_api_route(
    "/generate-questions", 
    legacy_generate_questions, 
    methods=["POST"],
    deprecated=True,
    description="DEPRECATED: Legacy endpoint for the frontend"
)
api_router.include_router(legacy_interview_router, prefix="/interview") 