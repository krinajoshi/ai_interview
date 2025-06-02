from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field
from .user import PyObjectId
from bson import ObjectId

class VoiceMetrics(BaseModel):
    confidence: float
    clarity: float
    fluency: float
    pace: float
    hesitation_count: int
    filler_words_count: int

class FacialMetrics(BaseModel):
    engagement: float
    confidence: float
    eye_contact: float
    expressions: Dict[str, float]  # emotion to confidence mapping

class Question(BaseModel):
    id: Optional[str] = None
    text: str
    type: str
    difficulty: int
    skill_tested: str
    reference_answer: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        schema_extra = {
            "example": {
                "id": "q_1",
                "text": "What is your experience with test automation frameworks?",
                "type": "technical",
                "difficulty": 3,
                "skill_tested": "testing",
                "reference_answer": "A good answer would include specific examples of test automation frameworks used, challenges faced, and best practices followed."
            }
        }

class Answer(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    question_id: PyObjectId
    transcribed_text: str
    audio_duration: int  # in seconds
    correctness_score: float
    clarity_score: float
    depth_score: float
    confidence_score: float
    feedback: str
    learning_resources: List[Dict[str, str]]  # List of {title: str, url: str}
    code_submission: Optional[str]
    whiteboard_submission: Optional[str]  # S3 link to image

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Interview(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()))
    user_id: str
    role_id: str
    language: str
    status: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    questions: Optional[List[Question]] = None
    answers: Optional[List[Dict]] = None
    metrics: Optional[Dict] = None

    class Config:
        json_encoders = {
            ObjectId: str
        }

class InterviewCreate(BaseModel):
    role_id: str
    language: str = "en"

class InterviewUpdate(BaseModel):
    status: Optional[str]
    end_time: Optional[datetime]
    overall_score: Optional[float]
    technical_score: Optional[float]
    communication_score: Optional[float]
    voice_metrics: Optional[VoiceMetrics]
    facial_metrics: Optional[FacialMetrics]
    feedback_summary: Optional[str]
    improvement_areas: Optional[List[str]]

class InterviewInResponse(BaseModel):
    interview: Interview
    next_question: Optional[Question]