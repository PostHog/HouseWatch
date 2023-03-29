# TODO: Add enum mapping dict for query `type`
SLOW_QUERIES_SQL = """
    SELECT toUInt8(type) as query_type, query, query_duration_ms 
    FROM clusterAllReplicas(%(cluster)s, system.query_log) 
    WHERE is_initial_query AND event_time > %(date_from)s
    ORDER BY query_duration_ms DESC
    LIMIT %(limit)s
"""
