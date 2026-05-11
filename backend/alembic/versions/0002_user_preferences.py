"""add theme and accent_color to users

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-11

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("theme", sa.String(10), nullable=False, server_default="light"))
    op.add_column("users", sa.Column("accent_color", sa.String(20), nullable=False, server_default="#16a34a"))


def downgrade() -> None:
    op.drop_column("users", "accent_color")
    op.drop_column("users", "theme")
