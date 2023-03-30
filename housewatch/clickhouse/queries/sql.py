# TODO: Add enum mapping dict for query `type`
SLOW_QUERIES_SQL = """
    SELECT toUInt8(type) as query_type, query, query_duration_ms, result_rows, formatReadableSize(result_bytes) as readable_bytes, toString(normalized_query_hash)
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

SLOW_QUERIES_BY_HASH_SQL = """
    SELECT any(query), avg(query_duration_ms) avg_query_duration, avg(result_rows) avg_result_rows, formatReadableSize(avg(result_bytes)) as avg_readable_bytes, toString(normalized_query_hash)
    FROM clusterAllReplicas(%(cluster)s, system.query_log) 
    WHERE is_initial_query AND event_time > %(date_from)s
    GROUP BY normalized_query_hash
    ORDER BY avg_query_duration DESC
    LIMIT %(limit)s
"""

TABLES_SQL = """
SELECT name, formatReadableSize(total_bytes) as readable_bytes, total_bytes, total_rows FROM system.tables ORDER BY total_bytes DESC
"""

SCHEMA_SQL = """
SELECT table, name as column, data_compressed_bytes, formatReadableSize(data_compressed_bytes) as compressed, formatReadableSize(data_uncompressed_bytes) as uncompressed FROM system.columns
WHERE table = '%(table)s'
GROUP BY table, column, data_compressed_bytes, data_uncompressed_bytes
ORDER BY data_compressed_bytes DESC LIMIT 100
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

QUERY_EXECUTION_COUNT_SQL = """
SELECT
    toUInt16(0) AS total,
    toStartOfHour(now() - toIntervalHour(number)) AS day_start
FROM numbers(dateDiff('hour', toStartOfHour(now()  - interval {hours} hour), now()))
UNION ALL

SELECT
    count(1) as total,
    toStartOfHour(query_start_time) as day_start
FROM
    clusterAllReplicas('posthog', system.query_log) 
WHERE
    query_start_time > now() - interval {hours} hour and type = 2 and is_initial_query {conditions}
GROUP BY toStartOfHour(query_start_time)
ORDER BY toStartOfHour(query_start_time) DESC
"""

QUERY_MEMORY_USAGE_SQL = """
SELECT
    toUInt16(0) AS total,
    '' AS total_readable,
    toStartOfHour(now() - toIntervalHour(number)) AS day_start
FROM numbers(dateDiff('hour', toStartOfHour(now()  - interval {hours} hour), now()))
UNION ALL

SELECT
    sum(memory_usage) as total,
    formatReadableSize(sum(memory_usage)) as total_readable,
    toStartOfHour(query_start_time) as day_start
FROM
    clusterAllReplicas('posthog', system.query_log) 
WHERE
    event_time > now() - interval 12 hour and type = 2 and is_initial_query {conditions}
GROUP BY toStartOfHour(query_start_time)
ORDER BY toStartOfHour(query_start_time) DESC
"""

QUERY_READ_BYTES_SQL = """
SELECT
    toUInt16(0) AS total,
    '' AS total_readable,
    toStartOfHour(now() - toIntervalHour(number)) AS day_start
FROM numbers(dateDiff('hour', toStartOfHour(now()  - interval {hours} hour), now()))
UNION ALL

SELECT
    sum(read_bytes) as total,
    formatReadableSize(sum(read_bytes)) as total_readable,
    toStartOfHour(query_start_time) as day_start
FROM
    clusterAllReplicas('posthog', system.query_log) 
WHERE
    event_time > now() - interval 12 hour and type = 2 and is_initial_query {conditions}
GROUP BY toStartOfHour(query_start_time)
ORDER BY toStartOfHour(query_start_time) DESC
"""