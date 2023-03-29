# TODO: Add enum mapping dict for query `type`
SLOW_QUERIES_SQL = """
SELECT toUInt8(type) as query_type, query, query_duration_ms 
FROM clusterAllReplicas(%(cluster)s, system.query_log) 
WHERE is_initial_query AND event_time > %(date_from)s
ORDER BY query_duration_ms DESC
LIMIT %(limit)s
"""

# TODO: Consider ThreadPoolReaderPageCacheHit and ThreadPoolReaderPageCacheMiss
PAGE_CACHE_HIT_PERCENTAGE_SQL = """
SELECT
    getMacro('replica') replica,
    (sum(ProfileEvents['OSReadChars']) - sum(ProfileEvents['OSReadBytes'])) / sum(ProfileEvents['OSReadChars']) AS page_cache_read_ratio
FROM clusterAllReplicas(%(cluster)s, system.query_log)
WHERE 
    event_time >= toDateTime(%(date_from)s)
    AND event_time <= toDateTime(%(date_to)s) 
    AND type > 1
    AND is_initial_query 
GROUP BY replica
ORDER BY replica
"""

QUERY_LOAD_SQL = """
SELECT toStartOfDay(event_time) as day, %(math_func)s(%(load_metric)s) AS %(column_alias)s
FROM clusterAllReplicas(%(cluster)s, system.query_log)
WHERE
    event_time >= toDateTime(%(date_from)s)
    AND event_time <= toDateTime(%(date_to)s) 
GROUP BY day
ORDER BY day
"""

ERRORS_SQL = """
SELECT name, count() count, max(last_error_time) max_last_error_time
FROM clusterAllReplicas(%(cluster)s, system.errors)
WHERE last_error_time > %(date_from)s
GROUP BY name
ORDER BY count DESC
"""
