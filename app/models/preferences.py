"""The user's food preferences, in the shape the frontend preference form produces
(dish-assistant-frontend/lib/preferences.ts).

JSON uses camelCase (likedFlavors, triedDishes...), Python code uses snake_case
(profile.liked_flavors, profile.tried_dishes...).
"""
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class TriedDish(CamelModel):
    name: str = Field(min_length=1, max_length=200)
    rating: int = Field(ge=1, le=5)  # 1 = disliked it ... 5 = loved it


class PreferenceProfile(CamelModel):
    liked_flavors: list[str] = []
    liked_foods: list[str] = []
    disliked_flavors: list[str] = []
    disliked_foods: list[str] = []
    cuisines: list[str] = []
    dietary: list[str] = []
    allergies: list[str] = []
    tried_dishes: list[TriedDish] = []

    def is_empty(self) -> bool:
        return not any(getattr(self, field) for field in type(self).model_fields)
