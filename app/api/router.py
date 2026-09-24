"""Collects every API route under the /api prefix.

The Next.js frontend forwards /api/* to this backend,
so all routes the browser calls must live here.

"""
from fastapi import APIRouter

api_router = APIRouter(prefix="/api")


@api_router.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
