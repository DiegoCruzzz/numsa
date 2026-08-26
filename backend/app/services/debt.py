import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.debt import Debt
from app.schemas.debt import DebtCreate, DebtOut, DebtSummary, DebtUpdate


async def get_all(user_id: uuid.UUID, db: AsyncSession) -> list[DebtOut]:
    result = await db.execute(select(Debt).where(Debt.user_id == user_id))
    return [DebtOut.model_validate(d) for d in result.scalars().all()]


async def get_summary(user_id: uuid.UUID, db: AsyncSession) -> DebtSummary:
    result = await db.execute(select(Debt).where(Debt.user_id == user_id))
    debts = result.scalars().all()

    total_original = sum(float(d.total_amount) for d in debts)
    total_remaining = sum(float(d.remaining_amount) for d in debts)
    total_paid = total_original - total_remaining
    active_count = sum(1 for d in debts if d.status == "active")
    progress = (total_paid / total_original * 100) if total_original else 0

    return DebtSummary(
        total_debt=total_remaining,
        total_paid=total_paid,
        global_progress_pct=round(progress, 2),
        active_debts=active_count,
    )


async def get_one(debt_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> DebtOut:
    result = await db.execute(select(Debt).where(Debt.id == debt_id, Debt.user_id == user_id))
    debt = result.scalar_one_or_none()
    if not debt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deuda no encontrada")
    return DebtOut.model_validate(debt)


async def create(data: DebtCreate, user_id: uuid.UUID, db: AsyncSession) -> DebtOut:
    debt = Debt(user_id=user_id, **data.model_dump())
    db.add(debt)
    await db.commit()
    await db.refresh(debt)
    return DebtOut.model_validate(debt)


async def update(debt_id: uuid.UUID, data: DebtUpdate, user_id: uuid.UUID, db: AsyncSession) -> DebtOut:
    result = await db.execute(select(Debt).where(Debt.id == debt_id, Debt.user_id == user_id))
    debt = result.scalar_one_or_none()
    if not debt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deuda no encontrada")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(debt, field, value)
    await db.commit()
    await db.refresh(debt)
    return DebtOut.model_validate(debt)


async def delete(debt_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> None:
    result = await db.execute(select(Debt).where(Debt.id == debt_id, Debt.user_id == user_id))
    debt = result.scalar_one_or_none()
    if not debt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deuda no encontrada")
    await db.delete(debt)
    await db.commit()
