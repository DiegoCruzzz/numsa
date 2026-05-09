import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryOut, CategoryUpdate

DEFAULT_EXPENSE_CATEGORIES = [
    {"name": "Alimentación", "icon": "🍔", "color": "#FF6B6B"},
    {"name": "Transporte", "icon": "🚗", "color": "#4ECDC4"},
    {"name": "Vivienda", "icon": "🏠", "color": "#45B7D1"},
    {"name": "Salud", "icon": "💊", "color": "#96CEB4"},
    {"name": "Entretenimiento", "icon": "🎬", "color": "#FFEAA7"},
    {"name": "Ropa", "icon": "👕", "color": "#DDA0DD"},
    {"name": "Educación", "icon": "📚", "color": "#98D8C8"},
    {"name": "Servicios", "icon": "💡", "color": "#F0E68C"},
]

DEFAULT_INCOME_CATEGORIES = [
    {"name": "Salario", "icon": "💼", "color": "#2ECC71"},
    {"name": "Freelance", "icon": "💻", "color": "#27AE60"},
    {"name": "Inversiones", "icon": "📈", "color": "#16A085"},
    {"name": "Apoyo familiar", "icon": "👨‍👩‍👧", "color": "#1ABC9C"},
    {"name": "Otros", "icon": "💰", "color": "#3498DB"},
]


async def seed_default_categories(user_id: uuid.UUID, db: AsyncSession) -> None:
    for cat in DEFAULT_EXPENSE_CATEGORIES:
        db.add(Category(user_id=user_id, is_income=False, is_default=True, **cat))
    for cat in DEFAULT_INCOME_CATEGORIES:
        db.add(Category(user_id=user_id, is_income=True, is_default=True, **cat))


async def get_all(user_id: uuid.UUID, db: AsyncSession) -> list[CategoryOut]:
    result = await db.execute(select(Category).where(Category.user_id == user_id))
    return [CategoryOut.model_validate(c) for c in result.scalars().all()]


async def get_one(category_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> CategoryOut:
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.user_id == user_id)
    )
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return CategoryOut.model_validate(cat)


async def create(data: CategoryCreate, user_id: uuid.UUID, db: AsyncSession) -> CategoryOut:
    cat = Category(user_id=user_id, **data.model_dump())
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return CategoryOut.model_validate(cat)


async def update(category_id: uuid.UUID, data: CategoryUpdate, user_id: uuid.UUID, db: AsyncSession) -> CategoryOut:
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.user_id == user_id)
    )
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(cat, field, value)
    await db.commit()
    await db.refresh(cat)
    return CategoryOut.model_validate(cat)


async def delete(category_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> None:
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.user_id == user_id)
    )
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    await db.delete(cat)
    await db.commit()
