from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from .user import PyObjectId

class Education(BaseModel):
    institution: str
    degree: str
    field_of_study: str
    start_date: datetime
    end_date: Optional[datetime]
    description: Optional[str]

class Experience(BaseModel):
    company: str
    position: str
    start_date: datetime
    end_date: Optional[datetime]
    description: str
    technologies: List[str]

class Project(BaseModel):
    name: str
    description: str
    technologies: List[str]
    url: Optional[str]
    start_date: Optional[datetime]
    end_date: Optional[datetime]

class ParsedResumeData(BaseModel):
    skills: List[str]
    experience: List[Experience]
    education: List[Education]
    projects: List[Project]
    languages: List[str]
    certifications: List[str]

class Resume(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    original_file: str  # S3 link
    parsed_data: ParsedResumeData
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    status: str = "active"  # active, archived, deleted
    confidence_score: float  # Parsing confidence score
    skill_matches: Dict[str, float]  # Skill to confidence mapping

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={PyObjectId: str}
    )

class ResumeCreate(BaseModel):
    file_url: str

class ResumeUpdate(BaseModel):
    parsed_data: Optional[ParsedResumeData]
    status: Optional[str]
    skill_matches: Optional[Dict[str, float]]

class ResumeInResponse(BaseModel):
    resume: Resume
    analysis: Dict[str, Any]  # Additional analysis data 