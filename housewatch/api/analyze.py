from rest_framework.viewsets import GenericViewSet
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.decorators import action
from housewatch.clickhouse.client import run_query

class AnalyzeViewset(GenericViewSet):
    def list(self, request: Request) -> Response:
        pass

    @action(detail=False, methods=["GET"])
    def slow_queries(self, request: Request):
        result = run_query("""
        SELECT toUInt8(type) as query_type, query, query_duration_ms 
FROM clusterAllReplicas('posthog', system.query_log) 
WHERE is_initial_query AND event_time > now() - INTERVAL 2 WEEK
ORDER BY query_duration_ms DESC
LIMIT 100
""")
    
        return Response(result)
