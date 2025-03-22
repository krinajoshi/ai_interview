from fastapi import Request
from fastapi.responses import JSONResponse
from .exceptions import AIInterviewException
from typing import Union, Dict, Any, Callable
import traceback
import logging
from starlette.types import ASGIApp, Receive, Scope, Send

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Global error handler"""
    
    if isinstance(exc, AIInterviewException):
        # Handle our custom exceptions
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail}
        )
    
    # Log unexpected errors
    logger.error(f"Unexpected error occurred: {str(exc)}")
    logger.error(traceback.format_exc())
    
    # Return generic error for unexpected exceptions
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred. Please try again later."
        }
    )

class ErrorLoggingMiddleware:
    """Middleware for logging requests and errors"""
    
    def __init__(self, app: ASGIApp):
        self.app = app
    
    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        request = Request(scope, receive=receive)
        
        try:
            # Log request
            logger.info(f"Request: {request.method} {request.url}")
            
            async def wrapped_send(message):
                if message["type"] == "http.response.start":
                    # Log response status
                    logger.info(f"Response: {message.get('status', 'unknown')}")
                await send(message)
            
            await self.app(scope, receive, wrapped_send)
            
        except Exception as exc:
            # Log error
            logger.error(f"Error processing request: {str(exc)}")
            logger.error(traceback.format_exc())
            
            # Return error response
            response = JSONResponse(
                status_code=500,
                content={
                    "detail": "An unexpected error occurred. Please try again later."
                }
            )
            await response(scope, receive, send)

class RateLimitMiddleware:
    """Middleware for rate limiting"""
    
    def __init__(self, app: ASGIApp):
        self.app = app
        # Initialize rate limiting (you can use Redis for distributed setup)
        self.requests = {}
    
    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
            
        request = Request(scope, receive=receive)
        client_ip = request.client.host if request.client else None
        
        # Skip rate limiting if we can't identify the client
        if not client_ip:
            return await self.app(scope, receive, send)
        
        # Check rate limit
        if self._is_rate_limited(client_ip):
            response = JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests. Please try again later."
                }
            )
            await response(scope, receive, send)
            return
        
        await self.app(scope, receive, send)
    
    def _is_rate_limited(self, client_ip: str) -> bool:
        # Implement your rate limiting logic here
        # For now, we'll allow all requests
        return False

class SecurityHeadersMiddleware:
    """Middleware for adding security headers"""
    
    def __init__(self, app: ASGIApp):
        self.app = app
    
    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        async def wrapped_send(message):
            if message["type"] == "http.response.start":
                # Add security headers
                headers = dict(message.get("headers", []))
                headers.update({
                    b"x-content-type-options": b"nosniff",
                    b"x-frame-options": b"DENY",
                    b"x-xss-protection": b"1; mode=block",
                    b"strict-transport-security": b"max-age=31536000; includeSubDomains"
                })
                message["headers"] = [(k, v) for k, v in headers.items()]
            await send(message)

        await self.app(scope, receive, wrapped_send) 