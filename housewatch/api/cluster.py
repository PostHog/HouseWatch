import structlog
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from housewatch.clickhouse import clusters
from housewatch.clickhouse.client import run_query
from housewatch.clickhouse.queries.sql import (
    CLUSTER_TOPOLOGY_SQL,
    REPLICATION_STATUS_SQL,
    TABLES_WITH_ENGINE_SQL,
    TABLE_DEPENDENCIES_SQL,
    PARTS_DISTRIBUTION_SQL,
)


logger = structlog.get_logger(__name__)


class ClusterViewset(GenericViewSet):
    def list(self, request: Request) -> Response:
        return Response(clusters.get_clusters())

    def retrieve(self, request: Request, pk: str) -> Response:
        return Response(clusters.get_cluster(pk))

    @action(detail=False, methods=["GET"])
    def topology(self, request: Request) -> Response:
        """
        Get comprehensive cluster topology data including:
        - Cluster nodes (shards and replicas)
        - Tables with replication status
        - Table dependencies
        - Data distribution across nodes
        """
        try:
            # Get cluster structure
            cluster_nodes = run_query(CLUSTER_TOPOLOGY_SQL)

            # Get replication status for replicated tables
            replication_status = run_query(REPLICATION_STATUS_SQL)

            # Get all tables with their engines
            tables = run_query(TABLES_WITH_ENGINE_SQL)

            # Get table dependencies (for materialized views, etc.)
            dependencies = run_query(TABLE_DEPENDENCIES_SQL)

            # Get parts distribution across nodes
            parts_distribution = run_query(PARTS_DISTRIBUTION_SQL)

            return Response(
                {
                    "cluster_nodes": cluster_nodes,
                    "replication_status": replication_status,
                    "tables": tables,
                    "dependencies": dependencies,
                    "parts_distribution": parts_distribution,
                }
            )
        except Exception as e:
            logger.error("topology_error", error=str(e))
            return Response({"error": str(e)}, status=500)
