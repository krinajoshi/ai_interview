from typing import List, Optional, Dict, Union, Any
# Use pydantic-settings directly
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, EmailStr, field_validator, ConfigDict

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AI Interview Platform"
    
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG_MODE: bool = False
    
    # Security
    SECRET_KEY: str = "dev_secret_key_change_in_production"  # Default for development
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # CORS
    ALLOWED_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",  # React frontend
        "http://localhost:8000",  # FastAPI backend
    ]
    
    # Database
    MONGODB_URL: str = "mongodb+srv://developergirls8:T42xnbXGP7nJOqS5@ai-interview-db.yhihgxo.mongodb.net/ai_interview_db"
    MONGODB_DB_NAME: str = "ai_interview_db"
    
    # AWS
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    S3_BUCKET: str = "ai-interview-files"
    
    # LLM Settings - Hugging Face focused
    LLM_MODEL: str = "huggingface/mistral"  # Default to Mistral-7B model
    LLM_ENDPOINT: Optional[str] = None  # Add this field to fix the validation error
    
    # Hugging Face Settings
    HUGGINGFACE_API_TOKEN: Optional[str] = None
    HUGGINGFACE_ENDPOINT: str = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"
    
    # Alternative Hugging Face Models
    HUGGINGFACE_MODELS: Dict[str, str] = {
        "mistral": "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
        "llama2": "https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf",
        "gemma": "https://api-inference.huggingface.co/models/google/gemma-7b-it",
        "openchat": "https://api-inference.huggingface.co/models/openchat/openchat-3.5-1210",
        "phi2": "https://api-inference.huggingface.co/models/microsoft/phi-2",
        "falcon": "https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct"
    }
    
    # Speech-to-Text API Settings
    SPEECH_TO_TEXT_PROVIDER: str = "huggingface"  # Options: "huggingface", "assembly_ai", "google"
    ASSEMBLY_AI_API_KEY: Optional[str] = None
    SPEECH_TO_TEXT_ENDPOINT: str = "https://api-inference.huggingface.co/models/openai/whisper-large-v3"
    
    # Google Cloud
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_SSL: bool = True
    
    # Pydantic v2 validators
    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    @field_validator("HUGGINGFACE_ENDPOINT", mode="before")
    @classmethod
    def set_huggingface_endpoint(cls, v: str, info: Any) -> str:
        """Set the correct HF endpoint based on the model name if using huggingface model"""
        values = info.data
        if values.get("LLM_MODEL", "").startswith("huggingface/"):
            model_name = values["LLM_MODEL"].split("/")[1]
            if model_name in values.get("HUGGINGFACE_MODELS", {}):
                return values["HUGGINGFACE_MODELS"][model_name]
        return v
        
    # Pydantic v2 configuration
    model_config = ConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="allow"  # Allow extra fields to avoid validation errors
    )

settings = Settings() 