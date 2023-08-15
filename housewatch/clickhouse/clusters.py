from collections import defaultdict
from housewatch.clickhouse.client import run_query


def get_clusters():
    QUERY = """Select * FROM system.clusters"""
    res = run_query(QUERY)
    clusters = defaultdict(list)
    for c_node in res:
        clusters[c_node["cluster"]].append(c_node)
    accumulator = []
    for cluster, nodes in clusters.items():
        accumulator.append({"cluster": cluster, "nodes": nodes})
    return accumulator


def get_cluster(cluster):
    QUERY = """Select * FROM system.clusters WHERE cluster = '%(cluster_name)s' """
    return run_query(QUERY, {"cluster_name": cluster})
