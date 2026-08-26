import uuid
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import Transaction
from app.models.account import Account
from app.schemas.transaction import TransactionCreate, TransactionOut, TransactionUpdate


async def _get_account_for_user(account_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> Account:
    result = await db.execute(
        select(Account).where(Account.id == account_id, Account.user_id == user_id)
    )
    acc = result.scalar_one_or_none()
    if not acc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuenta no encontrada")
    return acc


async def get_all(
    user_id: uuid.UUID,
    db: AsyncSession,
    date_from: date | None = None,
    date_to: date | None = None,
    category_id: uuid.UUID | None = None,
    type: str | None = None,
    account_id: uuid.UUID | None = None,
    search: str | None = None,
    limit: int | None = None,
    offset: int = 0,
) -> list[TransactionOut]:
    filters = [Account.user_id == user_id]
    if date_from:
        filters.append(Transaction.date >= date_from)
    if date_to:
        filters.append(Transaction.date <= date_to)
    if category_id:
        filters.append(Transaction.category_id == category_id)
    if type:
        filters.append(Transaction.type == type)
    if account_id:
        filters.append(Transaction.account_id == account_id)
    if search:
        filters.append(Transaction.description.ilike(f"%{search}%"))

    stmt = (
        select(Transaction)
        .join(Account, Transaction.account_id == Account.id)
        .where(and_(*filters))
        .order_by(Transaction.date.desc(), Transaction.created_at.desc())
        .offset(offset)
    )
    if limit is not None:
        stmt = stmt.limit(limit)
    result = await db.execute(stmt)
    return [TransactionOut.model_validate(t) for t in result.scalars().all()]


async def get_one(tx_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> TransactionOut:
    stmt = (
        select(Transaction)
        .join(Account, Transaction.account_id == Account.id)
        .where(Transaction.id == tx_id, Account.user_id == user_id)
    )
    result = await db.execute(stmt)
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transacción no encontrada")
    return TransactionOut.model_validate(tx)


async def create(data: TransactionCreate, user_id: uuid.UUID, db: AsyncSession) -> TransactionOut:
    await _get_account_for_user(data.account_id, user_id, db)
    tx = Transaction(**data.model_dump())
    db.add(tx)
    await db.commit()
    await db.refresh(tx)
    return TransactionOut.model_validate(tx)


async def update(tx_id: uuid.UUID, data: TransactionUpdate, user_id: uuid.UUID, db: AsyncSession) -> TransactionOut:
    stmt = (
        select(Transaction)
        .join(Account, Transaction.account_id == Account.id)
        .where(Transaction.id == tx_id, Account.user_id == user_id)
    )
    result = await db.execute(stmt)
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transacción no encontrada")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(tx, field, value)
    await db.commit()
    await db.refresh(tx)
    return TransactionOut.model_validate(tx)


async def delete(tx_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> None:
    stmt = (
        select(Transaction)
        .join(Account, Transaction.account_id == Account.id)
        .where(Transaction.id == tx_id, Account.user_id == user_id)
    )
    result = await db.execute(stmt)
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transacción no encontrada")
    await db.delete(tx)
    await db.commit()
