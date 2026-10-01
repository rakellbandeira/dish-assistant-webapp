"""Models for AI recommendations.

1. What we ask Gemini to return (AIRecommendationResult). Its JSON schema is sent to
   Gemini, so the Field descriptions below are instructions the AI reads too.
2. What the frontend sends us (RecommendationRequest).
3. What we send back to the frontend (RecommendationResponse).
"""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.models.preferences import CamelModel
from app.services.prompts import MENU_SECTIONS

Classification = Literal["familiar", "new"]
Section = Literal[tuple(MENU_SECTIONS)]

MAX_MENU_LENGTH = 5000  # same limit as the frontend menu textarea


# 1. GEMINI'S ANSWER

class AIRecommendedDish(BaseModel):
    name: str = Field(description="Dish name exactly as written on the menu")
    description: str = Field(description="1-2 plain-language sentences: what the dish is and its main ingredients")
    classification: Classification = Field(description="'familiar' if it closely matches the diner's likes, 'new' if it is a stretch worth trying")
    reason: str = Field(description="1-2 sentences on why it suits this diner, referring to their preferences")
    section: Section = Field(description="Menu section the dish belongs to")


class AIRecommendationResult(BaseModel):
    summary: str = Field(description="2-3 sentences introducing the picks to the diner")
    dishes: list[AIRecommendedDish]


# 2. REQUEST FROM THE FRONTEND

class RecommendationRequest(CamelModel):
    menu_text: str = Field(min_length=10, max_length=MAX_MENU_LENGTH)
    restaurant_name: str | None = Field(default=None, max_length=200)
    restaurant_place: str | None = Field(default=None, max_length=200)


# 3. RESPONSE TO THE FRONTEND

class DishOut(CamelModel):
    id: str
    name: str
    description: str
    classification: Classification
    reason: str
    section: str


class RecommendationResponse(CamelModel):
    id: str
    menu_id: str
    summary: str
    familiar_dishes: list[DishOut]
    new_dishes: list[DishOut]
    created_at: datetime
