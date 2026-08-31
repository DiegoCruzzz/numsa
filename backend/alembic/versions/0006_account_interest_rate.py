"""add interest_rate to accounts

Revision ID: 0006
Revises: 0005
Create Date: 2026-08-31

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("accounts", sa.Column("interest_rate", sa.Numeric(5, 2), nullable=True))


def downgrade() -> None:
    op.drop_column("accounts", "interest_rate")
