from django.db import models
from housewatch.utils.encrypted_fields.fields import EncryptedCharField


class ScheduledBackup(models.Model):
    id: models.UUIDField = models.UUIDField(primary_key=True)
    # This will be a CRON expression for the job
    schedule: models.CharField = models.CharField(max_length=255)
    table: models.CharField = models.CharField(max_length=255, null=True)
    database: models.CharField = models.CharField(max_length=255)
    bucket: models.CharField = models.CharField(max_length=255)
    path: models.CharField = models.CharField(max_length=255)
    # if set these will override the defaults from settings
    # raw keys will not be stored here but will obfuscated
    aws_access_key_id: models.CharField = EncryptedCharField(max_length=255, null=True)
    aws_secret_access_key: models.CharField = EncryptedCharField(max_length=255, null=True)
    aws_region: models.CharField = EncryptedCharField(max_length=255, null=True)
    aws_endpoint_url: models.CharField = EncryptedCharField(max_length=255, null=True)


class ScheduledBackupRun(models.Model):
    id: models.UUIDField = models.UUIDField(primary_key=True)
    scheduled_backup: models.ForeignKey = models.ForeignKey(ScheduledBackup, on_delete=models.CASCADE)
    started_at: models.DateTimeField = models.DateTimeField(auto_now_add=True)
    finished_at: models.DateTimeField = models.DateTimeField(null=True)
    success: models.BooleanField = models.BooleanField(default=False)
    error: models.TextField = models.TextField(null=True)
