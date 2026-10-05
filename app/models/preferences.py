"""The user's food preferences, in the shape the frontend preference form produces
(dish-assistant-frontend/lib/preferences.ts).

JSON uses camelCase (likedFlavors, triedDishes...), Python code uses snake_case
(profile.liked_flavors, profile.tried_dishes...).

PreferenceProfile is used three ways:
- request body of POST/PUT /api/preferences (validated by the rules below)
- what is stored in the preferences collection
- what the recommendation engine reads to build the AI prompt
"""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from pydantic.alias_generators import to_camel

MAX_ITEMS_PER_LIST = 30
MAX_ITEM_LENGTH = 50
MAX_TRIED_DISHES = 50


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class TriedDish(CamelModel):
    id: str | None = Field(default=None, max_length=64)  # frontend row id, kept so the form can edit rows
    name: str = Field(min_length=1, max_length=200)
    rating: int = Field(ge=1, le=5)  # 1 = disliked it ... 5 = loved it

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, value):
        return value.strip() if isinstance(value, str) else value


class PreferenceProfile(CamelModel):
    liked_flavors: list[str] = Field(default=[], max_length=MAX_ITEMS_PER_LIST)
    liked_foods: list[str] = Field(default=[], max_length=MAX_ITEMS_PER_LIST)
    disliked_flavors: list[str] = Field(default=[], max_length=MAX_ITEMS_PER_LIST)
    disliked_foods: list[str] = Field(default=[], max_length=MAX_ITEMS_PER_LIST)
    cuisines: list[str] = Field(default=[], max_length=MAX_ITEMS_PER_LIST)
    dietary: list[str] = Field(default=[], max_length=MAX_ITEMS_PER_LIST)
    allergies: list[str] = Field(default=[], max_length=MAX_ITEMS_PER_LIST)
    tried_dishes: list[TriedDish] = Field(default=[], max_length=MAX_TRIED_DISHES)

    @field_validator("liked_flavors", "liked_foods", "disliked_flavors", "disliked_foods", "cuisines", "dietary", "allergies")
    @classmethod
    def clean_list(cls, items: list[str]) -> list[str]:
        """Trim each item, drop empty ones and duplicates (ignoring case), and limit item length."""
        cleaned, seen = [], set()
        for item in items:
            item = item.strip()
            if not item or item.casefold() in seen:
                continue
            if len(item) > MAX_ITEM_LENGTH:
                raise ValueError(f"Each item must be at most {MAX_ITEM_LENGTH} characters ('{item[:20]}...').")
            seen.add(item.casefold())
            cleaned.append(item)
        return cleaned

    @field_validator("tried_dishes")
    @classmethod
    def unique_dish_names(cls, dishes: list[TriedDish]) -> list[TriedDish]:
        seen = set()
        for dish in dishes:
            if dish.name.casefold() in seen:
                raise ValueError(f"'{dish.name}' is listed more than once in tried dishes.")
            seen.add(dish.name.casefold())
        return dishes

    @model_validator(mode="after")
    def no_like_dislike_clash(self) -> "PreferenceProfile":
        """The same flavor/food can't be both liked and disliked (same rule as the frontend form)."""
        for liked, disliked in ((self.liked_flavors, self.disliked_flavors), (self.liked_foods, self.disliked_foods)):
            clash = sorted({x.casefold() for x in liked} & {x.casefold() for x in disliked})
            if clash:
                raise ValueError(f"{', '.join(clash)} can't be in both likes and dislikes.")
        return self

    def is_empty(self) -> bool:
        return not any(getattr(self, field) for field in type(self).model_fields)


class PreferenceResponse(PreferenceProfile):
    """What GET/POST/PUT return: the saved preferences plus timestamps."""
    created_at: datetime
    updated_at: datetime
