import re
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, field_validator

HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


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
        if not HEX_COLOR_RE.match(v):
            raise ValueError("accent_color debe ser un color hex válido, ej. #16a34a")
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
