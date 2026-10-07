from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.dish import LikedDishesResponse
from app.services import liked_dishes_service

router = APIRouter(prefix="/dishes", tags=["Dishes"])


@router.get("/liked", response_model=LikedDishesResponse)
async def get_liked_dishes(user: dict = Depends(get_current_user)):
    """Dishes the signed-in user liked: positive feedback + dishes rated 4-5 in preferences."""
    return LikedDishesResponse(dishes=await liked_dishes_service.get_liked_dishes(user["_id"]))
