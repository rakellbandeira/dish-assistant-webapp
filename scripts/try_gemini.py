"""Manual check of the Gemini integration, without the database or the web server.

Sends a sample preference profile + menu through the real prompt and Gemini,
then applies the same checks as the recommendation engine.

Run from the repo root (venv active):
    python -m scripts.try_gemini
"""
import asyncio
import time

from app.core.config import settings
from app.models.preferences import PreferenceProfile
from app.models.recommendation import AIRecommendationResult
from app.services.gemini_client import generate_structured
from app.services.prompts import SYSTEM_PROMPT, build_recommendation_prompt
from app.services.recommendation_service import _check_dishes

PROFILE = PreferenceProfile.model_validate({
    "likedFlavors": ["Spicy", "Umami"],
    "likedFoods": ["Chicken", "Rice", "Seafood"],
    "dislikedFoods": ["Mushrooms"],
    "cuisines": ["Thai", "Mexican"],
    "allergies": ["Peanuts"],
    "triedDishes": [{"name": "Pad Thai", "rating": 5}, {"name": "Polenta", "rating": 1}],
})

MENU = """\
SIAM GARDEN - THAI KITCHEN
Starters
  Chicken Satay with peanut sauce .......... 9
  Fresh Spring Rolls (shrimp, herbs) ....... 8
Soups
  Tom Yum Goong - hot & sour shrimp soup ... 12
  Tom Kha Het - coconut mushroom soup ...... 10
Mains
  Khao Man Gai - poached chicken, ginger rice 15
  Massaman Curry - beef, potato, peanuts ... 17
  Pla Rad Prik - crispy fish, chili sauce .. 19
  Gaeng Hung Lay - northern pork curry ..... 18
Desserts
  Mango Sticky Rice ........................ 8
"""


async def main() -> None:
    print(f"Model: {settings.gemini_model} (fallback: {settings.gemini_fallback_model})\nSending request...\n")
    started = time.perf_counter()
    ai = await generate_structured(
        system_instruction=SYSTEM_PROMPT,
        prompt=build_recommendation_prompt(PROFILE, MENU, "Siam Garden", "Provo, UT"),
        response_model=AIRecommendationResult,
    )
    result = ai.data
    print(f"Answered by {ai.model} in {time.perf_counter() - started:.1f}s\n")
    print("SUMMARY:", result.summary, "\n")

    print("RAW AI ANSWER:")
    for dish in result.dishes:
        print(f"  [{dish.classification:8}] {dish.name} ({dish.section})")

    familiar, new = _check_dishes(result.dishes, PROFILE, MENU)
    print("\nAFTER ENGINE CHECKS:")
    for title, dishes in (("FAMILIAR", familiar), ("NEW TO TRY", new)):
        print(f"\n{title}")
        for dish in dishes:
            print(f"  - {dish.name} ({dish.section})\n      what:  {dish.description}\n      why:   {dish.reason}")

    peanut_dishes = {"Chicken Satay with peanut sauce", "Massaman Curry"}
    leaked = [d.name for d in familiar + new if any(p.lower() in d.name.lower() for p in peanut_dishes)]
    print("\nALLERGY CHECK:", "FAILED, peanut dish recommended: " + ", ".join(leaked) if leaked else "passed (no peanut dishes)")


if __name__ == "__main__":
    asyncio.run(main())
