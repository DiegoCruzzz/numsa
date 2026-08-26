import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

BudgetPeriod = Literal["monthly", "weekly"]

# La columna limit_amount es NUMERIC(15,2): máximo 13 dígitos enteros.
MAX_MONEY_AMOUNT = 10**13


class BudgetCreate(BaseModel):
    category_id: uuid.UUID
    limit_amount: float = Field(gt=0, lt=MAX_MONEY_AMOUNT)
    period: BudgetPeriod = "monthly"
    start_date: date


class BudgetUpdate(BaseModel):
    limit_amount: float | None = Field(default=None, gt=0, lt=MAX_MONEY_AMOUNT)
    period: BudgetPeriod | None = None
    start_date: date | None = None


class BudgetOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    category_id: uuid.UUID
    limit_amount: float
    spent_amount: float
    period: str
    start_date: date
    created_at: datetime

    model_config = {"from_attributes": True}


class BudgetStatus(BaseModel):
    id: uuid.UUID
    category_id: uuid.UUID
    category_name: str
    limit_amount: float
    spent_amount: float
    remaining: float
    used_pct: float
