from django.db import models

class MigrationStatus:
    NotStarted = 0
    Running = 1
    CompletedSuccessfully = 2
    Errored = 3
    RolledBack = 4
    Starting = 5  # only relevant for the UI
    FailedAtStartup = 6


class AsyncMigration(models.Model):
    class Meta:
        constraints = [models.UniqueConstraint(fields=["name"], name="unique name")]

    id: models.BigAutoField = models.BigAutoField(primary_key=True)
    name: models.CharField = models.CharField(max_length=50, null=False, blank=False)
    description: models.CharField = models.CharField(max_length=400, null=True, blank=True)
    progress: models.PositiveSmallIntegerField = models.PositiveSmallIntegerField(null=False, blank=False, default=0)
    status: models.PositiveSmallIntegerField = models.PositiveSmallIntegerField(
        null=False, blank=False, default=MigrationStatus.NotStarted
    )

    current_operation_index: models.PositiveSmallIntegerField = models.PositiveSmallIntegerField(
        null=False, blank=False, default=0
    )
    
    current_query_id: models.CharField = models.CharField(max_length=100, null=False, blank=False, default="")
    task_id: models.CharField = models.CharField(max_length=100, null=True, blank=True, default="")

    started_at: models.DateTimeField = models.DateTimeField(null=True, blank=True)