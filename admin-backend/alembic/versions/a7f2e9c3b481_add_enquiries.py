"""add enquiries table

Revision ID: a7f2e9c3b481
Revises: cd67dc58b150
Create Date: 2026-03-28 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a7f2e9c3b481'
down_revision: Union[str, None] = 'cd67dc58b150'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('enquiries',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('course', sa.String(length=100), nullable=False),
        sa.Column('mode', sa.String(length=50), nullable=False),
        sa.Column('timing', sa.String(length=50), nullable=True),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='new'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_enquiries_status'), 'enquiries', ['status'])


def downgrade() -> None:
    op.drop_index(op.f('ix_enquiries_status'), table_name='enquiries')
    op.drop_table('enquiries')
