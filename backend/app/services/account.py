import uuid
from datetime import date as Date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.transaction import Transaction
from app.schemas.account import AccountCreate, AccountOut, AccountUpdate, ApplyInterestResponse
from app.schemas.transaction import TransactionOut


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


async def apply_interest(account_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> ApplyInterestResponse:
    result = await db.execute(
        select(Account).where(Account.id == account_id, Account.user_id == user_id)
    )
    acc = result.scalar_one_or_none()
    if not acc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuenta no encontrada")
    if acc.type != "savings":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo las cuentas de ahorro pueden generar intereses",
        )
    if not acc.interest_rate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta cuenta no tiene una tasa de interés configurada",
        )

    interest_amount = round(float(acc.balance) * float(acc.interest_rate) / 100 / 12, 2)
    if interest_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El saldo actual no genera un interés positivo",
        )

    # Excepción intencional al desacoplo balance/transacciones del resto de la app: esta es
    # la única acción que muta Account.balance directamente y crea una Transaction en la misma
    # llamada, porque es la única forma de que el interés se vea reflejado tanto en el balance
    # como en el historial. No usar este patrón como referencia para otros flujos.
    acc.balance = float(acc.balance) + interest_amount
    tx = Transaction(
        account_id=acc.id,
        category_id=None,
        amount=interest_amount,
        type="income",
        description="Interés generado (aplicado manualmente)",
        date=Date.today(),
    )
    db.add(tx)
    await db.commit()
    await db.refresh(acc)
    await db.refresh(tx)
    return ApplyInterestResponse(
        account=AccountOut.model_validate(acc),
        transaction=TransactionOut.model_validate(tx),
        interest_amount=interest_amount,
    )
