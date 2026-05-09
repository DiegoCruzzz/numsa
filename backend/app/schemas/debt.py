import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel

DebtStatus = Literal["active", "paid", "negotiating"]


class DebtCreate(BaseModel):
    creditor: str
    total_amount: float
    remaining_amount: float
    monthly_payment: float
    interest_rate: float = 0
    due_date: date | None = None
    status: DebtStatus = "active"


class DebtUpdate(BaseModel):
    creditor: str | None = None
    remaining_amount: float | None = None
    monthly_payment: float | None = None
    interest_rate: float | None = None
    due_date: date | None = None
    status: DebtStatus | None = None


class DebtOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    creditor: str
    total_amount: float
    remaining_amount: float
    monthly_payment: float
    interest_rate: float
    due_date: date | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class DebtSummary(BaseModel):
    total_debt: float
    total_paid: float
    global_progress_pct: float
    active_debts: int
