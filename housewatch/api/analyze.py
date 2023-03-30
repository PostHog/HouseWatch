from rest_framework.viewsets import GenericViewSet
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.decorators import action
from housewatch.clickhouse.client import run_query, base_params
from housewatch.clickhouse.queries.sql import SLOW_QUERIES_SQL, SCHEMA_SQL, SLOW_QUERIES_BY_HASH_SQL, QUERY_EXECUTION_COUNT_SQL, PAGE_CACHE_HIT_PERCENTAGE_SQL, QUERY_LOAD_SQL, ERRORS_SQL, QUERY_MEMORY_USAGE_SQL, QUERY_READ_BYTES_SQL, TABLES_SQL, RUNNING_QUERIES_SQL

DEFAULT_TIME = 24 * 7 * 2

class AnalyzeViewset(GenericViewSet):
    def list(self, request: Request) -> Response:
        pass

    @action(detail=False, methods=["GET"])
    def slow_queries(self, request: Request):
        params = { **base_params, "limit": 100, "date_from": "now() - INTERVAL 2 WEEK"}
        if request.GET.get('by_hash'):
            query_result = run_query(SLOW_QUERIES_BY_HASH_SQL, params)
        else:
            query_result = run_query(SLOW_QUERIES_SQL, params)
        return Response(query_result)

    @action(detail=True, methods=["GET"])
    def query_detail(self, request: Request, pk: str):
        hours = request.GET.get('hours', DEFAULT_TIME)
        conditions = "and toString(normalized_query_hash) = '{}'".format(pk)
        execution_count = run_query(QUERY_EXECUTION_COUNT_SQL.format(hours=hours, conditions=conditions))
        memory_usage = run_query(QUERY_MEMORY_USAGE_SQL.format(hours=hours, conditions=conditions))
        read_bytes = run_query(QUERY_READ_BYTES_SQL.format(hours=hours, conditions=conditions))
        return Response({
            'execution_count': execution_count,
            'memory_usage': memory_usage,
            'read_bytes': read_bytes
        })

    @action(detail=False, methods=["GET"])
    def query_graphs(self, request: Request):
        hours = request.GET.get('hours', DEFAULT_TIME)
        execution_count = run_query(QUERY_EXECUTION_COUNT_SQL.format(hours=hours, conditions=''))
        memory_usage = run_query(QUERY_MEMORY_USAGE_SQL.format(hours=hours, conditions=''))
        read_bytes = run_query(QUERY_READ_BYTES_SQL.format(hours=hours, conditions=''))
        return Response({
            'execution_count': execution_count,
            'memory_usage': memory_usage,
            'read_bytes': read_bytes
        })

    @action(detail=False, methods=["GET"])
    def page_cache(self, request: Request):
        params = { **base_params, "limit": 100, "date_to": "now()", "date_from": "now() - INTERVAL 2 WEEK"}
        query_result = run_query(PAGE_CACHE_HIT_PERCENTAGE_SQL, params)
    
        return Response(query_result)

    @action(detail=False, methods=["GET"])
    def tables(self, request: Request):
        query_result = run_query(TABLES_SQL)
        return Response(query_result)

    @action(detail=True, methods=["GET"])
    def schema(self, request: Request, pk: str):
        query_result = run_query(SCHEMA_SQL, {'table': pk})
        return Response(query_result)

    @action(detail=False, methods=["GET"])
    def query_load(self, request: Request):
        params = { 
            **base_params, 
            "column_alias": "average_query_duration",
            "math_func": "avg",
            "load_metric": "query_duration_ms",
            "date_to": "now()",
            "date_from": "now() - INTERVAL 2 WEEK"
        }
        
        query_result = run_query(QUERY_LOAD_SQL, params)
    
        return Response(query_result)

    @action(detail=False, methods=["GET"])
    def errors(self, request: Request):
        params = { 
            **base_params,
            "date_from": "now() - INTERVAL 2 WEEK"
        }
        
        query_result = run_query(ERRORS_SQL, params)
    
        return Response(query_result)

    
    @action(detail=False, methods=["GET"])
    def running_queries(self, request: Request):
        query_result = run_query(RUNNING_QUERIES_SQL)

        return Response(query_result)