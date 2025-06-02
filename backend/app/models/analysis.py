from typing import Optional, List, Dict
from pydantic import BaseModel

class TextAnalysis(BaseModel):
    content_score: float
    clarity_score: float
    relevance_score: float
    grammar_score: float
    vocabulary_score: float
    feedback: str
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]

class VoiceAnalysis(BaseModel):
    confidence: float
    clarity: float
    fluency: float
    pace: float
    hesitation_count: int
    filler_words_count: int
    transcription: str
    feedback: str

class VideoAnalysis(BaseModel):
    engagement: float
    confidence: float
    eye_contact: float
    expressions: Dict[str, float]
    feedback: str

class SentimentAnalysis(BaseModel):
    sentiment: str  # positive, neutral, negative
    confidence: float
    emotions: Dict[str, float]

class LanguageAnalysis(BaseModel):
    language: str
    name: str
    confidence: float

class ComplexityAnalysis(BaseModel):
    complexity_level: str  # low, medium, high
    readability_score: float
    vocabulary_diversity: float
    sentence_complexity: float

class AnswerAnalysis(BaseModel):
    correctness_score: float
    clarity_score: float
    depth_score: float
    confidence_score: float
    feedback: str
    keywords: Optional[Dict[str, List[str]]]  # expected, found, missing
    learning_resources: Optional[List[Dict[str, str]]]  # List of {title: str, url: str}

class InterviewAnalysis(BaseModel):
    overall_score: float
    technical_score: float
    communication_score: float
    strengths: List[str]
    weaknesses: List[str]
    improvement_areas: List[str]
    feedback_summary: str