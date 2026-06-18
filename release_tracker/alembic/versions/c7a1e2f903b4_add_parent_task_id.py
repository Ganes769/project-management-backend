"""add parent_task_id for subtasks

Revision ID: c7a1e2f903b4
Revises: b056d58e84f0
Create Date: 2026-06-14 22:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c7a1e2f903b4"
down_revision: Union[str, Sequence[str], None] = "b056d58e84f0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("tasks", sa.Column("parent_task_id", sa.Integer(), nullable=True))
    op.create_index(
        op.f("ix_tasks_parent_task_id"), "tasks", ["parent_task_id"], unique=False
    )
    op.create_foreign_key(
        "fk_tasks_parent_task_id",
        "tasks",
        "tasks",
        ["parent_task_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("fk_tasks_parent_task_id", "tasks", type_="foreignkey")
    op.drop_index(op.f("ix_tasks_parent_task_id"), table_name="tasks")
    op.drop_column("tasks", "parent_task_id")
