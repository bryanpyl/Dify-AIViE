"""`workflow_draft_variables` add `node_execution_id` column, add an index for `workflow_node_executions`.

Revision ID: 4474872b0ee6
Revises: 2adcbe1f5dfb
Create Date: 2025-06-06 14:24:44.213018
"""
from alembic import op
from sqlalchemy import text
import models as models
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4474872b0ee6'
down_revision = '2adcbe1f5dfb'
branch_labels = None
depends_on = None


def upgrade():
    # Create index safely (only if it doesn't already exist)
    with op.get_context().autocommit_block():
        op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE c.relname = 'workflow_node_executions_tenant_id_idx'
                AND c.relkind = 'i'
            ) THEN
                CREATE INDEX workflow_node_executions_tenant_id_idx
                ON workflow_node_executions (tenant_id, workflow_id, node_id, created_at DESC);
            END IF;
        END $$;
        """)



    # Safely add column only if it doesn't exist
    with op.batch_alter_table('workflow_draft_variables', schema=None) as batch_op:
        conn = op.get_bind()
        result = conn.execute(text("""
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='workflow_draft_variables' 
              AND column_name='node_execution_id'
        """)).fetchone()
        if not result:
            batch_op.add_column(sa.Column('node_execution_id', models.types.StringUUID(), nullable=True))


def downgrade():
    # Drop index safely
    with op.get_context().autocommit_block():
        op.execute(text("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE c.relname = 'workflow_node_executions_tenant_id_idx'
                  AND c.relkind = 'i'
            ) THEN
                DROP INDEX CONCURRENTLY workflow_node_executions_tenant_id_idx;
            END IF;
        END $$;
        """))

    # Drop column safely
    with op.batch_alter_table('workflow_draft_variables', schema=None) as batch_op:
        conn = op.get_bind()
        result = conn.execute(text("""
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='workflow_draft_variables' 
              AND column_name='node_execution_id'
        """)).fetchone()
        if result:
            batch_op.drop_column('node_execution_id')
