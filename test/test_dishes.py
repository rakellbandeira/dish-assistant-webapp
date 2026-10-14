from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.main import app

client = TestClient(app)


def test_liked_dishes_requires_authentication():
    response = client.get("/api/dishes/liked")

    assert response.status_code == 401
    assert response.json()["message"] == "Not authenticated."


def test_liked_dishes_returns_empty_list_for_authenticated_user():
    def fake_current_user():
        return {
            "_id": "507f1f77bcf86cd799439011",
            "email": "test@example.com",
            "username": "testuser",
        }

    app.dependency_overrides[get_current_user] = fake_current_user

    try:
        with patch(
            "app.api.dishes.liked_dishes_service.get_liked_dishes",
            new_callable=AsyncMock,
            return_value=[],
        ):
            response = client.get("/api/dishes/liked")

        assert response.status_code == 200
        assert response.json() == {"dishes": []}

    finally:
        app.dependency_overrides.clear()
        