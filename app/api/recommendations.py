from fastapi import APIRouter, Depends, status

from app.api.deps import get_current_user
from app.models.recommendation import RecommendationRequest, RecommendationResponse
from app.services import recommendation_service

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.post("", response_model=RecommendationResponse, status_code=status.HTTP_201_CREATED)
async def create_recommendation(
    data: RecommendationRequest,
    user: dict = Depends(get_current_user),  # 401 if not signed in
):
    """Recommend dishes from a menu, based on the signed-in user's preferences.

    Takes 5-20 seconds (Gemini call). The result is saved and returned with
    dishes already split into familiarDishes and newDishes.
    """
    return await recommendation_service.recommend(user["_id"], data)
