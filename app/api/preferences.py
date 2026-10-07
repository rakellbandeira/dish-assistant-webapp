from fastapi import APIRouter, Depends, status

from app.api.deps import get_current_user
from app.models.auth import MessageResponse
from app.models.preferences import PreferenceProfile, PreferenceResponse
from app.services import preference_service

# Every route here needs a signed-in user; preferences always belong to that user
router = APIRouter(prefix="/preferences", tags=["Preferences"])


@router.post("", response_model=PreferenceResponse, status_code=status.HTTP_201_CREATED)
async def create_preferences(data: PreferenceProfile, user: dict = Depends(get_current_user)):
    """Save preferences for the first time (409 if they already exist)."""
    return await preference_service.create_preferences(user["_id"], data)


@router.get("", response_model=PreferenceResponse)
async def get_preferences(user: dict = Depends(get_current_user)):
    """The signed-in user's preferences (404 if none saved yet)."""
    return await preference_service.get_preferences(user["_id"])


@router.put("", response_model=PreferenceResponse)
async def update_preferences(data: PreferenceProfile, user: dict = Depends(get_current_user)):
    """Replace the saved preferences with the ones sent (404 if none saved yet)."""
    return await preference_service.update_preferences(user["_id"], data)


@router.delete("", response_model=MessageResponse)
async def delete_preferences(user: dict = Depends(get_current_user)):
    """Reset: remove all saved preferences."""
    await preference_service.delete_preferences(user["_id"])
    return MessageResponse(message="Preferences reset.")
