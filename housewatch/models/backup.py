import uuid
from croniter import croniter
from django.db import models

from housewatch.utils.encrypted_fields.fields import EncryptedCharField


class ScheduledBackup(models.Model):
    id: models.UUIDField = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at: models.DateTimeField = models.DateTimeField(auto_now_add=True)
    enabled: models.BooleanField = models.BooleanField(default=False)
    last_run_time: models.DateTimeField = models.DateTimeField(null=True)
    last_incremental_run_time: models.DateTimeField = models.DateTimeField(null=True)
    last_base_backup: models.CharField = models.CharField(max_length=255, null=True)
    last_run: models.ForeignKey = models.ForeignKey("ScheduledBackupRun", on_delete=models.SET_NULL, null=True)

    # This will be a CRON expression for the job
    schedule: models.CharField = models.CharField(max_length=255)
    incremental_schedule: models.CharField = models.CharField(max_length=255, null=True)
    table: models.CharField = models.CharField(max_length=255, null=True, blank=True)
    database: models.CharField = models.CharField(max_length=255)
    is_sharded: models.BooleanField = models.BooleanField(default=False)
    cluster: models.CharField = models.CharField(max_length=255, null=True)
    bucket: models.CharField = models.CharField(max_length=255)
    path: models.CharField = models.CharField(max_length=255)
    # if set these will override the defaults from settings
    # raw keys will not be stored here but will obfuscated
    aws_access_key_id: models.CharField = EncryptedCharField(max_length=255, null=True)
    aws_secret_access_key: models.CharField = EncryptedCharField(max_length=255, null=True)

    def cron_schedule(self):
        return self.schedule.split(" ")

    def minute(self):
        return self.schedule.split(" ")[0]

    def hour(self):
        return self.schedule.split(" ")[1]

    def day_of_week(self):
        return self.schedule.split(" ")[4]

    def day_of_month(self):
        return self.schedule.split(" ")[2]

    def month_of_year(self):
        return self.schedule.split(" ")[3]

    def is_database_backup(self):
        return self.table is None

    def is_table_backup(self):
        return self.table is not None

    def save(self, *args, **kwargs):
        if not croniter.is_valid(self.schedule):
            raise ValueError("Invalid CRON expression")
        if self.incremental_schedule and not croniter.is_valid(self.incremental_schedule):
            raise ValueError("Invalid CRON expression")
        super().save(*args, **kwargs)


class ScheduledBackupRun(models.Model):
    id: models.UUIDField = models.UUIDField(primary_key=True)
    created_at: models.DateTimeField = models.DateTimeField(auto_now_add=True)
    base_backup: models.CharField = models.CharField(max_length=255, null=True)
    is_incremental: models.BooleanField = models.BooleanField(default=False)
    scheduled_backup: models.ForeignKey = models.ForeignKey(ScheduledBackup, on_delete=models.CASCADE)
    started_at: models.DateTimeField = models.DateTimeField(auto_now_add=True)
    finished_at: models.DateTimeField = models.DateTimeField(null=True)
    success: models.BooleanField = models.BooleanField(default=False)
    error: models.TextField = models.TextField(null=True)
