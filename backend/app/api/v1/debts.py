import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.debt import DebtCreate, DebtOut, DebtSummary, DebtUpdate
from app.services import debt as debt_service

router = APIRouter(prefix="/debts", tags=["debts"])


@router.get("", response_model=list[DebtOut])
async def list_debts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await debt_service.get_all(current_user.id, db)


@router.get("/summary", response_model=DebtSummary)
async def debt_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await debt_service.get_summary(current_user.id, db)


@router.post("", response_model=DebtOut, status_code=201)
async def create_debt(
    data: DebtCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await debt_service.create(data, current_user.id, db)


@router.get("/{debt_id}", response_model=DebtOut)
async def get_debt(
    debt_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await debt_service.get_one(debt_id, current_user.id, db)


@router.patch("/{debt_id}", response_model=DebtOut)
async def update_debt(
    debt_id: uuid.UUID,
    data: DebtUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await debt_service.update(debt_id, data, current_user.id, db)


@router.delete("/{debt_id}", status_code=204)
async def delete_debt(
    debt_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await debt_service.delete(debt_id, current_user.id, db)
