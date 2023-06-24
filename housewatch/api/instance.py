import structlog
from rest_framework.viewsets import ModelViewSet
from rest_framework.serializers import ModelSerializer
from housewatch.models import Instance


logger = structlog.get_logger(__name__)


class InstanceSerializer(ModelSerializer):
    class Meta:
        model = Instance
        fields = ["id", "created_at", "username", "host", "port"]


class InstanceViewset(ModelViewSet):
    queryset = Instance.objects.all()
    serializer_class = InstanceSerializer
