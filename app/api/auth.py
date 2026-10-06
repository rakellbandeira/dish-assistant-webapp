from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from app.models.auth import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UserPublic,
)

from app.api.deps import get_current_user

from app.services.auth_service import AuthService

from app.core.security import (
    REFRESH_COOKIE_NAME,
    clear_auth_cookies,
    decode_token,
    set_auth_cookies,
    unauthorized,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, response: Response):
    user = await AuthService.register(
        email=data.email,
        username=data.username,
        password=data.password,
    )

    # A new account is signed in right away, with session cookies (as if "Remember me" were unchecked)
    set_auth_cookies(
        response=response,
        user_id=str(user["_id"]),
        remember_me=False,
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

@router.post("/refresh", response_model=AuthResponse)
async def refresh(request: Request, response: Response):
    """Issue a new pair of cookies using the refresh cookie (no password needed).

    Keeps the user signed in after the 30-minute access token expires, for 7 days
    (or 30 with "Remember me"). Called by the frontend when another request returns 401.
    """
    token = request.cookies.get(REFRESH_COOKIE_NAME)
    if not token:
        raise unauthorized()

    payload = decode_token(token, expected_type="refresh")  # 401 if invalid or expired
    user = await AuthService.get_user_by_id(payload["sub"])
    if user is None:
        raise unauthorized("User no longer exists.")

    # Keep the same "Remember me" choice the user made when signing in
    set_auth_cookies(response=response, user_id=str(user["_id"]), remember_me=payload.get("remember", False))
    return AuthResponse(user=UserPublic.from_mongo(user))

@router.post("/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"message": "Logged out successfully."}

@router.get("/me", response_model=AuthResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return AuthResponse(
        user=UserPublic.from_mongo(user)
    )