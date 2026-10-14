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


def test_feedback_requires_authentication():
    response = client.post(
        "/api/feedback",
        json={
            "dish_id": "507f1f77bcf86cd799439011",
            "rating": 5,
        },
    )

    assert response.status_code == 401
    assert response.json()["message"] == "Not authenticated."


@pytest.mark.parametrize("rating", [0, 6, -1, 10])
def test_feedback_rejects_invalid_rating(authenticated_user, rating):
    response = client.post(
        "/api/feedback",
        json={
            "dish_id": "507f1f77bcf86cd799439011",
            "rating": rating,
        },
    )

    assert response.status_code == 422