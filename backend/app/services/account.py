import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.schemas.account import AccountCreate, AccountOut, AccountUpdate


async def get_all(user_id: uuid.UUID, db: AsyncSession) -> list[AccountOut]:
    result = await db.execute(select(Account).where(Account.user_id == user_id))
    return [AccountOut.model_validate(a) for a in result.scalars().all()]


async def get_one(account_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> AccountOut:
    result = await db.execute(
        select(Account).where(Account.id == account_id, Account.user_id == user_id)
    )
    acc = result.scalar_one_or_none()
    if not acc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuenta no encontrada")
    return AccountOut.model_validate(acc)


async def create(data: AccountCreate, user_id: uuid.UUID, db: AsyncSession) -> AccountOut:
    acc = Account(user_id=user_id, **data.model_dump())
    db.add(acc)
    await db.commit()
    await db.refresh(acc)
    return AccountOut.model_validate(acc)


async def update(account_id: uuid.UUID, data: AccountUpdate, user_id: uuid.UUID, db: AsyncSession) -> AccountOut:
    result = await db.execute(
        select(Account).where(Account.id == account_id, Account.user_id == user_id)
    )
    acc = result.scalar_one_or_none()
    if not acc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuenta no encontrada")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(acc, field, value)
    await db.commit()
    await db.refresh(acc)
    return AccountOut.model_validate(acc)


async def delete(account_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> None:
    result = await db.execute(
        select(Account).where(Account.id == account_id, Account.user_id == user_id)
    )
    acc = result.scalar_one_or_none()
    if not acc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuenta no encontrada")
    await db.delete(acc)
    await db.commit()
