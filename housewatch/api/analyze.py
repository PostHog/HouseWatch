from rest_framework.viewsets import GenericViewSet
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.decorators import action
from housewatch.clickhouse.client import run_query, base_params
from housewatch.clickhouse.queries.sql import SLOW_QUERIES_SQL, PAGE_CACHE_HIT_PERCENTAGE_SQL, QUERY_LOAD_SQL, ERRORS_SQL

class AnalyzeViewset(GenericViewSet):
    def list(self, request: Request) -> Response:
        pass

    @action(detail=False, methods=["GET"])
    def slow_queries(self, request: Request):
        params = { **base_params, "limit": 100, "date_from": "now() - INTERVAL 2 WEEK"}
        query_result = run_query(SLOW_QUERIES_SQL, params)
        return Response(query_result)

    @action(detail=False, methods=["GET"])
    def page_cache(self, request: Request):
        params = { **base_params, "limit": 100, "date_to": "now()", "date_from": "now() - INTERVAL 2 WEEK"}
        query_result = run_query(PAGE_CACHE_HIT_PERCENTAGE_SQL, params)
    
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

    