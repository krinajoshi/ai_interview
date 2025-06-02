from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field
from .user import PyObjectId

class Education(BaseModel):
    institution: str
    degree: str
    field_of_study: str
    start_date: Optional[str]
    end_date: Optional[str]
    description: Optional[str]

class Experience(BaseModel):
    company: str
    position: str
    start_date: Optional[str]
    end_date: Optional[str]
    description: Optional[str]
    technologies: Optional[List[str]]

class Project(BaseModel):
    name: str
    description: Optional[str]
    technologies: Optional[List[str]]
    url: Optional[str]
    start_date: Optional[str]
    end_date: Optional[str]

class ParsedResumeData(BaseModel):
    skills: List[str]
    experience: List[Experience]
    education: List[Education]
    projects: Optional[List[Project]]
    languages: Optional[List[str]]
    certifications: Optional[List[str]]

class Resume(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str
    file_name: str
    file_url: str
    file_type: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    parsed_data: Optional[ParsedResumeData]
    confidence_score: Optional[float]
    skill_matches: Optional[Dict[str, float]]

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {PyObjectId: str}

class ResumeCreate(BaseModel):
    file_name: str
    file_type: str

class ResumeUpdate(BaseModel):
    parsed_data: Optional[ParsedResumeData]
    confidence_score: Optional[float]
    skill_matches: Optional[Dict[str, float]]

class ResumeInResponse(BaseModel):
    resume: Resume