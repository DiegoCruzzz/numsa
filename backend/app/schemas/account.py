import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

AccountType = Literal["cash", "debit", "credit", "savings"]

# La columna balance es NUMERIC(15,2): máximo 13 dígitos enteros.
MAX_MONEY_AMOUNT = 10**13


class AccountCreate(BaseModel):
    name: str
    type: AccountType
    balance: float = Field(default=0, ge=0, lt=MAX_MONEY_AMOUNT)
    currency: str = "MXN"


class AccountUpdate(BaseModel):
    name: str | None = None
    type: AccountType | None = None
    balance: float | None = Field(default=None, ge=0, lt=MAX_MONEY_AMOUNT)
    currency: str | None = None
    is_active: bool | None = None


class AccountOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    type: str
    balance: float
    currency: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
