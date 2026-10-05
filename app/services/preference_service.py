"""Saving and loading a user's food preferences (one document per user).

Stored document:
    {"_id", "user_id", "liked_flavors": [...], ..., "tried_dishes": [...], "created_at", "updated_at"}
"""
import logging
import uuid
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status
from pydantic import ValidationError
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from app.db.database import preferences_collection
from app.models.preferences import MAX_TRIED_DISHES, PreferenceProfile, PreferenceResponse

logger = logging.getLogger(__name__)

NOT_FOUND_MESSAGE = "No preferences saved yet."


async def create_indexes() -> None:
    # One preferences document per user; also makes lookups by user_id fast
    await preferences_collection.create_index([("user_id", 1)], unique=True)


async def get_preferences(user_id: ObjectId) -> PreferenceResponse:
    document = await preferences_collection.find_one({"user_id": user_id})
    if document is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, NOT_FOUND_MESSAGE)
    return PreferenceResponse.model_validate(document)


async def get_profile_or_empty(user_id: ObjectId) -> PreferenceProfile:
    """For the recommendation engine: the saved profile, or an empty one for new users."""
    document = await preferences_collection.find_one({"user_id": user_id})
    if document is None:
        return PreferenceProfile()
    try:
        return PreferenceProfile.model_validate(document)
    except ValidationError:
        logger.warning("Preferences for user %s are in an unexpected format; using an empty profile", user_id)
        return PreferenceProfile()


async def create_preferences(user_id: ObjectId, profile: PreferenceProfile) -> PreferenceResponse:
    now = datetime.now(timezone.utc)
    document = {"user_id": user_id, **profile.model_dump(), "created_at": now, "updated_at": now}
    try:
        await preferences_collection.insert_one(document)
    except DuplicateKeyError:
        raise HTTPException(status.HTTP_409_CONFLICT, "Preferences already exist. Use PUT to update them.")
    return PreferenceResponse.model_validate(document)


async def update_preferences(user_id: ObjectId, profile: PreferenceProfile) -> PreferenceResponse:
    """Replace all preference fields (the frontend always sends the whole form)."""
    document = await preferences_collection.find_one_and_update(
        {"user_id": user_id},
        {"$set": {**profile.model_dump(), "updated_at": datetime.now(timezone.utc)}},
        return_document=ReturnDocument.AFTER,
    )
    if document is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, NOT_FOUND_MESSAGE)
    return PreferenceResponse.model_validate(document)


async def delete_preferences(user_id: ObjectId) -> None:
    # Deleting twice is fine: the result is the same (no preferences)
    await preferences_collection.delete_one({"user_id": user_id})


async def rate_tried_dish(user_id: ObjectId, dish_name: str, rating: int) -> None:
    """Add a dish to "Dishes tried" with this rating, or update its rating if it's already there.

    Used when the user rates a recommended dish. Creates the preferences document if the user
    has none yet. If the list is full, the oldest tried dish is dropped.
    """
    document = await preferences_collection.find_one({"user_id": user_id}, {"tried_dishes": 1})
    tried = list(document.get("tried_dishes", [])) if document else []

    key = dish_name.strip().casefold()
    existing = next((d for d in tried if d.get("name", "").strip().casefold() == key), None)
    if existing:
        existing["rating"] = rating
    else:
        tried.append({"id": uuid.uuid4().hex, "name": dish_name.strip(), "rating": rating})
        tried = tried[-MAX_TRIED_DISHES:]  # keep the newest ones

    now = datetime.now(timezone.utc)
    if document is None:
        empty = PreferenceProfile().model_dump()
        await preferences_collection.insert_one(
            {"user_id": user_id, **empty, "tried_dishes": tried, "created_at": now, "updated_at": now}
        )
    else:
        await preferences_collection.update_one(
            {"user_id": user_id}, {"$set": {"tried_dishes": tried, "updated_at": now}}
        )
