from typing import List, Optional, Tuple

import structlog
from sentry_sdk.api import capture_exception


from housewatch.async_migrations.async_migration_utils import (
    complete_migration,
    execute_op,
    mark_async_migration_as_running,
    process_error,
    update_async_migration,
)
from housewatch.models.async_migration import AsyncMigration, MigrationStatus
from uuid import uuid4
# from posthog.models.instance_setting import get_instance_setting
# from posthog.models.utils import UUIDT
# from posthog.version_requirement import ServiceVersionRequirement

"""
Important to prevent us taking up too many celery workers and also to enable running migrations sequentially
"""
MAX_CONCURRENT_ASYNC_MIGRATIONS = 1

logger = structlog.get_logger(__name__)


def start_async_migration(
    migration: AsyncMigration, ignore_posthog_version=False
) -> bool:



    if migration.status not in [MigrationStatus.Starting, MigrationStatus.NotStarted]:
        logger.error(f"Initial check failed for async migration {migration.name}")
        return False

    # ok, error = run_migration_precheck(migration)
    # if not ok:
    #     process_error(
    #         migration, f"Migration precheck failed with error:{error}", status=MigrationStatus.FailedAtStartup
    #     )
    #     return False

    # ok, error = run_migration_healthcheck(migration)
    # if not ok:
    #     process_error(
    #         migration,
    #         f"Migration healthcheck failed with error:{error}",
    #         status=MigrationStatus.FailedAtStartup,
    #     )
    #     return False

    if not mark_async_migration_as_running(migration):
        # we don't want to touch the migration, i.e. don't process_error
        logger.error(f"Migration state has unexpectedly changed for async migration {migration.name}")
        return False

    return run_async_migration_operations(migration)


def run_async_migration_operations(migration: AsyncMigration) -> bool:
    while True:
        run_next, success = run_async_migration_next_op(migration)
        if not run_next:
            return success


def run_async_migration_next_op(migration: AsyncMigration):
    """
    Runs the next operation specified by the currently running migration
    We run the next operation of the migration which needs attention

    Returns (run_next, success)
    Terminology:
    - migration: The migration object as stored in the DB
    - migration_definition: The actual migration class outlining the operations (e.g. async_migrations/examples/example.py)
    """
    
    migration.refresh_from_db()


    if migration.current_operation_index > len(migration.operations) - 1:
        logger.info(
            "Marking async migration as complete",
            migration=migration.name,
            current_operation_index=migration.current_operation_index,
        )
        complete_migration(migration)
        return (False, True)

    error = None
    current_query_id = str(uuid4())

    try:
        logger.info(
            "Running async migration operation",
            migration=migration.name,
            current_operation_index=migration.current_operation_index,
        )
        op = migration.operations[migration.current_operation_index]

        execute_op(op, query_id=current_query_id)
        update_async_migration(
            migration=migration,
            current_query_id=current_query_id,
            current_operation_index=migration.current_operation_index + 1,
        )

    except Exception as e:
        error = f"Exception was thrown while running operation {migration.current_operation_index} : {str(e)}"
        logger.error(
            "Error running async migration operation",
            migration=migration.name,
            current_operation_index=migration.current_operation_index,
            error=e,
        )
        capture_exception(e)
        process_error(migration, error)

    if error:
        return (False, False)

    update_migration_progress(migration)
    return (True, False)


# def run_migration_healthcheck(migration: AsyncMigration):
#     return get_async_migration_definition(migration.name).healthcheck()


# def run_migration_precheck(migration: AsyncMigration):
#     return get_async_migration_definition(migration.name).precheck()


def update_migration_progress(migration: AsyncMigration):
    """
    We don't want to interrupt a migration if the progress check fails, hence try without handling exceptions
    Progress is a nice-to-have bit of feedback about how the migration is doing, but not essential
    """

    migration.refresh_from_db()
    try:
        update_async_migration(migration=migration, progress=int((migration.current_operation_index/len(migration.operations))*100))
    except:
        pass


def attempt_migration_rollback(migration: AsyncMigration):
    """
    Cycle through the operations in reverse order starting from the last completed op and run
    the specified rollback statements.
    """
    migration.refresh_from_db()
    ops = migration.rollback_operations
    # if the migration was completed the index is set 1 after, normally we should try rollback for current op
    current_index = min(migration.current_operation_index, len(ops) - 1)
    for op_index in range(current_index, -1, -1):
        try:
            op = ops[op_index]
            if not op:
                continue
            execute_op(op, query_id=str(uuid4))
        except Exception as e:
            last_error = f"At operation {op_index} rollback failed with error:{str(e)}"
            process_error(
                migration=migration,
                last_error=last_error,
                rollback=False,
                current_operation_index=op_index,
            )

            return

    update_async_migration(
        migration=migration, status=MigrationStatus.RolledBack, progress=0, current_operation_index=0
    )


