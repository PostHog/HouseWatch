from rest_framework.viewsets import GenericViewSet
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.decorators import action
from housewatch.clickhouse.client import client, base_params
from housewatch.clickhouse.queries.sql import SLOW_QUERIES_SQL

class AnalyzeViewset(GenericViewSet):
    def list(self, request: Request) -> Response:
        pass

    @action(detail=False, methods=["GET"])
    def slow_queries(self, request: Request):
        params = { **base_params, "limit": 100, "date_from": "now() - INTERVAL 2 WEEK"}
        query_result = client.execute(SLOW_QUERIES_SQL % params)

    
        return Response(query_result)

    @action(detail=False, methods=["GET"])
    def page_cache(self, request: Request):
        ddd = client.execute("""
with 
    toDateTime( now() ) as target_time, 
    toIntervalDay( 14 ) as interval
select
    getMacro('replica') replica,
    (sum(ProfileEvents['OSReadChars']) - sum(ProfileEvents['OSReadBytes'])) / sum(ProfileEvents['OSReadChars']) AS page_cache_read_ratio
from clusterAllReplicas('posthog', system,query_log)
where 
    event_time >= target_time - interval 
    and event_time <= target_time 
    and type > 1 
    and is_initial_query 
    and JSONExtractString(log_comment, 'kind') = 'request'
group by replica
order by replica
        """)

    
        return Response(ddd)