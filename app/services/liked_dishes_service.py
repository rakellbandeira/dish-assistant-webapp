"""Dishes the user liked, from two sources:

1. Positive feedback on recommended dishes (feedback collection, liked = true), newest first
2. Dishes rated 3-5 in "Dishes tried" in the user's preferences, best rated first

The same dish name only appears once (feedback wins, since it has a description).
"""
from bson import ObjectId

from app.db.database import dish_collection, feedback_collection
from app.models.dish import LikedDish
from app.services import preference_service

MIN_LIKED_RATING = 3  # same rule as rating feedback: 3+ stars = liked
MAX_LIKED_DISHES = 12


async def get_liked_dishes(user_id: ObjectId) -> list[LikedDish]:
    dishes: list[LikedDish] = []
    seen: set[str] = set()

    def add(dish: LikedDish) -> None:
        key = dish.name.strip().casefold()
        if key and key not in seen:
            seen.add(key)
            dishes.append(dish)

    for dish in await _from_feedback(user_id):
        add(dish)
    for dish in await _from_preferences(user_id):
        add(dish)
    return dishes[:MAX_LIKED_DISHES]


async def _from_feedback(user_id: ObjectId) -> list[LikedDish]:
    feedback = await feedback_collection.find(
        {"user_id": user_id, "liked": True}, {"dish_id": 1}
    ).sort("created_at", -1).to_list(MAX_LIKED_DISHES)
    dish_ids = [f["dish_id"] for f in feedback]
    if not dish_ids:
        return []

    found = {d["_id"]: d for d in await dish_collection.find({"_id": {"$in": dish_ids}}).to_list(len(dish_ids))}
    return [
        LikedDish(name=d["name"], source="feedback", description=d.get("description"), section=d.get("section"))
        for dish_id in dish_ids  # keep newest-first order
        if (d := found.get(dish_id))
    ]


async def _from_preferences(user_id: ObjectId) -> list[LikedDish]:
    profile = await preference_service.get_profile_or_empty(user_id)
    liked = [d for d in profile.tried_dishes if d.rating >= MIN_LIKED_RATING]
    liked.sort(key=lambda d: d.rating, reverse=True)
    return [LikedDish(name=d.name, source="rating", rating=d.rating) for d in liked]
