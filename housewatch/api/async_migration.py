import structlog
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from housewatch.models.async_migration import AsyncMigration, MigrationStatus
from housewatch.celery import run_async_migration
from rest_framework.response import Response


logger = structlog.get_logger(__name__)


class AsyncMigrationSerializer(serializers.ModelSerializer):

    class Meta:
        model = AsyncMigration
        fields = [
            "id",
            "name",
            "description",
            "progress",
            "status",
            "current_operation_index",
            "current_query_id",
            "task_id",
            "started_at",
            "finished_at",
            "operations",
            "rollback_operations",
            "last_error"
        ]
        read_only_fields = [
            "id",
            "progress",
            "status",
            "current_operation_index",
            "current_query_id",
            "task_id",
            "started_at",
            "finished_at",
            "last_error"
        ]
        
    def create(self, validated_data):
        validated_data['progress'] = 0
        validated_data['current_operation_index'] = 0
        validated_data['status'] = MigrationStatus.NotStarted
        return super().create(validated_data)



class AsyncMigrationsViewset(viewsets.ModelViewSet):
    queryset = AsyncMigration.objects.all().order_by("name")
    serializer_class = AsyncMigrationSerializer
    
    @action(methods=["POST"], detail=True)
    def trigger(self, request, **kwargs):

        migration = self.get_object()


        migration.status = MigrationStatus.Starting
        migration.save()

        run_async_migration.delay(migration.name)
        return Response({"success": True}, status=200)

    # @action(methods=["GET"], detail=False)
    # def test(self, request, **kwargs):
    #     simple.delay()
    #     return Response()

    # def _force_stop(self, rollback: bool):
    #     migration = self.get_object()
    #     if migration.status not in [MigrationStatus.Running, MigrationStatus.Starting]:
    #         return response.Response(
    #             {"success": False, "error": "Can't stop a migration that isn't running."}, status=400
    #         )
    #     force_stop_migration(migration, rollback=rollback)
    #     return response.Response({"success": True}, status=200)

    # # DANGEROUS! Can cause another task to be lost
    # @action(methods=["POST"], detail=True)
    # def force_stop(self, request, **kwargs):
    #     return self._force_stop(rollback=True)

    # # DANGEROUS! Can cause another task to be lost
    # @action(methods=["POST"], detail=True)
    # def force_stop_without_rollback(self, request, **kwargs):
    #     return self._force_stop(rollback=False)

    # @action(methods=["POST"], detail=True)
    # def rollback(self, request, **kwargs):
    #     migration = self.get_object()
    #     if migration.status != MigrationStatus.Errored:
    #         return response.Response(
    #             {"success": False, "error": "Can't rollback a migration that isn't in errored state."}, status=400
    #         )

    #     rollback_migration(migration)
    #     return response.Response({"success": True}, status=200)

    # @action(methods=["POST"], detail=True)
    # def force_rollback(self, request, **kwargs):
    #     migration = self.get_object()
    #     if migration.status != MigrationStatus.CompletedSuccessfully:
    #         return response.Response(
    #             {"success": False, "error": "Can't force rollback a migration that did not complete successfully."},
    #             status=400,
    #         )

    #     rollback_migration(migration)
    #     return response.Response({"success": True}, status=200)

    # @action(methods=["GET"], detail=True)
    # def errors(self, request, **kwargs):
    #     migration = self.get_object()
    #     return response.Response(
    #         [
    #             AsyncMigrationErrorsSerializer(e).data
    #             for e in AsyncMigrationError.objects.filter(async_migration=migration).order_by("-created_at")
    #         ]
    #     )
