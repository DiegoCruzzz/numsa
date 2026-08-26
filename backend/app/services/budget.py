import uuid
from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.account import Account
from app.models.budget import Budget
from app.models.transaction import Transaction
from app.schemas.budget import BudgetCreate, BudgetOut, BudgetStatus, BudgetUpdate


async def get_all(user_id: uuid.UUID, db: AsyncSession) -> list[BudgetOut]:
    result = await db.execute(select(Budget).where(Budget.user_id == user_id))
    return [BudgetOut.model_validate(b) for b in result.scalars().all()]


def _current_period_start(period: str, start_date: date) -> date:
    today = date.today()
    period_start = today - timedelta(days=today.weekday()) if period == "weekly" else today.replace(day=1)
    return max(period_start, start_date)


async def get_status(user_id: uuid.UUID, db: AsyncSession) -> list[BudgetStatus]:
    result = await db.execute(
        select(Budget).where(Budget.user_id == user_id).options(selectinload(Budget.category))
    )
    budgets = result.scalars().all()
    statuses = []
    for b in budgets:
        period_start = _current_period_start(b.period, b.start_date)
        spent_result = await db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .join(Account, Transaction.account_id == Account.id)
            .where(
                Account.user_id == user_id,
                Transaction.category_id == b.category_id,
                Transaction.type == "expense",
                Transaction.date >= period_start,
            )
        )
        spent = float(spent_result.scalar_one())
        limit = float(b.limit_amount)
        statuses.append(
            BudgetStatus(
                id=b.id,
                category_id=b.category_id,
                category_name=b.category.name,
                limit_amount=limit,
                spent_amount=spent,
                remaining=max(limit - spent, 0),
                used_pct=round((spent / limit * 100) if limit else 0, 2),
            )
        )
    return statuses


async def get_one(budget_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> BudgetOut:
    result = await db.execute(select(Budget).where(Budget.id == budget_id, Budget.user_id == user_id))
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presupuesto no encontrado")
    return BudgetOut.model_validate(budget)


async def create(data: BudgetCreate, user_id: uuid.UUID, db: AsyncSession) -> BudgetOut:
    budget = Budget(user_id=user_id, **data.model_dump())
    db.add(budget)
    await db.commit()
    await db.refresh(budget)
    return BudgetOut.model_validate(budget)


async def update(budget_id: uuid.UUID, data: BudgetUpdate, user_id: uuid.UUID, db: AsyncSession) -> BudgetOut:
    result = await db.execute(select(Budget).where(Budget.id == budget_id, Budget.user_id == user_id))
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presupuesto no encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(budget, field, value)
    await db.commit()
    await db.refresh(budget)
    return BudgetOut.model_validate(budget)


async def delete(budget_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> None:
    result = await db.execute(select(Budget).where(Budget.id == budget_id, Budget.user_id == user_id))
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presupuesto no encontrado")
    await db.delete(budget)
    await db.commit()
