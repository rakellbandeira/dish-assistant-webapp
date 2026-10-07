"""Collects every API route under the /api prefix.

The Next.js frontend forwards /api/* to this backend,
so all routes the browser calls must live here.

"""
from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.dishes import router as dishes_router
from app.api.feedback import router as feedback_router
from app.api.preferences import router as preferences_router
from app.api.recommendations import router as recommendations_router

api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router)
api_router.include_router(dishes_router)
api_router.include_router(feedback_router)
api_router.include_router(preferences_router)
api_router.include_router(recommendations_router)



@api_router.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
