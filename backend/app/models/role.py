from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, ConfigDict
from .user import PyObjectId

class Skill(BaseModel):
    name: str
    level: str  # beginner, intermediate, advanced
    importance: str  # required, preferred
    description: Optional[str]

class Role(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str
    category: str  # Data Science/Web Development
    specialization: str
    experience_level: str  # fresher, mid-level, senior
    required_skills: List[Skill]
    preferred_skills: List[Skill]
    description: str
    interview_structure: Dict[str, int]  # question_type to count mapping
    difficulty_distribution: Dict[str, float]  # difficulty_level to percentage mapping
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={PyObjectId: str}
    )

class RoleCreate(BaseModel):
    name: str
    category: str
    specialization: str
    experience_level: str
    required_skills: List[Skill]
    preferred_skills: List[Skill]
    description: str
    interview_structure: Dict[str, int]
    difficulty_distribution: Dict[str, float]

class RoleUpdate(BaseModel):
    name: Optional[str]
    required_skills: Optional[List[Skill]]
    preferred_skills: Optional[List[Skill]]
    description: Optional[str]
    interview_structure: Optional[Dict[str, int]]
    difficulty_distribution: Optional[Dict[str, float]]
    is_active: Optional[bool]

class RoleInResponse(BaseModel):
    role: Role
    skill_analysis: Optional[Dict[str, float]]  # Skill gap analysis 