from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient
from fastapi import HTTPException

from app.main import app

client = TestClient(app)

client.post("/api/auth/register")

def test_register_success():
    fake_user = {
        "_id": "507f1f77bcf86cd799439011",
        "email": "test@example.com",
        "username": "testuser",
    }

    with patch(
        "app.api.auth.AuthService.register",
        new=AsyncMock(return_value=fake_user),
    ):
        response = client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "username": "testuser",
                "password": "Test1234",
                "accepted_terms": True,
            },
        )

    assert response.status_code == 201
    assert response.json()["user"]["email"] == "test@example.com"
    assert response.json()["user"]["username"] == "testuser"

def test_register_duplicate_email():
    with patch(
        "app.api.auth.AuthService.register",
        new=AsyncMock(
            side_effect=HTTPException(
                status_code=409,
                detail="Email is already registered.",
            )
        ),
    ):
        response = client.post(
            "/api/auth/register",
            json={
                "email": "existing@example.com",
                "username": "newuser",
                "password": "Test1234",
                "accepted_terms": True,
            },
        )

    assert response.status_code == 409
    assert response.json()["message"] == "Email is already registered."

def test_register_invalid_email():
    response = client.post(
        "/api/auth/register",
        json={
            "email": "not-an-email",
            "username": "testuser",
            "password": "Test1234",
            "accepted_terms": True,
        },
    )

    assert response.status_code == 422

def test_login_success():
    fake_user = {
        "_id": "507f1f77bcf86cd799439011",
        "email": "test@example.com",
        "username": "testuser",
    }

    with patch(
        "app.api.auth.AuthService.login",
        new=AsyncMock(return_value=fake_user),
    ):
        response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "Test1234",
                "remember_me": True,
            },
        )

    assert response.status_code == 200
    assert response.json()["user"]["email"] == "test@example.com"
    assert response.json()["user"]["username"] == "testuser"
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies

def test_login_wrong_password():
    with patch(
        "app.api.auth.AuthService.login",
        new=AsyncMock(
            side_effect=HTTPException(
                status_code=401,
                detail="Invalid email or password.",
            )
        ),
    ):
        response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "WrongPassword123",
                "remember_me": False,
            },
        )

    assert response.status_code == 401
    assert response.json()["message"] == "Invalid email or password."

def test_protected_endpoint_requires_authentication():
    unauthenticated_client = TestClient(app)

    response = unauthenticated_client.get("/api/auth/me")

    assert response.status_code == 401
    assert response.json()["message"] == "Not authenticated."