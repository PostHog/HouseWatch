from typing import cast

import structlog
from django.http import JsonResponse
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.request import Request
from rest_framework.viewsets import GenericViewSet
from sentry_sdk import capture_exception


logger = structlog.get_logger(__name__)


class InstanceViewset(GenericViewSet):

    def list(self, request: Request) -> JsonResponse:

        return JsonResponse(
            [{}],
            status=status.HTTP_200_OK,
        )
