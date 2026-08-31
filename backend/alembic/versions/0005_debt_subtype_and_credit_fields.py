"""add subtype and credit-card fields to debts

Revision ID: 0005
Revises: 0004
Create Date: 2026-08-31

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    debt_subtype = sa.Enum("credit_card", "loan", "other", name="debt_subtype")
    debt_subtype.create(op.get_bind())
    op.add_column(
        "debts",
        sa.Column("subtype", debt_subtype, nullable=False, server_default="other"),
    )
    op.add_column("debts", sa.Column("credit_limit", sa.Numeric(15, 2), nullable=True))
    op.add_column("debts", sa.Column("cutoff_day", sa.Integer(), nullable=True))
    op.add_column("debts", sa.Column("payment_due_day", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("debts", "payment_due_day")
    op.drop_column("debts", "cutoff_day")
    op.drop_column("debts", "credit_limit")
    op.drop_column("debts", "subtype")
    op.execute("DROP TYPE IF EXISTS debt_subtype")
