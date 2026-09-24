"""Shared FastAPI dependencies.

Protect a route by adding the current user as a parameter:

    @router.get("/preferences")
    async def get_preferences(user: dict = Depends(get_current_user)):
    
"""
from fastapi import Request

from app.core.security import ACCESS_COOKIE_NAME, decode_token, unauthorized
from app.db.database import to_object_id, user_collection


async def get_current_user(request: Request) -> dict:
    """Read the access-token cookie, validate it and return the user's Mongo document.

    401 if the cookie is missing, invalid or expired, or user no longer exists.
    """
    token = request.cookies.get(ACCESS_COOKIE_NAME)
    if not token:
        raise unauthorized()

    payload = decode_token(token, expected_type="access")
    user_id = to_object_id(payload["sub"])
    if user_id is None:
        raise unauthorized("Invalid authentication token.")

    user = await user_collection.find_one({"_id": user_id})
    if user is None:
        raise unauthorized("User no longer exists.")
    return user
