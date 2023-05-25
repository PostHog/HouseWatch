from django.db import models


class SavedQuery(models.Model):
    id: models.BigAutoField = models.BigAutoField(primary_key=True)
    name: models.CharField = models.CharField(max_length=200)
    query: models.CharField = models.CharField(max_length=2000)
    created_at: models.DateTimeField = models.DateTimeField(auto_now=True)
