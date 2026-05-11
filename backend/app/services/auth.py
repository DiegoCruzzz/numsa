from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.user import LoginRequest, Token, UserCreate, UserOut, UserPreferencesUpdate
from app.services.category import seed_default_categories


async def register(data: UserCreate, db: AsyncSession) -> UserOut:
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        email=data.email,
        name=data.name,
        hashed_password=hash_password(data.password),
        currency=data.currency,
    )
    db.add(user)
    await db.flush()

    await seed_default_categories(user.id, db)
    await db.commit()
    await db.refresh(user)
    return UserOut.model_validate(user)


async def login(data: LoginRequest, db: AsyncSession) -> Token:
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")

    token = create_access_token(str(user.id))
    return Token(access_token=token)


async def update_preferences(data: UserPreferencesUpdate, user: User, db: AsyncSession) -> UserOut:
    if data.theme is not None:
        user.theme = data.theme
    if data.accent_color is not None:
        user.accent_color = data.accent_color
    await db.commit()
    await db.refresh(user)
    return UserOut.model_validate(user)
