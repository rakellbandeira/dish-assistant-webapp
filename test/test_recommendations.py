import pytest
from fastapi.testclient import TestClient

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


def test_recommendations_requires_authentication():
    response = client.post(
        "/api/recommendations",
        json={
            "menuText": "Pizza Margherita with fresh basil",
            "restaurantPlace": "Sao Paulo",
        },
    )

    assert response.status_code == 401
    assert response.json()["message"] == "Not authenticated."


def test_recommendations_rejects_short_menu(authenticated_user):
    response = client.post(
        "/api/recommendations",
        json={
            "menuText": "Pizza",
            "restaurantPlace": "Sao Paulo",
        },
    )

    assert response.status_code == 422


def test_recommendations_rejects_short_restaurant_place(authenticated_user):
    response = client.post(
        "/api/recommendations",
        json={
            "menuText": "Pizza Margherita with fresh basil",
            "restaurantPlace": " ",
        },
    )

    assert response.status_code == 422