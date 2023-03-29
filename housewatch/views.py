import structlog
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse

logger = structlog.get_logger(__name__)


@login_required
def homepage(request):
    return JsonResponse({"status": "ok"})


def healthz(request):
    return JsonResponse({"status": "ok"})
