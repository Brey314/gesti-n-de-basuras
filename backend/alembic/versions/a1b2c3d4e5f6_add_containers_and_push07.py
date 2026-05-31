"""add containers table, container_id in reports, push07 in notif_prefs

Revision ID: a1b2c3d4e5f6
Revises: 53762413942d
Create Date: 2026-05-30

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '53762413942d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'containers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('label', sa.String(), nullable=False),
        sa.Column('pos_x', sa.Float(), nullable=False),
        sa.Column('pos_y', sa.Float(), nullable=False),
        sa.Column('active', sa.Boolean(), nullable=False, server_default='1'),
        sa.PrimaryKeyConstraint('id'),
    )

    op.bulk_insert(
        sa.table(
            'containers',
            sa.column('id', sa.Integer),
            sa.column('label', sa.String),
            sa.column('pos_x', sa.Float),
            sa.column('pos_y', sa.Float),
            sa.column('active', sa.Boolean),
        ),
        [
            {'id': 1, 'label': 'Contenedor A', 'pos_x': 0.20, 'pos_y': 0.30, 'active': True},
            {'id': 2, 'label': 'Contenedor B', 'pos_x': 0.50, 'pos_y': 0.30, 'active': True},
            {'id': 3, 'label': 'Contenedor C', 'pos_x': 0.80, 'pos_y': 0.30, 'active': True},
            {'id': 4, 'label': 'Contenedor D', 'pos_x': 0.20, 'pos_y': 0.70, 'active': True},
            {'id': 5, 'label': 'Contenedor E', 'pos_x': 0.50, 'pos_y': 0.70, 'active': True},
            {'id': 6, 'label': 'Contenedor F', 'pos_x': 0.80, 'pos_y': 0.70, 'active': True},
        ],
    )

    # SQLite no soporta ADD COLUMN con FK en ALTER TABLE; usamos batch mode
    with op.batch_alter_table('reports') as batch_op:
        batch_op.add_column(
            sa.Column('container_id', sa.Integer(), nullable=True)
        )

    with op.batch_alter_table('notif_prefs') as batch_op:
        batch_op.add_column(
            sa.Column('push07', sa.Boolean(), nullable=True, server_default='0')
        )


def downgrade() -> None:
    with op.batch_alter_table('notif_prefs') as batch_op:
        batch_op.drop_column('push07')
    with op.batch_alter_table('reports') as batch_op:
        batch_op.drop_column('container_id')
    op.drop_table('containers')
