import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.errors import register_exception_handlers
from app.services import feedback_service, preference_service
from app.services.auth_service import AuthService
from app.services.preference_service import PreferenceService

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

    # Create the unique email/username indexes (safe to run on every start; no-op if they exist)
    try:
        await AuthService.create_indexes()
        logger.info("✓ User indexes ensured")
    except Exception:
        logger.exception("Could not create user indexes; email/username uniqueness is NOT enforced by the database")
    try:
        await preference_service.create_indexes()
        logger.info("✓ Preference indexes ensured")
    except Exception:
        logger.exception("Could not create preference indexes; one-document-per-user is NOT enforced by the database")
    try:
        await feedback_service.create_indexes()
        logger.info("✓ Feedback indexes ensured")
    except Exception:
        logger.exception("Could not create feedback indexes; one-rating-per-dish is NOT enforced by the database")

    try:
        await PreferenceService.create_indexes()
        logger.info("✓ Preference indexes ensured")
    except Exception:
        logger.exception("Could not create preference indexes")

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