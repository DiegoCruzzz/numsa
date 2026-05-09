import uuid
from datetime import date as Date
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

TransactionType = Literal["income", "expense", "transfer"]


class TransactionCreate(BaseModel):
    account_id: uuid.UUID
    category_id: uuid.UUID | None = None
    amount: float
    type: TransactionType
    description: str | None = None
    date: Date


class TransactionUpdate(BaseModel):
    category_id: uuid.UUID | None = None
    amount: float | None = None
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
