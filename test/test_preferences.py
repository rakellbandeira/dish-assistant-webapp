import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.main import app
from unittest.mock import AsyncMock, patch

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
        "app.api.preferences.preferences_collection.find_one",
        new=AsyncMock(return_value=None),
    ), patch(
        "app.api.preferences.preferences_collection.insert_one",
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
        "app.api.preferences.preferences_collection.find_one",
        new=AsyncMock(
            return_value={
                "user_id": "507f1f77bcf86cd799439011"
            }
        ),
    ):
        response = client.post(
            "/api/preferences",
            json={
                "likedFlavors": ["spicy"],
            },
        )

    assert response.status_code == 409
    assert response.json()["message"] == "Preferences already exist for this user."

def test_update_preferences(authenticated_user):
    existing_preferences = {
        "user_id": "507f1f77bcf86cd799439011",
        "liked_flavors": ["spicy"],
    }

    with patch(
        "app.api.preferences.preferences_collection.find_one",
        new=AsyncMock(return_value=existing_preferences),
    ), patch(
        "app.api.preferences.preferences_collection.update_one",
        new=AsyncMock(),
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
        "app.api.preferences.preferences_collection.delete_one",
        new=AsyncMock(return_value=type("Result", (), {"deleted_count": 1})()),
    ):
        response = client.delete("/api/preferences")

    assert response.status_code == 204

def test_delete_preferences_not_found(authenticated_user):
    with patch(
        "app.api.preferences.preferences_collection.delete_one",
        new=AsyncMock(return_value=type("Result", (), {"deleted_count": 0})()),
    ):
        response = client.delete("/api/preferences")

    assert response.status_code == 404
    assert response.json()["message"] == "Preferences not found for this user."