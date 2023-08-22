import structlog
from croniter import croniter
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import serializers
from rest_framework.viewsets import ModelViewSet, GenericViewSet
from housewatch.clickhouse import backups
from housewatch.models.backup import ScheduledBackup

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


class ScheduledBackupSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduledBackup
        fields = "__all__"
        read_only_fields = ["id", "last_run_time"]

    def validate(self, data):
        if data.get("schedule") and not croniter.is_valid(data["schedule"]):
            raise serializers.ValidationError(f"Invalid cron expression: {e}")
        return data


class ScheduledBackupViewset(ModelViewSet):
    queryset = ScheduledBackup.objects.all().order_by("created_at")
    serializer_class = ScheduledBackupSerializer

    @action(detail=True, methods=["post"])
    def run(self, request: Request, pk: str) -> Response:
        uuid = backups.run_backup(pk)
        return Response({"backup_uuid": uuid})
