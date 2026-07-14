"""add chat summary and message compaction
Revision ID: 0002_add_chat_compaction
Revises: 0001_initial_schema
Create Date: 2026-07-14
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002_add_chat_compaction"
down_revision: str | None = "0001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "conversations",
        sa.Column("chat_summary", sa.Text(), nullable=False, server_default=""),
    )
    op.alter_column("conversations", "chat_summary", server_default=None)
    op.add_column("messages", sa.Column("compacted_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("messages", "compacted_at")
    op.drop_column("conversations", "chat_summary")
