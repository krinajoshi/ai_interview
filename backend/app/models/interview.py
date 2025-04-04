from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, ConfigDict
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
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    interview_id: PyObjectId
    text: Dict[str, str]  # Language to text mapping
    type: str  # technical/behavioral
    difficulty: int  # 1-5
    skill_tested: str
    reference_answer: str
    order: int
    time_limit: Optional[int] = None  # in seconds
    code_required: bool = False
    whiteboard_required: bool = False

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

class Interview(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()))
    user_id: str
    role_id: str
    language: str
    status: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    overall_score: Optional[float] = None
    technical_score: Optional[float] = None
    communication_score: Optional[float] = None
    voice_metrics: Optional[dict] = None
    facial_metrics: Optional[dict] = None
    recording_url: Optional[str] = None
    feedback_summary: Optional[str] = None
    improvement_areas: Optional[List[str]] = None
    questions: Optional[List[dict]] = None
    answers: Optional[List[dict]] = None

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