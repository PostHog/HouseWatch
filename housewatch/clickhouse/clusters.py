from housewatch.clickhouse.client import run_query


def get_clusters():
    QUERY = """Select cluster FROM system.clusters GROUP BY cluster"""
    return run_query(QUERY)


def get_cluster(cluster):
    QUERY = """Select * FROM system.clusters WHERE cluster = '%(cluster_name)s' """
    return run_query(QUERY, {"cluster_name": cluster})
