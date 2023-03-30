# TODO: Add enum mapping dict for query `type`
SLOW_QUERIES_SQL = """

SELECT
    normalizeQuery(query) as normalized_query,
    avg(query_duration_ms) as avg_duration,
    avg(result_rows),
    count(1)/date_diff('minute', %(date_from)s, now()) as calls_per_minute,
    count(1),
    formatReadableSize(sum(read_bytes)) as total_read_bytes,
    (sum(read_bytes)/(sum(sum(read_bytes)) over ()))*100 as percentage_iops,
    (sum(query_duration_ms)/(sum(sum(query_duration_ms)) over ()))*100 as percentage_runtime,
    toString(normalized_query_hash) as normalized_query_hash
FROM clusterAllReplicas(%(cluster)s, system.query_log) 
WHERE is_initial_query AND event_time > %(date_from)s and type = 2
group by normalized_query_hash, normalizeQuery(query)
ORDER BY sum(read_bytes) DESC
LIMIT %(limit)s
"""

# TODO: Consider ThreadPoolReaderPageCacheHit and ThreadPoolReaderPageCacheMiss
PAGE_CACHE_HIT_PERCENTAGE_SQL = """
SELECT
    getMacro('replica') node,
    (sum(ProfileEvents['OSReadChars']) - sum(ProfileEvents['OSReadBytes'])) / sum(ProfileEvents['OSReadChars']) AS page_cache_read_ratio
FROM clusterAllReplicas(%(cluster)s, system.query_log)
WHERE 
    event_time >= toDateTime(%(date_from)s)
    AND event_time <= toDateTime(%(date_to)s) 
    AND type > 1
    AND is_initial_query 
GROUP BY node
ORDER BY node
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

TABLES_SQL = """
SELECT name, formatReadableSize(total_bytes) as readable_bytes, total_bytes, total_rows FROM system.tables ORDER BY total_bytes DESC
"""

SCHEMA_SQL = """
SELECT table, name as column, data_compressed_bytes as compressed, formatReadableSize(data_compressed_bytes) as compressed_readable, formatReadableSize(data_uncompressed_bytes) as uncompressed FROM system.columns
WHERE table = '%(table)s'
GROUP BY table, column, data_compressed_bytes, data_uncompressed_bytes
ORDER BY data_compressed_bytes DESC
LIMIT 100
"""

PARTS_SQL = """
SELECT name as part, data_compressed_bytes as compressed, formatReadableSize(data_compressed_bytes) AS compressed_readable, formatReadableSize(data_uncompressed_bytes) as uncompressed
FROM system.parts
WHERE table = '%(table)s'
ORDER BY data_compressed_bytes DESC 
LIMIT 100
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

GET_QUERY_BY_NORMALIZED_HASH_SQL = """
SELECT normalizeQuery(query) as normalized_query FROM
clusterAllReplicas('posthog', system,query_log)
where normalized_query_hash = %(normalized_query_hash)s
limit 1
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
ORDER BY toStartOfHour(query_start_time) ASC
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
ORDER BY toStartOfHour(query_start_time) ASC
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
ORDER BY toStartOfHour(query_start_time) ASC
"""

RUNNING_QUERIES_SQL = """
SELECT query, elapsed, read_rows, total_rows_approx, formatReadableSize(memory_usage) as memory_usage, query_id FROM system.processes ORDER BY elapsed DESC
"""

KILL_QUERY_SQL = """
    KILL QUERY where query_id = '%(query_id)s'
"""

NODE_STORAGE_SQL = """
select 
    getMacro('replica') node, 
    sum(total_space) space_used, 
    sum(free_space) free_space, 
    (space_used + free_space) total_space_available,
    formatReadableSize(total_space_available) readable_total_space_available,
    formatReadableSize(space_used) readable_space_used,
    formatReadableSize(free_space) readable_free_space
from clusterAllReplicas('posthog', system.disks)
where type = 'local'
group by node
order by node
"""

NODE_DATA_TRANSFER_ACROSS_SHARDS_SQL = """
select getMacro('replica') node, sum(read_bytes) total_bytes_transferred, formatReadableSize(total_bytes_transferred) as readable_bytes_transferred
from clusterAllReplicas('posthog', system.query_log)
where is_initial_query != 0 and type = 2 
group by node
order by node
"""