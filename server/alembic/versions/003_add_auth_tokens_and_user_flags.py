"""Add email_verified, onboarding_completed to users; add password_reset_tokens and email_verification_tokens tables

Revision ID: 003
Revises: 002
Create Date: 2026-04-14
"""
from alembic import op
import sqlalchemy as sa

revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # ── Users: new flag columns ──────────────────────────────────────────────
    users_columns = [col['name'] for col in inspector.get_columns('users')]

    if 'email_verified' not in users_columns:
        op.add_column('users',
            sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='false')
        )

    if 'onboarding_completed' not in users_columns:
        op.add_column('users',
            sa.Column('onboarding_completed', sa.Boolean(), nullable=False, server_default='false')
        )

    # Mark existing users as already verified (they signed up before this feature)
    op.execute("UPDATE users SET email_verified = true WHERE email_verified = false")

    # ── password_reset_tokens ────────────────────────────────────────────────
    existing_tables = inspector.get_table_names()

    if 'password_reset_tokens' not in existing_tables:
        op.create_table(
            'password_reset_tokens',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('token_hash', sa.String(length=64), nullable=False),
            sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('used', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('token_hash'),
        )

    # ── email_verification_tokens ────────────────────────────────────────────
    if 'email_verification_tokens' not in existing_tables:
        op.create_table(
            'email_verification_tokens',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('token_hash', sa.String(length=64), nullable=False),
            sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('used', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('token_hash'),
        )


def downgrade() -> None:
    op.drop_table('email_verification_tokens')
    op.drop_table('password_reset_tokens')
    op.drop_column('users', 'onboarding_completed')
    op.drop_column('users', 'email_verified')
