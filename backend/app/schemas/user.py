import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, field_validator


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    currency: str = "MXN"

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    currency: str
    theme: str
    accent_color: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserPreferencesUpdate(BaseModel):
    theme: Literal["light", "dark"] | None = None
    accent_color: str | None = None

    @field_validator("accent_color")
    @classmethod
    def validate_accent(cls, v: str | None) -> str | None:
        if v is None:
            return v
        allowed = {
            "#16a34a", "#2563eb", "#dc2626", "#9333ea",
            "#ea580c", "#0891b2", "#ca8a04", "#db2777",
        }
        if v not in allowed:
            raise ValueError("accent_color must be one of the allowed values")
        return v


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()
