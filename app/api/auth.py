from fastapi import APIRouter
from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.models.auth import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UserPublic,
)

from app.api.deps import get_current_user

from app.services.auth_service import AuthService

from app.core.security import clear_auth_cookies, set_auth_cookies

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest):
    user = await AuthService.register(
        email=data.email,
        username=data.username,
        password=data.password,
    )

    return AuthResponse(
        user=UserPublic.from_mongo(user)
    )

@router.post("/login", response_model=AuthResponse)
async def login(data: LoginRequest, response: Response):
    user = await AuthService.login(
        email=data.email,
        password=data.password,
    )

    set_auth_cookies(
        response=response,
        user_id=str(user["_id"]),
        remember_me=data.remember_me,
    )

    return AuthResponse(
        user=UserPublic.from_mongo(user)
    )

@router.post("/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"message": "Logged out successfully."}

@router.get("/me", response_model=AuthResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return AuthResponse(
        user=UserPublic.from_mongo(user)
    )