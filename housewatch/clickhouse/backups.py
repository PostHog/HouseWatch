import structlog
from collections import defaultdict
from datetime import datetime
from typing import Dict, Optional
from uuid import uuid4
from housewatch.clickhouse.client import run_query
from housewatch.models.backup import ScheduledBackup, ScheduledBackupRun
from housewatch.clickhouse.clusters import get_node_per_shard

from django.conf import settings
from django.utils import timezone

from clickhouse_driver import Client

logger = structlog.get_logger(__name__)


def execute_backup_on_shards(
    query: str,
    params: Dict[str, str | int] = {},
    query_settings: Dict[str, str | int] = {},
    query_id: Optional[str] = None,
    substitute_params: bool = True,
    cluster: Optional[str] = None,
    aws_key: Optional[str] = None,
    aws_secret: Optional[str] = None,
    base_backup: Optional[str] = None,
):
    """
    This function will execute a backup on each shard in a cluster
    This is very similar to run_query_on_shards but it has very specific things for backups
    specifically around base_backup settings
    """
    nodes = get_node_per_shard(cluster)
    responses = []
    for shard, node in nodes:
        params["shard"] = shard
        if base_backup:
            query_settings["base_backup"] = f"S3('{base_backup}/{shard}', '{aws_key}', '{aws_secret}')"
        final_query = query % (params or {}) if substitute_params else query
        client = Client(
            host=node["host_address"],
            database=settings.CLICKHOUSE_DATABASE,
            user=settings.CLICKHOUSE_USER,
            secure=settings.CLICKHOUSE_SECURE,
            ca_certs=settings.CLICKHOUSE_CA,
            verify=settings.CLICKHOUSE_VERIFY,
            settings={"max_result_rows": "2000"},
            send_receive_timeout=30,
            password=settings.CLICKHOUSE_PASSWORD,
        )
        result = client.execute(final_query, settings=query_settings, with_column_types=True, query_id=query_id)
        response = []
        for res in result[0]:
            item = {}
            for index, key in enumerate(result[1]):
                item[key[0]] = res[index]
            response.append(item)
        responses.append((shard, response))
    return response


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


def create_table_backup(database, table, bucket, path, cluster=None, aws_key=None, aws_secret=None, base_backup=None):
    if aws_key is None or aws_secret is None:
        aws_key = settings.AWS_ACCESS_KEY_ID
        aws_secret = settings.AWS_SECRET_ACCESS_KEY
    query_settings = {}
    if cluster:
        QUERY = """BACKUP TABLE %(database)s.%(table)s
        TO S3('https://%(bucket)s.s3.amazonaws.com/%(path)s/%(shard)s', '%(aws_key)s', '%(aws_secret)s')
        ASYNC"""
        return execute_backup_on_shards(
            QUERY,
            {
                "database": database,
                "table": table,
                "bucket": bucket,
                "path": path,
                "aws_key": aws_key,
                "aws_secret": aws_secret,
            },
            query_settings=query_settings,
            cluster=cluster,
            aws_key=aws_key,
            aws_secret=aws_secret,
            base_backup=base_backup,
        )
    QUERY = """BACKUP TABLE %(database)s.%(table)s
    TO S3('https://%(bucket)s.s3.amazonaws.com/%(path)s', '%(aws_key)s', '%(aws_secret)s')
    ASYNC"""
    if base_backup:
        query_settings["base_backup"] = f"S3('{base_backup}', '{aws_key}', '{aws_secret}')"
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
        query_settings=query_settings,
        use_cache=False,
    )


def create_database_backup(database, bucket, path, cluster=None, aws_key=None, aws_secret=None, base_backup=None):
    if aws_key is None or aws_secret is None:
        aws_key = settings.AWS_ACCESS_KEY_ID
        aws_secret = settings.AWS_SECRET_ACCESS_KEY
    query_settings = {}
    if cluster:
        QUERY = """BACKUP DATABASE %(database)s 
                    TO S3('https://%(bucket)s.s3.amazonaws.com/%(path)s/%(shard)s', '%(aws_key)s', '%(aws_secret)s')
                    ASYNC"""

        return execute_backup_on_shards(
            QUERY,
            {
                "database": database,
                "bucket": bucket,
                "path": path,
                "aws_key": aws_key,
                "aws_secret": aws_secret,
            },
            query_settings=query_settings,
            cluster=cluster,
            aws_key=aws_key,
            aws_secret=aws_secret,
            base_backup=base_backup,
        )
    QUERY = """BACKUP DATABASE %(database)s
                TO S3('https://%(bucket)s.s3.amazonaws.com/%(path)s', '%(aws_key)s', '%(aws_secret)s')
                ASYNC"""
    if base_backup:
        query_settings["base_backup"] = f"S3('{base_backup}', '{aws_key}', '{aws_secret}')"
    return run_query(
        QUERY,
        {
            "database": database,
            "bucket": bucket,
            "path": path,
            "aws_key": aws_key,
            "aws_secret": aws_secret,
        },
        query_settings=query_settings,
        use_cache=False,
    )


def run_backup(backup_id, incremental=False):
    backup = ScheduledBackup.objects.get(id=backup_id)
    now = timezone.now()
    path = backup.path + "/" + now.isoformat()
    base_backup = None
    S3_LOCATION = f"https://{backup.bucket}.s3.amazonaws.com/{path}"
    if incremental:
        if not backup.last_run:
            logger.info("Cannot run incremental backup without a base backup")
        base_backup = backup.last_base_backup
    if backup.is_database_backup():
        create_database_backup(
            backup.database,
            backup.bucket,
            path,
            backup.cluster,
            backup.aws_access_key_id,
            backup.aws_secret_access_key,
            base_backup=base_backup,
        )
    elif backup.is_table_backup():
        create_table_backup(
            backup.database,
            backup.table,
            backup.bucket,
            path,
            backup.cluster,
            backup.aws_access_key_id,
            backup.aws_secret_access_key,
            base_backup=base_backup,
        )
    uuid = str(uuid4())
    br = ScheduledBackupRun.objects.create(
        scheduled_backup=backup, id=uuid, started_at=now, is_incremental=incremental, base_backup=base_backup
    )
    br.save()
    if incremental:
        backup.last_incremental_run = br
        backup.last_incremental_run_time = now
    else:
        backup.last_run = br
        backup.last_run_time = now
        backup.last_base_backup = S3_LOCATION
    backup.save()
    return


def restore_backup(backup):
    pass
