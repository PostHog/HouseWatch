import structlog
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from housewatch.clickhouse import backups


logger = structlog.get_logger(__name__)


class BackupViewset(GenericViewSet):
    def list(self, request: Request) -> Response:
        cluster = request.query_params.get("cluster")
        return Response(backups.get_backups(cluster=cluster))

    def retrieve(self, request: Request, pk: str) -> Response:
        cluster = request.query_params.get("cluster")
        return Response(backups.get_backup(pk, cluster=cluster))

    @action(detail=True, methods=["post"])
    def restore(self, request: Request, pk: str) -> Response:
        backups.restore_backup(pk)
        return Response()

    def create(self, request: Request) -> Response:
        database = request.data.get("database")
        table = request.data.get("table")
        bucket = request.data.get("bucket")
        path = request.data.get("path")
        if table:
            res = backups.create_table_backup(database, table, bucket, path)
        else:
            res = backups.create_database_backup(database, bucket, path)
        return Response(res)
