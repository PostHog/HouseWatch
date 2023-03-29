# TODO: Add enum mapping dict for query `type`
SLOW_QUERIES_SQL = """
    SELECT toUInt8(type) as query_type, query, query_duration_ms 
    FROM clusterAllReplicas(%(cluster)s, system.query_log) 
    WHERE is_initial_query AND event_time > %(date_from)s
    ORDER BY query_duration_ms DESC
    LIMIT %(limit)s
"""

SCHEMA_SQL = """
SELECT name, formatReadableSize(total_bytes) as readable_bytes, total_bytes, total_rows FROM system.tables ORDER BY total_bytes DESC
"""

PAGE_CACHE_SQL = """
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
"""