import uuid
from django.db import models


class PreferredReplica(models.Model):
    id: models.UUIDField = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at: models.DateTimeField = models.DateTimeField(auto_now_add=True)
    cluster: models.CharField = models.CharField(max_length=255)
    replica: models.CharField = models.CharField(max_length=255)
