import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator

MAX_IMAGE_DATA_URL_LENGTH = 7_000_000  # ~5MB de imagen tras decodificar base64


class ChatRequest(BaseModel):
    message: str
    image: str | None = None

    @field_validator("image")
    @classmethod
    def validate_image(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not v.startswith("data:image/"):
            raise ValueError("La imagen debe mandarse como data URL (data:image/...)")
        if len(v) > MAX_IMAGE_DATA_URL_LENGTH:
            raise ValueError("La imagen es demasiado grande (máximo ~5MB)")
        return v


class ChatMessageOut(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatResponse(BaseModel):
    reply: str
