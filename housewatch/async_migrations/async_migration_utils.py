import asyncio
from datetime import datetime
from typing import Callable, Optional

import structlog
from django.conf import settings
from django.db import transaction
from django.utils.timezone import now
from housewatch.models.async_migration import AsyncMigration, MigrationStatus


logger = structlog.get_logger(__name__)


# def execute_op(op: AsyncMigrationOperation, uuid: str, rollback: bool = False):
#     """
#     Execute the fn or rollback_fn
#     """
#     op.rollback_fn(uuid) if rollback else op.fn(uuid)


def execute_op(
    sql: str,
    args=None,
    *,
    query_id: str,
    timeout_seconds: int = 600,
    settings=None
):
    from housewatch.clickhouse.client import run_query
    
    settings = settings if settings else {"max_execution_time": timeout_seconds, "log_comment": query_id}

    try:
        run_query(sql, args, settings=settings)
    except Exception as e:
        raise Exception(f"Failed to execute ClickHouse op: sql={sql},\nquery_id={query_id},\nexception={str(e)}")



def mark_async_migration_as_running(migration: AsyncMigration) -> bool:
    # update to running iff the state was Starting (ui triggered) or NotStarted (api triggered)
    with transaction.atomic():
        if migration.status not in [MigrationStatus.Starting, MigrationStatus.NotStarted]:
            return False
        migration.status = MigrationStatus.Running
        migration.current_query_id = ""
        migration.progress = 0
        migration.current_operation_index = 0
        migration.started_at = now()
        migration.finished_at = None
        migration.save()
    return True


def halt_starting_migration(migration: AsyncMigration) -> bool:
    # update to RolledBack (which blocks starting a migration) iff the state was Starting
    with transaction.atomic():
        instance = AsyncMigration.objects.select_for_update().get(pk=migration.pk)
        if instance.status != MigrationStatus.Starting:
            return False
        instance.status = MigrationStatus.RolledBack
        instance.save()
    return True


def update_async_migration(
    migration: AsyncMigration,
    last_error: Optional[str] = None,
    current_query_id: Optional[str] = None,
    task_id: Optional[str] = None,
    progress: Optional[int] = None,
    current_operation_index: Optional[int] = None,
    status: Optional[int] = None,
    started_at: Optional[datetime] = None,
    finished_at: Optional[datetime] = None,
    lock_row: bool = True,
):
    def execute_update():
        instance = migration
        if lock_row:
            instance = AsyncMigration.objects.select_for_update().get(pk=migration.pk)
        else:
            instance.refresh_from_db()
        if current_query_id is not None:
            instance.current_query_id = current_query_id
        if last_error is not None:
            instance.last_error = last_error
        if task_id is not None:
            instance.task_id = task_id
        if progress is not None:
            instance.progress = progress
        if current_operation_index is not None:
            instance.current_operation_index = current_operation_index
        if status is not None:
            instance.status = status
        if started_at is not None:
            instance.started_at = started_at
        if finished_at is not None:
            instance.finished_at = finished_at
        instance.save()

    if lock_row:
        with transaction.atomic():
            execute_update()
    else:
        execute_update()



def process_error(
    migration: AsyncMigration,
    last_error: str,
    rollback: bool = True,
    status: int = MigrationStatus.Errored,
    current_operation_index: Optional[int] = None,
):
    logger.error(f"Async migration {migration.name} error: {last_error}")

    update_async_migration(
        migration=migration,
        current_operation_index=current_operation_index,
        status=status,
        last_error=last_error,
        finished_at=now(),
    )

    if (
        not rollback
        or status == MigrationStatus.FailedAtStartup
    ):
        return

    from housewatch.async_migrations.runner import attempt_migration_rollback

    attempt_migration_rollback(migration)


def trigger_migration(migration: AsyncMigration, fresh_start: bool = True):
    from housewatch.tasks import run_async_migration

    task = run_async_migration.delay(migration.name, fresh_start)

    update_async_migration(migration=migration, task_id=str(task.id))


# def force_stop_migration(
#     migration: AsyncMigration, error: str = "Force stopped by user", rollback: bool = True
# ):
#     """
#     In theory this is dangerous, as it can cause another task to be lost
#     `revoke` with `terminate=True` kills the process that's working on the task
#     and there's no guarantee the task will not already be done by the time this happens.
#     See: https://docs.celeryproject.org/en/stable/reference/celery.app.control.html#celery.app.control.Control.revoke
#     However, this is generally ok for us because:
#     1. Given these are long-running migrations, it is statistically unlikely it will complete during in between
#     this call and the time the process is killed
#     2. Our Celery tasks are not essential for the functioning of PostHog, meaning losing a task is not the end of the world
#     """
#     # Shortcut if we are still in starting state
#     if migration.status == MigrationStatus.Starting:
#         if halt_starting_migration(migration):
#             return

#     app.control.revoke(migration.celery_task_id, terminate=True)
#     process_error(migration, error, rollback=rollback)


# def rollback_migration(migration: AsyncMigration):
#     from posthog.async_migrations.runner import attempt_migration_rollback

#     attempt_migration_rollback(migration)


def complete_migration(migration: AsyncMigration, email: bool = True):
    finished_at = now()

    migration.refresh_from_db()

    needs_update = migration.status != MigrationStatus.CompletedSuccessfully

    if needs_update:
        update_async_migration(
            migration=migration,
            status=MigrationStatus.CompletedSuccessfully,
            finished_at=finished_at,
            progress=100,
        )

