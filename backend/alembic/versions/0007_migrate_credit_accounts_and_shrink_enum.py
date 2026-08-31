"""migrate credit-type accounts into debts and shrink account_type enum

Revision ID: 0007
Revises: 0006
Create Date: 2026-08-31

"""
import uuid
from typing import Sequence, Union

from alembic import op
from sqlalchemy import text

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    # Raw SQL throughout this data-shuffling step (rather than importing app.models or using
    # typed Core tables) sidesteps both problems that hit here: the live ORM Account/Debt models
    # evolve with the code and stop accepting 'credit' as a valid enum value, and Postgres
    # refuses to compare a native enum column against an untyped varchar bind parameter.
    credit_accounts = bind.execute(
        text("SELECT id, user_id, name, balance FROM accounts WHERE type::text = 'credit'")
    ).fetchall()

    for acc in credit_accounts:
        balance = acc.balance if acc.balance and acc.balance > 0 else 0
        bind.execute(
            text(
                """
                INSERT INTO debts
                    (id, user_id, creditor, subtype, total_amount, remaining_amount,
                     monthly_payment, interest_rate, status, created_at)
                VALUES
                    (:id, :user_id, :creditor, 'credit_card', :balance, :balance,
                     0, 0, 'active', now())
                """
            ),
            {"id": uuid.uuid4(), "user_id": acc.user_id, "creditor": acc.name, "balance": balance},
        )

    # DB-level ON DELETE CASCADE on transactions.account_id removes any transactions
    # posted against these accounts (accepted data loss, confirmed with user beforehand).
    bind.execute(text("DELETE FROM accounts WHERE type::text = 'credit'"))

    op.execute("ALTER TYPE account_type RENAME TO account_type_old")
    op.execute("CREATE TYPE account_type AS ENUM ('cash', 'debit', 'savings')")
    op.execute(
        "ALTER TABLE accounts ALTER COLUMN type TYPE account_type USING type::text::account_type"
    )
    op.execute("DROP TYPE account_type_old")


def downgrade() -> None:
    # Restores the enum shape only. Does NOT resurrect deleted credit accounts/transactions,
    # nor remove the Debt rows created in upgrade() — asymmetric downgrade, same style as 0004.
    op.execute("ALTER TYPE account_type RENAME TO account_type_new")
    op.execute("CREATE TYPE account_type AS ENUM ('cash', 'debit', 'credit', 'savings')")
    op.execute(
        "ALTER TABLE accounts ALTER COLUMN type TYPE account_type USING type::text::account_type"
    )
    op.execute("DROP TYPE account_type_new")
