"""The recommendation engine.

recommend() runs the whole flow:
    load preferences -> build prompt -> ask Gemini -> check the answer
    -> split familiar / new -> save to MongoDB -> return the result

The AI is asked to follow the rules in SYSTEM_PROMPT, but AI output is never fully
trusted: _check_dishes() re-applies the critical rules in plain Python.
"""
import logging
import re
import unicodedata
from datetime import datetime, timezone

from bson import ObjectId
from pydantic import ValidationError

from app.db.database import (
    ai_recommendation_collection,
    dish_collection,
    menu_collection,
    preferences_collection,
)
from app.models.preferences import PreferenceProfile
from app.models.recommendation import (
    AIRecommendationResult,
    AIRecommendedDish,
    DishOut,
    RecommendationRequest,
    RecommendationResponse,
)
from app.services.gemini_client import generate_structured
from app.services.prompts import (
    MAX_FAMILIAR_DISHES,
    MAX_NEW_DISHES,
    PROMPT_VERSION,
    SYSTEM_PROMPT,
    build_recommendation_prompt,
)

logger = logging.getLogger(__name__)


async def recommend(user_id: ObjectId, request: RecommendationRequest) -> RecommendationResponse:
    profile = await get_preference_profile(user_id)

    prompt = build_recommendation_prompt(
        profile, request.menu_text, request.restaurant_name, request.restaurant_place
    )
    ai = await generate_structured(
        system_instruction=SYSTEM_PROMPT,
        prompt=prompt,
        response_model=AIRecommendationResult,
    )

    familiar, new = _check_dishes(ai.data.dishes, profile, request.menu_text)
    return await _save(user_id, request, ai.data.summary, familiar, new, ai.model)


async def get_preference_profile(user_id: ObjectId) -> PreferenceProfile:
    """The user's saved preferences, or an empty profile if they haven't saved any yet."""
    document = await preferences_collection.find_one({"user_id": user_id})
    if document is None:
        return PreferenceProfile()
    try:
        # Extra fields such as _id, user_id and timestamps are ignored
        return PreferenceProfile.model_validate(document)
    except ValidationError:
        logger.warning("Preferences for user %s are in an unexpected format; using an empty profile", user_id)
        return PreferenceProfile()


# RECOMMENDATION LOGIC

def _check_dishes(
    dishes: list[AIRecommendedDish], profile: PreferenceProfile, menu_text: str
) -> tuple[list[AIRecommendedDish], list[AIRecommendedDish]]:
    """Re-apply the critical rules to the AI's answer, then split it into (familiar, new)."""
    menu = _normalize(menu_text)
    allergens = [_normalize(a) for a in profile.allergies if a.strip()]
    seen: set[str] = set()
    familiar: list[AIRecommendedDish] = []
    new: list[AIRecommendedDish] = []

    for dish in dishes:
        name = _normalize(dish.name)
        if not name or name in seen:
            continue  # empty or duplicate
        if name not in menu:
            logger.info("Dropped %r: not found in the menu", dish.name)
            continue
        # Check the menu's own wording too, not only the AI's description
        if _mentions_allergen(f"{dish.name} {dish.description} {_menu_lines_for(dish.name, menu_text)}", allergens):
            logger.info("Dropped %r: mentions one of the user's allergies", dish.name)
            continue
        seen.add(name)

        # A user with no preferences can't have "familiar" dishes yet
        if dish.classification == "familiar" and not profile.is_empty():
            familiar.append(dish)
        else:
            new.append(dish.model_copy(update={"classification": "new"}))

    if not new:
        logger.warning("No 'new' dishes left after checks (prompt asks for at least one)")
    return familiar[:MAX_FAMILIAR_DISHES], new[:MAX_NEW_DISHES]


def _normalize(text: str) -> str:
    """Lowercase, remove accents and collapse spaces, so 'Crème  Brûlée' matches 'creme brulee'."""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(char for char in text if not unicodedata.combining(char))
    return re.sub(r"\s+", " ", text).strip().casefold()


def _menu_lines_for(dish_name: str, menu_text: str) -> str:
    """The menu line(s) where the dish appears, e.g. 'Massaman Curry - beef, potato, peanuts'."""
    name = _normalize(dish_name)
    return " ".join(line for line in menu_text.splitlines() if name in _normalize(line))


def _mentions_allergen(text: str, allergens: list[str]) -> bool:
    # Safety net only: catches allergens named in the dish name, the AI's description or
    # the menu line (e.g. "peanut" in "Massaman curry - beef, peanuts"). The AI's rule 1 is the main guard.
    text = _normalize(text)
    for allergen in allergens:
        stem = allergen[:-1] if allergen.endswith("s") and len(allergen) > 3 else allergen
        if re.search(rf"\b{re.escape(stem)}", text):
            return True
    return False


# SAVING TO MONGODB

async def _save(
    user_id: ObjectId,
    request: RecommendationRequest,
    summary: str,
    familiar: list[AIRecommendedDish],
    new: list[AIRecommendedDish],
    model: str,
) -> RecommendationResponse:
    now = datetime.now(timezone.utc)

    menu = {"user_id": user_id, "menu_text": request.menu_text, "created_at": now}
    if request.restaurant_name:
        menu["restaurant_name"] = request.restaurant_name
    if request.restaurant_place:
        menu["restaurant_place"] = request.restaurant_place
    menu_id = (await menu_collection.insert_one(menu)).inserted_id

    recommendation_id = (await ai_recommendation_collection.insert_one({
        "user_id": user_id,
        "menu_id": menu_id,
        "summary": summary,
        "model": model,  # main or fallback, whichever answered
        "prompt_version": PROMPT_VERSION,
        "created_at": now,
    })).inserted_id

    dish_documents = [
        {"ai_recommendation_id": recommendation_id, **dish.model_dump(), "created_at": now}
        for dish in familiar + new
    ]
    if dish_documents:
        await dish_collection.insert_many(dish_documents)  # adds "_id" to each document

    def to_out(document: dict) -> DishOut:
        return DishOut(id=str(document["_id"]), **{k: document[k] for k in ("name", "description", "classification", "reason", "section")})

    return RecommendationResponse(
        id=str(recommendation_id),
        menu_id=str(menu_id),
        summary=summary,
        familiar_dishes=[to_out(d) for d in dish_documents if d["classification"] == "familiar"],
        new_dishes=[to_out(d) for d in dish_documents if d["classification"] == "new"],
        created_at=now,
    )
