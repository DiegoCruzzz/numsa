"""backfill 'Otro' expense category for existing users

Revision ID: 0004
Revises: 0003
Create Date: 2026-08-26

"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.user import User

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    session = Session(bind=op.get_bind())
    user_ids = [row[0] for row in session.query(User.id).all()]
    for user_id in user_ids:
        exists = (
            session.query(Category.id)
            .filter_by(user_id=user_id, name="Otro", is_income=False)
            .first()
        )
        if not exists:
            session.add(
                Category(user_id=user_id, name="Otro", icon="🔖", color="#95A5A6", is_income=False, is_default=True)
            )
    session.commit()


def downgrade() -> None:
    session = Session(bind=op.get_bind())
    session.query(Category).filter_by(name="Otro", is_income=False, is_default=True).delete()
    session.commit()
