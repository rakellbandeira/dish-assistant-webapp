"""Password hashing, JWT creation/validation, and auth cookie helpers.

See docs/auth-contract.md for how these are used by the /api/auth endpoints
and docs/password-security.md for the reasoning behind the choices here.
"""
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal

import bcrypt
import jwt
from fastapi import HTTPException, Response, status

from app.core.config import settings

TokenType = Literal["access", "refresh"]

ACCESS_COOKIE_NAME = "access_token"
REFRESH_COOKIE_NAME = "refresh_token"
# The access cookie is sent to every API route; the refresh cookie only to the auth routes
ACCESS_COOKIE_PATH = "/api"
REFRESH_COOKIE_PATH = "/api/auth"

BCRYPT_ROUNDS = 12
BCRYPT_MAX_BYTES = 72  # bcrypt ignores (bcrypt>=5: rejects) anything past 72 bytes
PASSWORD_MIN_LENGTH = 8


# PASSWORDS

def validate_password_rules(password: str) -> str:
    """Enforce the password policy. Returns the password or raises ValueError with a user-facing message.

    Mirrors the frontend's getPasswordStrength (dish-assistant-frontend/lib/validation.ts):
    8+ characters, plus at least one of: an uppercase letter, a number, a symbol.
    """
    if len(password) < PASSWORD_MIN_LENGTH:
        raise ValueError(f"Password must be at least {PASSWORD_MIN_LENGTH} characters long.")
    if len(password.encode("utf-8")) > BCRYPT_MAX_BYTES:
        raise ValueError(f"Password must be at most {BCRYPT_MAX_BYTES} bytes long.")
    if not (re.search(r"[A-Z]", password) or re.search(r"[0-9]", password) or re.search(r"[^A-Za-z0-9]", password)):
        raise ValueError("Password must include an uppercase letter, a number or a symbol.")
    return password


def hash_password(password: str) -> str:
    """Hash a password with bcrypt (random salt included). Result is a 60-character string."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=BCRYPT_ROUNDS)).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Check a password against a stored bcrypt hash. Never raises; returns False on any mismatch."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        # Over-long password or malformed hash
        return False


# Used when a login email doesn't exist, so the response takes as long as a wrong
# password would and attackers can't tell which emails are registered.
_DUMMY_HASH = hash_password("dummy-password-1")


def verify_password_dummy(password: str) -> bool:
    verify_password(password, _DUMMY_HASH)
    return False


# JWT

def _create_token(user_id: str, token_type: TokenType, expires_delta: timedelta, extra: dict | None = None) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
        "jti": uuid.uuid4().hex,
        **(extra or {}),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_access_token(user_id: str) -> str:
    return _create_token(user_id, "access", timedelta(minutes=settings.access_token_expire_minutes))


def create_refresh_token(user_id: str, remember_me: bool) -> str:
    days = settings.refresh_token_remember_days if remember_me else settings.refresh_token_expire_days
    return _create_token(user_id, "refresh", timedelta(days=days), {"remember": remember_me})


def decode_token(token: str, expected_type: TokenType) -> dict:
    """Validate signature, expiry and token type. Raises 401 on any problem."""
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
            options={"require": ["sub", "type", "exp", "iat"]},
        )
    except jwt.ExpiredSignatureError:
        raise unauthorized("Session expired. Please sign in again.")
    except jwt.InvalidTokenError:
        raise unauthorized("Invalid authentication token.")

    if payload.get("type") != expected_type:
        raise unauthorized("Invalid authentication token.")
    return payload


def unauthorized(message: str = "Not authenticated.") -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=message)


# COOKIES

def set_auth_cookies(response: Response, user_id: str, remember_me: bool) -> None:
    """Issue a fresh access + refresh token pair as httpOnly cookies.

    With remember_me the cookies persist across browser restarts; without it they
    are session cookies that the browser drops when it closes.
    """
    access_max_age = settings.access_token_expire_minutes * 60 if remember_me else None
    refresh_max_age = settings.refresh_token_remember_days * 24 * 60 * 60 if remember_me else None

    response.set_cookie(
        key=ACCESS_COOKIE_NAME,
        value=create_access_token(user_id),
        max_age=access_max_age,
        path=ACCESS_COOKIE_PATH,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
    )
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=create_refresh_token(user_id, remember_me),
        max_age=refresh_max_age,
        path=REFRESH_COOKIE_PATH,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
    )


def clear_auth_cookies(response: Response) -> None:
    # Attributes must match the ones used when setting, or the browser keeps the cookie
    response.delete_cookie(
        ACCESS_COOKIE_NAME, path=ACCESS_COOKIE_PATH, httponly=True,
        secure=settings.cookie_secure, samesite=settings.cookie_samesite,
    )
    response.delete_cookie(
        REFRESH_COOKIE_NAME, path=REFRESH_COOKIE_PATH, httponly=True,
        secure=settings.cookie_secure, samesite=settings.cookie_samesite,
    )
