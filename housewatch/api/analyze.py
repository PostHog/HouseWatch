from rest_framework.viewsets import GenericViewSet
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.decorators import action
from housewatch.clickhouse.client import run_query, ch_host, existing_system_tables
from housewatch.clickhouse.queries.sql import (
    SLOW_QUERIES_SQL, 
    SCHEMA_SQL, 
    QUERY_EXECUTION_COUNT_SQL, 
    QUERY_LOAD_SQL, 
    ERRORS_SQL, 
    QUERY_MEMORY_USAGE_SQL, 
    QUERY_READ_BYTES_SQL, 
    TABLES_SQL, 
    RUNNING_QUERIES_SQL, 
    KILL_QUERY_SQL,
    PARTS_SQL,
    NODE_STORAGE_SQL,
    NODE_DATA_TRANSFER_ACROSS_SHARDS_SQL,
    GET_QUERY_BY_NORMALIZED_HASH_SQL,
    QUERY_CPU_USAGE_SQL,
    LOGS_SQL,
    LOGS_FREQUENCY_SQL,
    EXPLAIN_QUERY
)
DEFAULT_DAYS = 7

class AnalyzeViewset(GenericViewSet):
    def list(self, request: Request) -> Response:
        pass

    @action(detail=False, methods=["GET"])
    def slow_queries(self, request: Request):
        params = {  "limit": 100, "date_from": "now() - INTERVAL 1 WEEK" }
        query_result = run_query(SLOW_QUERIES_SQL, params)
        return Response(query_result)

    @action(detail=True, methods=["GET"])
    def query_detail(self, request: Request, pk: str):
        days = request.GET.get('days', DEFAULT_DAYS)
        conditions = "AND event_time > now() - INTERVAL 1 WEEK AND toString(normalized_query_hash) = '{}'".format(pk)
        execution_count = run_query(QUERY_EXECUTION_COUNT_SQL, { 'days': days, 'conditions': conditions })
        memory_usage = run_query(QUERY_MEMORY_USAGE_SQL, { 'days': days, 'conditions': conditions })
        read_bytes = run_query(QUERY_READ_BYTES_SQL, { 'days': days, 'conditions': conditions })
        cpu = run_query(QUERY_CPU_USAGE_SQL, { 'days': days, 'conditions': conditions })
        query_details = run_query(GET_QUERY_BY_NORMALIZED_HASH_SQL, {'normalized_query_hash': pk})
        normalized_query = query_details[0]['normalized_query']
        example_queries = query_details[0]['example_queries']
        explain = run_query(EXPLAIN_QUERY, {'query': example_queries[0] })
        
        return Response({
            'query': normalized_query,
            'explain': explain,
            'example_queries': [{"query": q } for q in example_queries],
            'execution_count': execution_count,
            'memory_usage': memory_usage,
            'read_bytes': read_bytes,
            'cpu': cpu
        })
        
    @action(detail=True, methods=["GET"])
    def query_normalized(self, request: Request, pk: str):
        query_details = run_query(GET_QUERY_BY_NORMALIZED_HASH_SQL, {'normalized_query_hash': pk})
        normalized_query = query_details[0]['normalized_query']
        
        return Response({
            'query': normalized_query,
        })
        
        
        
    @action(detail=True, methods=["GET"])
    def query_metrics(self, request: Request, pk: str):
        days = request.GET.get('days', DEFAULT_DAYS)
        conditions = "AND event_time > now() - INTERVAL 1 WEEK AND toString(normalized_query_hash) = '{}'".format(pk)
        execution_count = run_query(QUERY_EXECUTION_COUNT_SQL, { 'days': days, 'conditions': conditions })
        memory_usage = run_query(QUERY_MEMORY_USAGE_SQL, { 'days': days, 'conditions': conditions })
        read_bytes = run_query(QUERY_READ_BYTES_SQL, { 'days': days, 'conditions': conditions })
        cpu = run_query(QUERY_CPU_USAGE_SQL, { 'days': days, 'conditions': conditions })
        
        return Response({
            'execution_count': execution_count,
            'memory_usage': memory_usage,
            'read_bytes': read_bytes,
            'cpu': cpu
        })
        
    @action(detail=True, methods=["GET"])
    def query_explain(self, request: Request, pk: str):
        query_details = run_query(GET_QUERY_BY_NORMALIZED_HASH_SQL, {'normalized_query_hash': pk})
        example_queries = query_details[0]['example_queries']
        explain = run_query(EXPLAIN_QUERY, {'query': example_queries[0] })
        
        return Response({
            'explain': explain,
        })
        
    @action(detail=True, methods=["GET"])
    def query_examples(self, request: Request, pk: str):
        query_details = run_query(GET_QUERY_BY_NORMALIZED_HASH_SQL, {'normalized_query_hash': pk})
        example_queries = query_details[0]['example_queries']
        
        return Response({
            'example_queries': [{"query": q } for q in example_queries],
        })
        
        
        
    @action(detail=False, methods=["GET"])
    def query_graphs(self, request: Request):
        days = request.GET.get('days', DEFAULT_DAYS)
        execution_count = run_query(QUERY_EXECUTION_COUNT_SQL, { "days": days, "conditions": ''})
        memory_usage = run_query(QUERY_MEMORY_USAGE_SQL, { "days": days, "conditions": ''})
        read_bytes = run_query(QUERY_READ_BYTES_SQL, { "days": days, "conditions": ''})
        cpu = run_query(QUERY_CPU_USAGE_SQL, { "days": days, "conditions": ''})
        return Response({
            'execution_count': execution_count,
            'memory_usage': memory_usage,
            'read_bytes': read_bytes,
            'cpu': cpu
        })

    @action(detail=False, methods=["GET"])
    def tables(self, request: Request):
        query_result = run_query(TABLES_SQL)
        return Response(query_result)
    
    @action(detail=False, methods=["POST"])
    def logs(self, request: Request):
        if 'text_log' not in existing_system_tables:
            return Response(status=418, data={"error": "text_log table does not exist"})
        query_result = run_query(LOGS_SQL, { "message": f"%{request.data['message_ilike']}%" if request.data['message_ilike'] else '%'})
        return Response(query_result)
    
    @action(detail=False, methods=["POST"])
    def logs_frequency(self, request: Request):
        if 'text_log' not in existing_system_tables:
            return Response(status=418, data={"error": "text_log table does not exist"})
        query_result = run_query(LOGS_FREQUENCY_SQL, { "message": f"%{request.data['message_ilike']}%" if request.data['message_ilike'] else '%'})
        return Response(query_result)
    
    @action(detail=False, methods=["POST"])
    def query(self, request: Request):
        try:
            query_result = run_query(request.data['sql'])
        except Exception as e:
            return Response(status=418, data={ "error": str(e) })
        return Response(query_result)
    
    @action(detail=False, methods=["GET"])
    def hostname(self, request: Request):
        return Response({ "hostname": ch_host })

    @action(detail=True, methods=["GET"])
    def schema(self, request: Request, pk: str):
        query_result = run_query(SCHEMA_SQL, {'table': pk})
        return Response(query_result)
    
    @action(detail=True, methods=["GET"])
    def parts(self, request: Request, pk: str):
        query_result = run_query(PARTS_SQL, {'table': pk})
        return Response(query_result)

    @action(detail=False, methods=["GET"])
    def query_load(self, request: Request):
        params = { 
             
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
            
            "date_from": "now() - INTERVAL 2 WEEK"
        }
        
        query_result = run_query(ERRORS_SQL, params)
    
        return Response(query_result)

    
    @action(detail=False, methods=["GET"])
    def running_queries(self, request: Request):
        query_result = run_query(RUNNING_QUERIES_SQL)

        return Response(query_result)
    


    @action(detail=True, methods=["POST"])
    def kill_query(self, request: Request, pk: str):
        query_result = run_query(KILL_QUERY_SQL, {'query_id': request.data['query_id']})
        return Response(query_result)
    

    @action(detail=False, methods=["GET"])
    def page_cache(self, request: Request):
        params = {  "limit": 100, "date_to": "now()", "date_from": "now() - INTERVAL 2 WEEK"}
        query_result = run_query(PAGE_CACHE_HIT_PERCENTAGE_SQL, params)
    
        return Response(query_result)
    
    
    @action(detail=False, methods=["GET"])
    def cluster_overview(self, request: Request):
        params = {  "limit": 100, "date_to": "now()", "date_from": "now() - INTERVAL 2 WEEK"}
        data_transfer_query_result = run_query(NODE_DATA_TRANSFER_ACROSS_SHARDS_SQL, {})
        storage_query_result = run_query(NODE_STORAGE_SQL, {})
        
        full_result = []
        for i in range(len(storage_query_result)):
            node_result = { **data_transfer_query_result[i], **storage_query_result[i] }
            full_result.append(node_result)

        return Response(full_result)
