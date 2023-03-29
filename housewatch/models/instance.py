from django.db import models
from django.utils import timezone



class Instance(models.Model):
    created_at: models.DateTimeField = models.DateTimeField(default=timezone.now)
    username: models.CharField = models.CharField(max_length=200)
    password: models.CharField = models.CharField(max_length=200)
    host: models.CharField = models.CharField(max_length=200)
    port: models.IntegerField = models.IntegerField(max_length=200)