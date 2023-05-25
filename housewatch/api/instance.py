from typing import cast

import structlog
from django.http import JsonResponse
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.request import Request
from rest_framework.viewsets import GenericViewSet, ModelViewSet
from rest_framework.serializers import ModelSerializer
from sentry_sdk import capture_exception
from housewatch.models import Instance


logger = structlog.get_logger(__name__)


class InstanceSerializer(ModelSerializer):
    class Meta:
        model = Instance
        fields = ["id", "created_at", "username", "host", "port"]


class InstanceViewset(ModelViewSet):
    queryset = Instance.objects.all()
    serializer_class = InstanceSerializer
