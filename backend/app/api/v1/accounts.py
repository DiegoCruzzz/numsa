import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.account import AccountCreate, AccountOut, AccountUpdate, ApplyInterestResponse
from app.services import account as account_service

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("", response_model=list[AccountOut])
async def list_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await account_service.get_all(current_user.id, db)


@router.post("", response_model=AccountOut, status_code=201)
async def create_account(
    data: AccountCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await account_service.create(data, current_user.id, db)


@router.get("/{account_id}", response_model=AccountOut)
async def get_account(
    account_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await account_service.get_one(account_id, current_user.id, db)


@router.patch("/{account_id}", response_model=AccountOut)
async def update_account(
    account_id: uuid.UUID,
    data: AccountUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await account_service.update(account_id, data, current_user.id, db)


@router.delete("/{account_id}", status_code=204)
async def delete_account(
    account_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await account_service.delete(account_id, current_user.id, db)


@router.post("/{account_id}/apply-interest", response_model=ApplyInterestResponse)
async def apply_interest(
    account_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await account_service.apply_interest(account_id, current_user.id, db)
