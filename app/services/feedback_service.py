"""Rating recommended dishes.

A rating does two things:
1. Saves feedback (one document per user + dish; rating again replaces it)
2. Adds the dish to the user's preferences as a tried dish with that rating,
   so the AI takes it into account in future recommendations
"""
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status

from app.db.database import ai_recommendation_collection, dish_collection, feedback_collection, to_object_id
from app.models.feedback import LIKED_MIN_RATING, RatingResponse
from app.services import preference_service


async def create_indexes() -> None:
    # One feedback document per user and dish
    await feedback_collection.create_index([("user_id", 1), ("dish_id", 1)], unique=True)


async def rate_dish(user_id: ObjectId, dish_id: str, rating: int) -> RatingResponse:
    dish = await _get_users_dish(user_id, dish_id)
    liked = rating >= LIKED_MIN_RATING
    now = datetime.now(timezone.utc)

    await feedback_collection.update_one(
        {"user_id": user_id, "dish_id": dish["_id"]},
        {
            "$set": {
                "ai_recommendation_id": dish["ai_recommendation_id"],
                "rating": rating,
                "liked": liked,
                "updated_at": now,
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,  # create it the first time, update it when rated again
    )
    await preference_service.rate_tried_dish(user_id, dish["name"], rating)

    return RatingResponse(dish_id=str(dish["_id"]), rating=rating, liked=liked)


async def _get_users_dish(user_id: ObjectId, dish_id: str) -> dict:
    """The dish, but only if it came from one of this user's recommendations (404 otherwise)."""
    not_found = HTTPException(status.HTTP_404_NOT_FOUND, "Dish not found.")
    object_id = to_object_id(dish_id)
    if object_id is None:
        raise not_found

    dish = await dish_collection.find_one({"_id": object_id})
    if dish is None:
        raise not_found
    owner = await ai_recommendation_collection.find_one(
        {"_id": dish.get("ai_recommendation_id"), "user_id": user_id}, {"_id": 1}
    )
    if owner is None:
        raise not_found  # someone else's dish: don't reveal that it exists
    return dish
