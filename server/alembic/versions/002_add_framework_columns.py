"""Add framework columns to analyses and convert evidence to JSONB

Revision ID: 002
Revises: 001
Create Date: 2026-03-05
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '002'
down_revision = None  # Set to previous revision ID if one exists
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Use inspector to check if columns exist before creating them
    # to avoid Postgres transaction aborts on DuplicateColumn errors.
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    analyses_columns = [col['name'] for col in inspector.get_columns('analyses')]
    principle_scores_columns = [col['name'] for col in inspector.get_columns('principle_scores')]

    if 'framework_id' not in analyses_columns:
        op.add_column('analyses',
            sa.Column('framework_id', sa.String(), nullable=False, server_default='rosenshine')
        )
    
    if 'framework_name' not in analyses_columns:
        op.add_column('analyses',
            sa.Column('framework_name', sa.String(), nullable=True)
        )

    if 'evidence_json' not in principle_scores_columns:
        op.add_column('principle_scores',
            sa.Column('evidence_json', postgresql.JSONB(), nullable=True)
        )

    # Migrate existing data: convert array of strings to JSONB array of simple dicts
    op.execute("""
        UPDATE principle_scores
        SET evidence_json = (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'text', elem,
                    'timestamp', COALESCE(timestamp_start, 0.0),
                    'speaker', 'A',
                    'note', 'Legacy evidence item'
                )
            )
            FROM jsonb_array_elements_text(evidence) AS elem
        )
        WHERE evidence IS NOT NULL AND jsonb_typeof(evidence) = 'array' AND jsonb_array_length(evidence) > 0
    """)

    # Drop old array column and rename new one
    if 'evidence' in principle_scores_columns and 'evidence_json' in principle_scores_columns:
        # We only drop the old 'evidence' if we still have it AND we successfully created evidence_json
        op.drop_column('principle_scores', 'evidence')
        op.alter_column('principle_scores', 'evidence_json', new_column_name='evidence')


def downgrade() -> None:
    # Reverse: convert JSONB back to ARRAY(Text)
    op.add_column('principle_scores',
        sa.Column('evidence_old', postgresql.ARRAY(sa.Text()), nullable=True)
    )
    op.execute("""
        UPDATE principle_scores
        SET evidence_old = ARRAY(
            SELECT elem->>'text'
            FROM jsonb_array_elements(evidence) AS elem
        )
        WHERE evidence IS NOT NULL
    """)
    op.drop_column('principle_scores', 'evidence')
    op.alter_column('principle_scores', 'evidence_old', new_column_name='evidence')

    op.drop_column('analyses', 'framework_name')
    op.drop_column('analyses', 'framework_id')
