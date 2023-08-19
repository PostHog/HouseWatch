import os
from datetime import datetime

import structlog
from croniter import croniter
from celery import Celery
from django_structlog.celery.steps import DjangoStructLogInitStep
from django.utils import timezone

logger = structlog.get_logger(__name__)

# set the default Django settings module for the 'celery' program.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "housewatch.settings")

app = Celery("housewatch")

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

app.steps["worker"].add(DjangoStructLogInitStep)


@app.on_after_configure.connect
def setup_periodic_tasks(sender: Celery, **kwargs):
    sender.add_periodic_task(60.0, schedule_backups.s(), name="schedule backups")


@app.task(track_started=True, ignore_result=False, max_retries=0)
def run_backup(backup_id: str):
    from housewatch.clickhouse import backups

    backups.run_backup(backup_id)


@app.task(track_started=True, ignore_result=False, max_retries=0)
def schedule_backups():
    from housewatch.models.backup import ScheduledBackup

    logger.info("Running scheduled backups")
    backups = ScheduledBackup.objects.filter(enabled=True)
    now = timezone.now()
    for backup in backups:
        nr = croniter(backup.schedule, backup.last_run_time).get_next(datetime)
        if nr < now:
            run_backup.delay(backup.id)
            backup.last_run_time = now
            backup.save()


@app.task(track_started=True, ignore_result=False, max_retries=0)
def run_async_migration(migration_name: str):
    from housewatch.async_migrations.runner import start_async_migration
    from housewatch.models.async_migration import AsyncMigration

    migration = AsyncMigration.objects.get(name=migration_name)
    start_async_migration(migration)
