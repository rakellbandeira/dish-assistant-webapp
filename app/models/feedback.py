"""Models for rating a recommended dish (POST /api/feedback)."""
from pydantic import Field

from app.models.preferences import CamelModel

LIKED_MIN_RATING = 3  # 3-5 stars = liked, 1-2 stars = disliked


class RatingRequest(CamelModel):
    dish_id: str = Field(min_length=1)
    rating: int = Field(ge=1, le=5)


class RatingResponse(CamelModel):
    dish_id: str
    rating: int
    liked: bool
