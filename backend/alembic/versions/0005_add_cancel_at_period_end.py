"""add cancellation scheduling state

Revision ID: 0005_add_cancel_at_period_end
Revises: 0004_add_usage_events
Create Date: 2026-07-22
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005_add_cancel_at_period_end"
down_revision: str | None = "0004_add_usage_events"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("cancel_at_period_end", sa.Boolean(), server_default=sa.false(), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("users", "cancel_at_period_end")
