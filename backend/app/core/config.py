from typing import Any, Dict, List, Optional
import os
from pydantic import BaseSettings, validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Interview Preparation API"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # MongoDB
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "ai_interview_db")
    
    # AI Services
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    COHERE_API_KEY: Optional[str] = os.getenv("COHERE_API_KEY")
    HUGGINGFACE_API_TOKEN: Optional[str] = os.getenv("HUGGINGFACE_API_TOKEN")
    SPEECH_TO_TEXT_ENDPOINT: str = os.getenv("SPEECH_TO_TEXT_ENDPOINT", "https://api-inference.huggingface.co/models/facebook/wav2vec2-large-960h-lv60-self")
    SPEECH_TO_TEXT_PROVIDER: str = os.getenv("SPEECH_TO_TEXT_PROVIDER", "huggingface")
    ASSEMBLY_AI_API_KEY: Optional[str] = os.getenv("ASSEMBLY_AI_API_KEY")
    
    # AWS
    AWS_ACCESS_KEY_ID: Optional[str] = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: Optional[str] = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    S3_BUCKET: str = os.getenv("S3_BUCKET", "ai-interview-recordings")
    
    # OpenRouter
    OPENROUTER_API_KEY: Optional[str] = os.getenv("OPENROUTER_API_KEY")
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()