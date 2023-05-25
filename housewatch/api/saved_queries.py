import structlog
from rest_framework import serializers, viewsets
from housewatch.models.saved_queries import SavedQuery


logger = structlog.get_logger(__name__)


class SavedQuerySerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedQuery
        fields = ["id", "name", "query", "created_at"]
        read_only_fields = ["id", "created_at"]


class SavedQueryViewset(viewsets.ModelViewSet):
    queryset = SavedQuery.objects.all().order_by("name")
    serializer_class = SavedQuerySerializer
