from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.db.database import preferences_collection
from app.models.preferences import PreferenceProfile


router = APIRouter(prefix="/preferences", tags=["Preferences"])


@router.post("", response_model=PreferenceProfile, status_code=status.HTTP_201_CREATED)
async def create_preferences(
    data: PreferenceProfile,
    user: dict = Depends(get_current_user),
):
    existing_preferences = await preferences_collection.find_one(
        {"user_id": user["_id"]}
    )

    if existing_preferences is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Preferences already exist for this user.",
        )

    now = datetime.now(timezone.utc)

    document = {
        "user_id": user["_id"],
        **data.model_dump(),
        "created_at": now,
        "updated_at": now,
    }

    await preferences_collection.insert_one(document)

    return data


@router.get("", response_model=PreferenceProfile)
async def get_preferences(
    user: dict = Depends(get_current_user),
):
    document = await preferences_collection.find_one({"user_id": user["_id"]})

    if document is None:
        return PreferenceProfile()

    return PreferenceProfile.model_validate(document)

@router.put("", response_model=PreferenceProfile)
async def update_preferences(
    data: PreferenceProfile,
    user: dict = Depends(get_current_user),
):
    existing_preferences = await preferences_collection.find_one(
        {"user_id": user["_id"]}
    )

    if existing_preferences is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferences not found for this user.",
        )

    now = datetime.now(timezone.utc)

    update_data = {
        **data.model_dump(),
        "updated_at": now,
    }

    await preferences_collection.update_one(
        {"user_id": user["_id"]},
        {"$set": update_data},
    )

    return data

@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_preferences(
    user: dict = Depends(get_current_user),
):
    result = await preferences_collection.delete_one(
        {"user_id": user["_id"]}
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferences not found for this user.",
        )

    return None