# TODO: Add enum mapping dict for query `type`
SLOW_QUERIES_SQL = """
SELECT toUInt8(type) as query_type, query, query_duration_ms 
FROM clusterAllReplicas(%(cluster)s, system.query_log) 
WHERE is_initial_query AND event_time > %(date_from)s
ORDER BY query_duration_ms DESC
LIMIT %(limit)s
"""

PAGE_CACHE_HIT_PERCENTAGE_SQL = """
WITH 
    toDateTime(%(date_to)s) AS date_to, 
    toDateTime(%(date_from)s) AS date_from, 
SELECT
    getMacro('replica') replica,
    (sum(ProfileEvents['OSReadChars']) - sum(ProfileEvents['OSReadBytes'])) / sum(ProfileEvents['OSReadChars']) AS page_cache_read_ratio
FROM clusterAllReplicas(%(cluster)s, system.query_log)
WHERE 
    event_time >= date_from
    AND event_time <= date_to 
    AND type > 1 
    AND is_initial_query 
    AND JSONExtractString(log_comment, 'kind') = 'request'
GROUP BY replica
ORDER BY replica
"""