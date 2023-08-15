export const clickhouseTips = [
    `Consider benchmarking different join algorithms if your queries contain expensive joins. You may find that algorithms other than the default perform significantly better for your workloads.`,
    `If you store JSON data in a VARCHAR column, consider materializing frequently acessed properties using materialized columns for much faster queries.`,
    `You can use the log_comment setting to add metadata to queries that will show up on the query log, including on distributed queries. For instance, you can add a stringified JSON object as a comment to tag queries for analysis.`,
    `Dictionaries can be an effective tool in large data migrations or backfills.`,
    `Make sure you push as many of your query filters down to the innermost subquery for better performance. Unlike other databases, ClickHouse does not have a query planner, so you want to minimize the amount of data fetched from other shards.`,
    `If a column stores values with low cardinality (e.g. country codes), use the LowCardinality data type to improve performance and reduce storage usage. A low cardinality VARCHAR would be defined as LowCardinality(VARCHAR) in the table creation query.`,
    `quantile is not an exact function but rather a sampled approximation. Use quantileExactExclusive for exact results.`,
    `ClickHouse is great at introspection, and its system tables contain a lot of metadata about the server. Learning what information is available where can be a great tool in debugging issues and mapping out areas of improvement. A lot of HouseWatch features are effectively wrappers over ClickHouse system tables.`,
    `Killing a mutation with KILL MUTATION does not kill ongoing merges triggered by the mutation. If you absolutely need to stop ongoing merges as well, you should use SYSTEM STOP MERGES. However, you should not keep merges off for too long, as you may end up with too many parts unmerged, which is problematic for ClickHouse.`,
    `Set mutations_sync=2 on a mutation to wait for all replicas to complete the mutation.`,
    `ClickHouse does not support changing table engines in place, requiring you thus to create a new table and move data to it. However, rather than using INSERT to move the data over, you can use ATTACH PARTITION for near-instant operations instead, provided the tables contain the same "structure" i.e. same columns/ORDER BY/PARTITION BY.`,
    `Consider benchmarking different compression algorithms for large columns for more efficient queries and storage usage.`,
]
