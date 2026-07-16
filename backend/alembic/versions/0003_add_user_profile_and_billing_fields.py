"""add user profile and billing fields

Revision ID: 0003_add_user_profile_billing
Revises: 0002_add_chat_compaction
Create Date: 2026-07-16
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003_add_user_profile_billing"
down_revision: str | None = "0002_add_chat_compaction"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("username", sa.String(length=32), nullable=True))
    op.add_column("users", sa.Column("display_name", sa.String(length=80), nullable=True))
    op.add_column("users", sa.Column("profile_image_url", sa.String(length=2048), nullable=True))
    op.add_column("users", sa.Column("profile_image_object_key", sa.String(length=512), nullable=True))
    op.add_column("users", sa.Column("profile_image_content_type", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("profile_image_updated_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("plan", sa.String(length=32), server_default="free", nullable=False))
    op.add_column("users", sa.Column("subscription_status", sa.String(length=32), server_default="inactive", nullable=False))
    op.add_column("users", sa.Column("stripe_customer_id", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("stripe_subscription_id", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("subscription_current_period_end", sa.DateTime(timezone=True), nullable=True))

    op.execute(
        """
        WITH numbered_users AS (
            SELECT
                id,
                lower(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9_]', '_', 'g')) AS base_username,
                row_number() OVER (
                    PARTITION BY lower(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9_]', '_', 'g'))
                    ORDER BY created_at, id
                ) AS duplicate_index
            FROM users
        ), generated_usernames AS (
            SELECT
                id,
                CASE
                    WHEN base_username = '' THEN
                        CASE
                            WHEN duplicate_index = 1 THEN 'user'
                            ELSE 'user_' || duplicate_index::text
                        END
                    WHEN duplicate_index = 1 THEN left(base_username, 32)
                    ELSE left(base_username, greatest(1, 31 - length(duplicate_index::text))) || '_' || duplicate_index::text
                END AS generated_username
            FROM numbered_users
        )
        UPDATE users
        SET username = generated_usernames.generated_username
        FROM generated_usernames
        WHERE users.id = generated_usernames.id
        """
    )

    op.alter_column("users", "username", existing_type=sa.String(length=32), nullable=False)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)
    op.create_index(op.f("ix_users_stripe_customer_id"), "users", ["stripe_customer_id"], unique=True)
    op.create_index(op.f("ix_users_stripe_subscription_id"), "users", ["stripe_subscription_id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_stripe_subscription_id"), table_name="users")
    op.drop_index(op.f("ix_users_stripe_customer_id"), table_name="users")
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_column("users", "subscription_current_period_end")
    op.drop_column("users", "stripe_subscription_id")
    op.drop_column("users", "stripe_customer_id")
    op.drop_column("users", "subscription_status")
    op.drop_column("users", "plan")
    op.drop_column("users", "profile_image_updated_at")
    op.drop_column("users", "profile_image_content_type")
    op.drop_column("users", "profile_image_object_key")
    op.drop_column("users", "profile_image_url")
    op.drop_column("users", "display_name")
    op.drop_column("users", "username")
