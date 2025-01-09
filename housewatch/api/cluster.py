import structlog
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from housewatch.clickhouse import clusters


logger = structlog.get_logger(__name__)


class ClusterViewset(GenericViewSet):
    def list(self, request: Request) -> Response:
        return Response(clusters.get_clusters())

    def retrieve(self, request: Request, pk: str) -> Response:
        return Response(clusters.get_cluster(pk))


class ReplicationViewset(GenericViewSet):
    def list(self, request: Request) -> Response:
        cluster = request.query_params.get("cluster")
        if not cluster:
            return Response({"error": "cluster parameter is required"}, status=400)
        return Response(list(clusters.get_replication_queues(cluster)))
