import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

DebtStatus = Literal["active", "paid", "negotiating"]

# La columna interest_rate es NUMERIC(5,2) en la base de datos: máximo 999.99.
# Sin este límite, un valor mayor revienta con un error crudo de Postgres.
MAX_INTEREST_RATE = 999.99


class DebtCreate(BaseModel):
    creditor: str
    total_amount: float = Field(ge=0)
    remaining_amount: float = Field(ge=0)
    monthly_payment: float = Field(ge=0)
    interest_rate: float = Field(default=0, ge=0, le=MAX_INTEREST_RATE)
    due_date: date | None = None
    status: DebtStatus = "active"


class DebtUpdate(BaseModel):
    creditor: str | None = None
    remaining_amount: float | None = Field(default=None, ge=0)
    monthly_payment: float | None = Field(default=None, ge=0)
    interest_rate: float | None = Field(default=None, ge=0, le=MAX_INTEREST_RATE)
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
