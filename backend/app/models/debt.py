import uuid
from datetime import datetime, timezone

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Debt(Base):
    __tablename__ = "debts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    creditor: Mapped[str] = mapped_column(String(255), nullable=False)
    subtype: Mapped[str] = mapped_column(
        Enum("credit_card", "loan", "other", name="debt_subtype"), nullable=False, default="other"
    )
    total_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    remaining_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    monthly_payment: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    interest_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    due_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    credit_limit: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    cutoff_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    payment_due_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(
        Enum("active", "paid", "negotiating", name="debt_status"), default="active"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship(back_populates="debts")
