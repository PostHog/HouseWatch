from rest_framework.viewsets import GenericViewSet
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.decorators import action
from housewatch.clickhouse.client import run_query, base_params
from housewatch.clickhouse.queries.sql import SLOW_QUERIES_SQL, SCHEMA_SQL, PAGE_CACHE_SQL, SLOW_QUERIES_BY_HASH_SQL, COLUMN_SIZE_SQL, QUERY_EXECUTION_COUNT_SQL

DEFAULT_TIME = 24 * 7 * 2

class AnalyzeViewset(GenericViewSet):
    def list(self, request: Request) -> Response:
        pass

    @action(detail=False, methods=["GET"])
    def slow_queries(self, request: Request):
        params = { **base_params, "limit": 100, "date_from": "now() - INTERVAL 2 WEEK"}
        if request.GET.get('by_hash'):
            query_result = run_query(SLOW_QUERIES_BY_HASH_SQL % params)
        else:
            query_result = run_query(SLOW_QUERIES_SQL % params)
        return Response(query_result)

    @action(detail=True, methods=["GET"])
    def query_detail(self, request: Request, pk: str):
        hours = request.GET.get('hours', DEFAULT_TIME)
        execution_count = run_query(QUERY_EXECUTION_COUNT_SQL.format(query_hash=pk, hours=hours))
        return Response({
            'execution_count': execution_count,

        })

    @action(detail=False, methods=["GET"])
    def page_cache(self, request: Request):
        ddd = run_query(PAGE_CACHE_SQL)
        return Response(ddd)

    @action(detail=False, methods=["GET"])
    def schema(self, request: Request):
        query_result = run_query(SCHEMA_SQL)
        return Response(query_result)

    @action(detail=True, methods=["GET"])
    def column_size(self, request: Request, pk: str):
        query_result = run_query(COLUMN_SIZE_SQL)
        return Response(query_result)