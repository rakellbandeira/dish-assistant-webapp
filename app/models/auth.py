"""Request/response models for the /api/auth endpoints"""
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.security import BCRYPT_MAX_BYTES, validate_password_rules

USERNAME_PATTERN = r"^[a-zA-Z0-9_-]+$"


def _normalize_email(value):
    # Stored and compared in lowercase
    return value.strip().lower() if isinstance(value, str) else value


class RegisterRequest(BaseModel):
    email: EmailStr = Field(max_length=254)
    username: str = Field(min_length=3, max_length=30, pattern=USERNAME_PATTERN)
    password: str
    accepted_terms: bool

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value):
        return _normalize_email(value)

    @field_validator("username", mode="before")
    @classmethod
    def strip_username(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("password")
    @classmethod
    def check_password(cls, value: str) -> str:
        return validate_password_rules(value)

    @field_validator("accepted_terms")
    @classmethod
    def must_accept_terms(cls, value: bool) -> bool:
        if not value:
            raise ValueError("You must accept the terms to create an account.")
        return value


class LoginRequest(BaseModel):
    email: EmailStr = Field(max_length=254)
    
    password: str = Field(min_length=1, max_length=BCRYPT_MAX_BYTES * 4)
    remember_me: bool = False

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value):
        return _normalize_email(value)


class UserPublic(BaseModel):
    
    id: str
    email: str
    username: str

    @classmethod
    def from_mongo(cls, document: dict) -> "UserPublic":
        return cls(id=str(document["_id"]), email=document["email"], username=document["username"])


class AuthResponse(BaseModel):
    user: UserPublic


class MessageResponse(BaseModel):
    message: str
