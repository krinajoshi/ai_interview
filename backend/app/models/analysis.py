from typing import Optional, List
from pydantic import BaseModel

class QuestionForAnalysis(BaseModel):
    text: str
    context: Optional[str] = None
    expected_points: Optional[List[str]] = None

class AnalysisRequest(BaseModel):
    question: str
    answer: str 