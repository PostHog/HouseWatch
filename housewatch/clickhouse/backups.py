import structlog
from collections import defaultdict
from datetime import datetime
from housewatch.clickhouse.client import run_query
from housewatch.models.backup import ScheduledBackup, ScheduledBackupRun

from django.conf import settings
from django.utils import timezone

logger = structlog.get_logger(__name__)


def get_backups(cluster=None):
    if cluster:
        QUERY = """SELECT id, name, status, error, start_time, end_time, num_files, formatReadableSize(total_size) total_size, num_entries, uncompressed_size, compressed_size, files_read, bytes_read FROM clusterAllReplicas(%(cluster)s, system.backups) ORDER BY start_time DESC"""
    else:
        QUERY = """SELECT id, name, status, error, start_time, end_time, num_files, formatReadableSize(total_size) total_size, num_entries, uncompressed_size, compressed_size, files_read, bytes_read FROM system.backups ORDER BY start_time DESC"""
    res = run_query(QUERY, {"cluster": cluster}, use_cache=False)
    return res


def get_backup(backup, cluster=None):
    if cluster:
        QUERY = """Select * FROM clusterAllReplicas(%(cluster)s, system.backups) WHERE id = '%(uuid)s' """
        return run_query(QUERY, {"cluster": cluster, "uuid": backup}, use_cache=False)
    else:
        QUERY = """Select * FROM system.backups WHERE id = '%(uuid)s' """
        return run_query(QUERY, {"uuid": backup}, use_cache=False)


def create_table_backup(database, table, bucket, path, aws_key=None, aws_secret=None):
    if aws_key is None or aws_secret is None:
        aws_key = settings.AWS_ACCESS_KEY_ID
        aws_secret = settings.AWS_SECRET_ACCESS_KEY
    QUERY = """BACKUP TABLE %(database)s.%(table)s
    TO S3('https://%(bucket)s.s3.amazonaws.com/%(path)s', '%(aws_key)s', '%(aws_secret)s')
    ASYNC"""
    return run_query(
        QUERY,
        {
            "database": database,
            "table": table,
            "bucket": bucket,
            "path": path,
            "aws_key": aws_key,
            "aws_secret": aws_secret,
        },
        use_cache=False,
    )


def create_database_backup(database, bucket, path, aws_key=None, aws_secret=None):
    if aws_key is None or aws_secret is None:
        aws_key = settings.AWS_ACCESS_KEY_ID
        aws_secret = settings.AWS_SECRET_ACCESS_KEY
    QUERY = """BACKUP DATABASE %(database)s 
                TO S3('https://%(bucket)s.s3.amazonaws.com/%(path)s', '%(aws_key)s', '%(aws_secret)s')
                ASYNC"""
    return run_query(
        QUERY,
        {
            "database": database,
            "bucket": bucket,
            "path": path,
            "aws_key": aws_key,
            "aws_secret": aws_secret,
        },
        use_cache=False,
    )


def run_backup(backup_id):
    backup = ScheduledBackup.objects.get(id=backup_id)
    now = timezone.now()
    path = backup.path + "/" + now.isoformat()
    if backup.is_database_backup():
        uuid = create_database_backup(
            backup.database,
            backup.bucket,
            path,
            backup.aws_access_key_id,
            backup.aws_secret_access_key,
        )[0]["id"]
    elif backup.is_table_backup():
        uuid = create_table_backup(
            backup.database,
            backup.table,
            backup.bucket,
            path,
            backup.aws_access_key_id,
            backup.aws_secret_access_key,
        )[0]["id"]
    br = ScheduledBackupRun.objects.create(scheduled_backup=backup, id=uuid, started_at=now)
    br.save()
    backup.last_run = br
    backup.last_run_time = now
    backup.save()
    return uuid


def restore_backup(backup):
    pass
