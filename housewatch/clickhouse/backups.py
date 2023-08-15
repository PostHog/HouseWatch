from collections import defaultdict
from housewatch.clickhouse.client import run_query

from django.conf import settings


def get_backups(cluster=None):
    if cluster:
        QUERY = """SELECT * FROM clusterAllReplicas(%(cluster)s, system.backups)"""
    else:
        QUERY = """SELECT * FROM system.backups"""
    res = run_query(QUERY, {"cluster": cluster})
    return res


def get_backup(backup, cluster=None):
    if cluster:
        QUERY = """Select * FROM clusterAllReplicas(%(cluster)s, system.backups) WHERE id = '%(uuid)s' """
        return run_query(QUERY, {"cluster": cluster, "uuid": backup})
    else:
        QUERY = """Select * FROM system.backups WHERE id = '%(uuid)s' """
        return run_query(QUERY, {"uuid": backup})


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
    )


def restore_backup(backup):
    pass
