import uuid

from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    icon: str | None = None
    color: str | None = None
    is_income: bool = False


class CategoryUpdate(BaseModel):
    name: str | None = None
    icon: str | None = None
    color: str | None = None
    is_income: bool | None = None


class CategoryOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    icon: str | None
    color: str | None
    is_income: bool
    is_default: bool

    model_config = {"from_attributes": True}
