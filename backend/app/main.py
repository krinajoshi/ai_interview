from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings
from app.api.api_v1.api import api_router
from app.core.middleware import (
    ErrorLoggingMiddleware,
    RateLimitMiddleware,
    SecurityHeadersMiddleware
)
from app.core.exceptions import AIInterviewException
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.core.deps import get_current_user
import uvicorn

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Add other middleware after CORS
app.add_middleware(ErrorLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Event handlers for MongoDB connection
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "ok", "message": "API is running"}

# Test endpoint for authentication
@app.get("/test-auth")
async def test_auth(current_user = Depends(get_current_user)):
    """
    Test endpoint for authentication.
    """
    return {
        "status": "ok",
        "message": "Authentication successful",
        "user_id": str(current_user.id),
        "email": current_user.email
    }

# Exception handlers
@app.exception_handler(AIInterviewException)
async def ai_interview_exception_handler(request: Request, exc: AIInterviewException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    # Add logging for debugging
    import traceback
    print(f"Unhandled exception: {str(exc)}")
    print("Traceback:")
    print(traceback.format_exc())
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"An unexpected error occurred: {str(exc)}"
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="debug"
    ) 