import structlog
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from housewatch.models.async_migration import AsyncMigration

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
        ]
        read_only_fields = [
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
        ]



class AsyncMigrationsViewset(viewsets.ModelViewSet):
    queryset = AsyncMigration.objects.all().order_by("name")
    serializer_class = AsyncMigrationSerializer

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    # @action(methods=["POST"], detail=True)
    # def trigger(self, request, **kwargs):
    #     if get_all_running_async_migrations().count() >= MAX_CONCURRENT_ASYNC_MIGRATIONS:
    #         return response.Response(
    #             {
    #                 "success": False,
    #                 "error": f"No more than {MAX_CONCURRENT_ASYNC_MIGRATIONS} async migration can run at once.",
    #             },
    #             status=400,
    #         )

    #     migration_instance = self.get_object()

    #     if not is_posthog_version_compatible(
    #         migration_instance.posthog_min_version, migration_instance.posthog_max_version
    #     ):
    #         return response.Response(
    #             {
    #                 "success": False,
    #                 "error": f"Can't run migration. Minimum PostHog version: {migration_instance.posthog_min_version}. Maximum PostHog version: {migration_instance.posthog_max_version}",
    #             },
    #             status=400,
    #         )

    #     migration_instance.status = MigrationStatus.Starting
    #     migration_instance.parameters = request.data.get("parameters", {})
    #     migration_instance.save()

    #     trigger_migration(migration_instance)
    #     return response.Response({"success": True}, status=200)

    # @action(methods=["POST"], detail=True)
    # def resume(self, request, **kwargs):
    #     migration_instance = self.get_object()
    #     if migration_instance.status != MigrationStatus.Errored:
    #         return response.Response(
    #             {"success": False, "error": "Can't resume a migration that isn't in errored state"}, status=400
    #         )

    #     migration_instance.status = MigrationStatus.Running
    #     migration_instance.parameters = request.data.get("parameters", {})
    #     migration_instance.save()

    #     trigger_migration(migration_instance, fresh_start=False)
    #     return response.Response({"success": True}, status=200)

    # def _force_stop(self, rollback: bool):
    #     migration_instance = self.get_object()
    #     if migration_instance.status not in [MigrationStatus.Running, MigrationStatus.Starting]:
    #         return response.Response(
    #             {"success": False, "error": "Can't stop a migration that isn't running."}, status=400
    #         )
    #     force_stop_migration(migration_instance, rollback=rollback)
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
    #     migration_instance = self.get_object()
    #     if migration_instance.status != MigrationStatus.Errored:
    #         return response.Response(
    #             {"success": False, "error": "Can't rollback a migration that isn't in errored state."}, status=400
    #         )

    #     rollback_migration(migration_instance)
    #     return response.Response({"success": True}, status=200)

    # @action(methods=["POST"], detail=True)
    # def force_rollback(self, request, **kwargs):
    #     migration_instance = self.get_object()
    #     if migration_instance.status != MigrationStatus.CompletedSuccessfully:
    #         return response.Response(
    #             {"success": False, "error": "Can't force rollback a migration that did not complete successfully."},
    #             status=400,
    #         )

    #     rollback_migration(migration_instance)
    #     return response.Response({"success": True}, status=200)

    # @action(methods=["GET"], detail=True)
    # def errors(self, request, **kwargs):
    #     migration_instance = self.get_object()
    #     return response.Response(
    #         [
    #             AsyncMigrationErrorsSerializer(e).data
    #             for e in AsyncMigrationError.objects.filter(async_migration=migration_instance).order_by("-created_at")
    #         ]
    #     )
