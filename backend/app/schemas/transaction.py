import uuid
from datetime import date as Date
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

TransactionType = Literal["income", "expense", "transfer"]

# La columna amount es NUMERIC(15,2): máximo 13 dígitos enteros.
MAX_MONEY_AMOUNT = 10**13


class TransactionCreate(BaseModel):
    account_id: uuid.UUID
    category_id: uuid.UUID | None = None
    amount: float = Field(gt=0, lt=MAX_MONEY_AMOUNT)
    type: TransactionType
    description: str | None = None
    date: Date


class TransactionUpdate(BaseModel):
    category_id: uuid.UUID | None = None
    amount: float | None = Field(default=None, gt=0, lt=MAX_MONEY_AMOUNT)
    type: TransactionType | None = None
    description: str | None = None
    date: Date | None = None  # type: ignore[assignment]


class TransactionOut(BaseModel):
    id: uuid.UUID
    account_id: uuid.UUID
    category_id: uuid.UUID | None
    amount: float
    type: str
    description: str | None
    date: Date
    created_at: datetime

    model_config = {"from_attributes": True}
