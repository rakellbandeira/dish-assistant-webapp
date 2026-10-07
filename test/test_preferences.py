import pytest
from fastapi.testclient import TestClient
from pymongo.errors import DuplicateKeyError
from unittest.mock import AsyncMock, patch
from datetime import datetime, timezone
from app.api.deps import get_current_user
from app.main import app

client = TestClient(app)


@pytest.fixture
def authenticated_user():
    def fake_current_user():
        return {
            "_id": "507f1f77bcf86cd799439011",
            "email": "test@example.com",
            "username": "testuser",
        }

    app.dependency_overrides[get_current_user] = fake_current_user

    yield

    app.dependency_overrides.clear()


def test_get_preferences_requires_authentication():
    response = client.get("/api/preferences")

    assert response.status_code == 401
    assert response.json()["message"] == "Not authenticated."


def test_get_preferences_authenticated(authenticated_user):
    response = client.get("/api/preferences")

    assert response.status_code == 200


def test_create_preferences(authenticated_user):
    with patch(
        "app.services.preference_service.preferences_collection.insert_one",
        new=AsyncMock(),
    ):
        response = client.post(
            "/api/preferences",
            json={
                "likedFlavors": ["spicy"],
                "likedFoods": ["pizza"],
                "dislikedFlavors": ["bitter"],
                "dislikedFoods": ["mushrooms"],
                "cuisines": ["Japanese"],
                "dietary": ["high-protein"],
                "allergies": ["peanuts"],
                "triedDishes": [
                    {
                        "name": "Tacos",
                        "rating": 5,
                    }
                ],
            },
        )

    assert response.status_code == 201

    data = response.json()

    assert data["likedFlavors"] == ["spicy"]
    assert data["likedFoods"] == ["pizza"]
    assert data["triedDishes"][0]["name"] == "Tacos"
    assert data["triedDishes"][0]["rating"] == 5


def test_create_preferences_duplicate(authenticated_user):
    with patch(
        "app.services.preference_service.preferences_collection.insert_one",
        new=AsyncMock(side_effect=DuplicateKeyError("duplicate key")),
    ):
        response = client.post(
            "/api/preferences",
            json={
                "likedFlavors": ["spicy"],
            },
        )

    assert response.status_code == 409
    assert response.json()["message"] == (
        "Preferences already exist. Use PUT to update them."
    )


def test_update_preferences(authenticated_user):
    updated_preferences = {
    "_id": "507f1f77bcf86cd799439012",
    "user_id": "507f1f77bcf86cd799439011",
    "liked_flavors": ["spicy", "sweet"],
    "liked_foods": ["pizza"],
    "disliked_flavors": [],
    "disliked_foods": [],
    "cuisines": ["Japanese"],
    "dietary": ["high-protein"],
    "allergies": [],
    "tried_dishes": [
        {
            "name": "Sushi",
            "rating": 4,
        }
    ],
    "created_at": datetime.now(timezone.utc),
    "updated_at": datetime.now(timezone.utc),
}

    with patch(
        "app.services.preference_service.preferences_collection.find_one_and_update",
        new=AsyncMock(return_value=updated_preferences),
    ):
        response = client.put(
            "/api/preferences",
            json={
                "likedFlavors": ["spicy", "sweet"],
                "likedFoods": ["pizza"],
                "dislikedFlavors": [],
                "dislikedFoods": [],
                "cuisines": ["Japanese"],
                "dietary": ["high-protein"],
                "allergies": [],
                "triedDishes": [
                    {
                        "name": "Sushi",
                        "rating": 4,
                    }
                ],
            },
        )

    assert response.status_code == 200

    data = response.json()

    assert data["likedFlavors"] == ["spicy", "sweet"]
    assert data["likedFoods"] == ["pizza"]
    assert data["cuisines"] == ["Japanese"]
    assert data["triedDishes"][0]["name"] == "Sushi"
    assert data["triedDishes"][0]["rating"] == 4


def test_delete_preferences(authenticated_user):
    with patch(
        "app.services.preference_service.preferences_collection.delete_one",
        new=AsyncMock(),
    ):
        response = client.delete("/api/preferences")

    assert response.status_code == 200
    assert response.json()["message"] == "Preferences reset."


def test_delete_preferences_when_not_found(authenticated_user):
    with patch(
        "app.services.preference_service.preferences_collection.delete_one",
        new=AsyncMock(),
    ):
        response = client.delete("/api/preferences")

    assert response.status_code == 200
    assert response.json()["message"] == "Preferences reset."