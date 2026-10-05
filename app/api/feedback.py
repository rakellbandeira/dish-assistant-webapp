from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.feedback import RatingRequest, RatingResponse
from app.services import feedback_service

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.post("", response_model=RatingResponse)
async def rate_dish(data: RatingRequest, user: dict = Depends(get_current_user)):
    """Rate a recommended dish 1-5. 3+ = liked, 1-2 = disliked. Rating again replaces the old rating."""
    return await feedback_service.rate_dish(user["_id"], data.dish_id, data.rating)
