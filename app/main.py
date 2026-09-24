import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.errors import register_exception_handlers

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Ensure logs directory exists
os.makedirs(settings.log_file.rsplit('/', 1)[0], exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:

    
    logger.info("Application starting up...")
    
    yield  
    
    
    logger.info("Application shutting down...")


# Create FastAPI application
app = FastAPI(
    title=settings.api_title,
    description=settings.api_description,
    version=settings.api_version,
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins],
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)

logger.info(f"✓ CORS configured for origins: {settings.cors_origins}")

# Every error response is {"message": ...}
register_exception_handlers(app)

# All frontend-facing routes live under /api
app.include_router(api_router)


# ROUTES
@app.get("/", tags=["Health"])
async def root():
    return {
        "message": "Welcome to Dish Assistant API",
        "api_name": settings.api_title,
        "version": settings.api_version,
        "documentation": "/docs",
        "environment": settings.environment,
    }


@app.get("/test", tags=["Test"])
async def test_check():
    return {
        "status": "Rakell Bandeira",
        "environment": settings.environment,
        "api_version": settings.api_version,
    }



if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        reload=settings.reload if settings.environment == "development" else False,
        log_level=settings.log_level.lower(),
    )