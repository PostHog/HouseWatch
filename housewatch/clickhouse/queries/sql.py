import os

ch_cluster = os.getenv("CLICKHOUSE_CLUSTER", None)

QUERY_LOG_SYSTEM_TABLE = f"clusterAllReplicas({ch_cluster}, system.query_log)" if ch_cluster else "system.query_log"
TEXT_LOG_SYSTEM_TABLE = f"clusterAllReplicas({ch_cluster}, system.text_log)" if ch_cluster else "system.text"
ERRORS_SYSTEM_TABLE = f"clusterAllReplicas({ch_cluster}, system.errors)" if ch_cluster else "system.errors"
DISKS_SYSTEM_TABLE = f"clusterAllReplicas({ch_cluster}, system.disks)" if ch_cluster else "system.disks"


# TODO: Add enum mapping dict for query `type`
SLOW_QUERIES_SQL = f"""
SELECT
    normalizeQuery(query) AS normalized_query,
    avg(query_duration_ms) AS avg_duration,
    avg(result_rows),
    count(1)/date_diff('minute', %(date_from)s, now()) AS calls_per_minute,
    count(1),
    formatReadableSize(sum(read_bytes)) AS total_read_bytes,
    (sum(read_bytes)/(sum(sum(read_bytes)) over ()))*100 AS percentage_iops,
    (sum(query_duration_ms)/(sum(sum(query_duration_ms)) over ()))*100 AS percentage_runtime,
    toString(normalized_query_hash) AS normalized_query_hash
FROM {QUERY_LOG_SYSTEM_TABLE} 
WHERE is_initial_query AND event_time > %(date_from)s AND type = 2
GROUP BY normalized_query_hash, normalizeQuery(query)
ORDER BY sum(read_bytes) DESC
LIMIT %(limit)s
"""


QUERY_LOAD_SQL = f"""
SELECT toStartOfDay(event_time) AS day, %(math_func)s(%(load_metric)s) AS %(column_alias)s
FROM {QUERY_LOG_SYSTEM_TABLE}
WHERE
    event_time >= toDateTime(%(date_from)s)
    AND event_time <= toDateTime(%(date_to)s) 
GROUP BY day
ORDER BY day
"""

ERRORS_SQL = f"""
SELECT name, count() count, max(last_error_time) max_last_error_time
FROM {ERRORS_SYSTEM_TABLE}
WHERE last_error_time > %(date_from)s
GROUP BY name
ORDER BY count DESC
"""

TABLES_SQL = """
SELECT
    name,
    formatReadableSize(total_bytes) AS readable_bytes,
    total_bytes,
    total_rows,
    engine,
    partition_key
FROM system.tables ORDER BY total_bytes DESC
"""

SCHEMA_SQL = """
SELECT
    table,
    name AS column,
    type,
    data_compressed_bytes AS compressed,
    formatReadableSize(data_compressed_bytes) AS compressed_readable,
    formatReadableSize(data_uncompressed_bytes) AS uncompressed
FROM system.columns
WHERE table = '%(table)s'
ORDER BY data_compressed_bytes DESC
LIMIT 100
"""

PARTS_SQL = """
SELECT name AS part, data_compressed_bytes AS compressed, formatReadableSize(data_compressed_bytes) AS compressed_readable, formatReadableSize(data_uncompressed_bytes) AS uncompressed
FROM system.parts
WHERE table = '%(table)s'
ORDER BY data_compressed_bytes DESC 
LIMIT 100
"""


GET_QUERY_BY_NORMALIZED_HASH_SQL = f"""
SELECT normalizeQuery(query) AS normalized_query, groupUniqArray(10)(query) AS example_queries FROM
{QUERY_LOG_SYSTEM_TABLE}
WHERE normalized_query_hash = %(normalized_query_hash)s
GROUP BY normalized_query
limit 1
"""

EXPLAIN_QUERY = """
EXPLAIN header=1, indexes=1
%(query)s
"""

QUERY_EXECUTION_COUNT_SQL = f"""
SELECT day_start, sum(total) AS total FROM (
    SELECT
        0 AS total,
        toStartOfDay(now() - toIntervalDay(number)) AS day_start
    FROM numbers(dateDiff('day', toStartOfDay(now()  - INTERVAL %(days)s day), now()))
    UNION ALL
    SELECT
        count(*) AS total,
        toStartOfDay(query_start_time) AS day_start
    FROM
        {QUERY_LOG_SYSTEM_TABLE}
    WHERE
        query_start_time > now() - INTERVAL %(days)s day AND type = 2 AND is_initial_query %(conditions)s
    GROUP BY day_start
)
GROUP BY day_start
ORDER BY day_start asc
"""

QUERY_MEMORY_USAGE_SQL = f"""
SELECT day_start, sum(total) AS total FROM (
    SELECT
        0 AS total,
        toStartOfDay(now() - toIntervalDay(number)) AS day_start
    FROM numbers(dateDiff('day', toStartOfDay(now()  - INTERVAL %(days)s day), now()))
    UNION ALL

    SELECT
        sum(memory_usage) AS total,
        toStartOfDay(query_start_time) AS day_start
    FROM
        {QUERY_LOG_SYSTEM_TABLE}
    WHERE
        event_time > now() - INTERVAL 12 day AND type = 2 AND is_initial_query %(conditions)s
    GROUP BY day_start
)
GROUP BY day_start
ORDER BY day_start ASC
"""

QUERY_CPU_USAGE_SQL = f"""
SELECT day_start, sum(total) AS total FROM (
    SELECT
        0 AS total,
        toStartOfDay(now() - toIntervalDay(number)) AS day_start
    FROM numbers(dateDiff('day', toStartOfDay(now()  - INTERVAL %(days)s day), now()))
    UNION ALL
    SELECT
        sum(ProfileEvents['OSCPUVirtualTimeMicroseconds']) AS total,
        toStartOfDay(query_start_time) AS day_start
    FROM
        {QUERY_LOG_SYSTEM_TABLE}
    WHERE
        event_time > now() - INTERVAL 12 day AND type = 2 AND is_initial_query %(conditions)s
    GROUP BY day_start
)
GROUP BY day_start
ORDER BY day_start ASC
"""

QUERY_READ_BYTES_SQL = f"""
SELECT day_start, sum(total) AS total FROM (
    SELECT
        0 AS total,
        toStartOfDay(now() - toIntervalDay(number)) AS day_start
    FROM numbers(dateDiff('day', toStartOfDay(now()  - INTERVAL %(days)s day), now()))
    UNION ALL

    SELECT
        sum(read_bytes) AS total,
        toStartOfDay(query_start_time) AS day_start
    FROM
        {QUERY_LOG_SYSTEM_TABLE}
    WHERE
        event_time > now() - INTERVAL 12 day AND type = 2 AND is_initial_query %(conditions)s
    GROUP BY day_start
)
GROUP BY day_start
ORDER BY day_start ASC
"""

RUNNING_QUERIES_SQL = """
SELECT query, elapsed, read_rows, total_rows_approx, formatReadableSize(memory_usage) AS memory_usage, query_id 
FROM system.processes
WHERE Settings['log_comment'] != 'running_queries_lookup'
ORDER BY elapsed DESC
SETTINGS log_comment = 'running_queries_lookup'
"""

KILL_QUERY_SQL = """
KILL QUERY WHERE query_id = '%(query_id)s'
"""

NODE_STORAGE_SQL = f"""
SELECT 
    hostName() node, 
    sum(total_space) space_used, 
    sum(free_space) free_space, 
    (space_used + free_space) total_space_available,
    formatReadableSize(total_space_available) readable_total_space_available,
    formatReadableSize(space_used) readable_space_used,
    formatReadableSize(free_space) readable_free_space
FROM {DISKS_SYSTEM_TABLE}
WHERE type = 'local'
GROUP BY node
ORDER BY node
"""

NODE_DATA_TRANSFER_ACROSS_SHARDS_SQL = f"""
SELECT hostName() node, sum(read_bytes) total_bytes_transferred, formatReadableSize(total_bytes_transferred) AS readable_bytes_transferred
FROM {QUERY_LOG_SYSTEM_TABLE}
WHERE is_initial_query != 0 AND type = 2 
GROUP BY node
ORDER BY node
"""

LOGS_SQL = f"""
SELECT event_time, toString(level) level, hostName() hostname, message
FROM {TEXT_LOG_SYSTEM_TABLE}
WHERE message ILIKE '%(message)s'
ORDER BY event_time DESC
LIMIT 100
"""

EXISTING_TABLES_SQL = """
SELECT name
FROM system.tables
WHERE database = 'system'
"""

LOGS_FREQUENCY_SQL = f"""
SELECT hour, sum(total) AS total FROM (
    SELECT
        toStartOfHour(now() - toIntervalHour(number)) AS hour,
        0 AS total
    FROM numbers(dateDiff('hour', toStartOfHour(now()  - INTERVAL 3 day), now()))
    GROUP BY hour
    UNION ALL
    SELECT toStartOfHour(event_time) hour, count() total
    FROM {TEXT_LOG_SYSTEM_TABLE}
    WHERE event_time > now() - INTERVAL 3 day AND message ILIKE '%(message)s'
    GROUP BY hour
)
GROUP BY hour
ORDER BY hour
"""

BENCHMARKING_SQL = f"""
SELECT
    if(log_comment = '%(query1_tag)s', 'Control', 'Test') AS query_version,
    sumIf(query_duration_ms, is_initial_query) AS duration_ms, 
    sumIf(memory_usage, is_initial_query) AS memory_usage, 
    sumIf(ProfileEvents['OSCPUVirtualTimeMicroseconds'], is_initial_query) AS cpu,
    sumIf(read_bytes, is_initial_query) AS read_bytes,
    sumIf(read_rows, NOT is_initial_query) AS read_bytes_from_other_shards,
    sumIf(ProfileEvents['NetworkReceiveBytes'], is_initial_query) AS network_receive_bytes
FROM {QUERY_LOG_SYSTEM_TABLE}
WHERE 
    type = 2 
    AND event_time > now() - INTERVAL 10 MINUTE 
    AND (log_comment = '%(query1_tag)s' OR log_comment = '%(query2_tag)s')
GROUP BY query_version
ORDER BY query_version
"""

AVAILABLE_TABLES_SQL = """
SELECT database, table
FROM system.tables 
WHERE database != 'system' AND database NOT ILIKE 'information_schema'
"""