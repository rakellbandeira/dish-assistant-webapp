"""Models for the "Dishes you previously liked" row on the home page."""
from typing import Literal

from app.models.preferences import CamelModel


class LikedDish(CamelModel):
    name: str
    # "rating": rated 4-5 in "Dishes tried" (preferences)
    # "feedback": a recommended dish the user marked as liked
    source: Literal["rating", "feedback"]
    rating: int | None = None        # only for source "rating"
    description: str | None = None   # only for source "feedback" (comes from the saved dish)
    section: str | None = None       # only for source "feedback"


class LikedDishesResponse(CamelModel):
    dishes: list[LikedDish]
