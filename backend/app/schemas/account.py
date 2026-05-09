import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

AccountType = Literal["cash", "debit", "credit", "savings"]


class AccountCreate(BaseModel):
    name: str
    type: AccountType
    balance: float = 0
    currency: str = "MXN"


class AccountUpdate(BaseModel):
    name: str | None = None
    type: AccountType | None = None
    balance: float | None = None
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
