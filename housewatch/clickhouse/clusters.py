from collections import defaultdict
from housewatch.clickhouse.client import run_query


def get_clusters():
    QUERY = """Select cluster, shard_num, shard_weight, replica_num, host_name, host_address, port, is_local, user, default_database, errors_count, slowdowns_count, estimated_recovery_time FROM system.clusters"""
    res = run_query(QUERY)
    clusters = defaultdict(list)
    for c_node in res:
        clusters[c_node["cluster"]].append(c_node)
    accumulator = []
    for cluster, nodes in clusters.items():
        accumulator.append({"cluster": cluster, "nodes": nodes})
    return accumulator


def get_cluster(cluster):
    QUERY = """Select cluster, shard_num, shard_weight, replica_num, host_name, host_address, port, is_local, user, default_database, errors_count, slowdowns_count, estimated_recovery_time FROM system.clusters WHERE cluster = '%(cluster_name)s' """
    return run_query(QUERY, {"cluster_name": cluster})


def get_shards(cluster):
    cluster = get_cluster(cluster)
    nodes = defaultdict(list)
    for node in cluster:
        nodes[node["shard_number"]].append(node)
    return nodes


def get_node_per_shard(cluster):
    shards = get_shards(cluster)
    nodes = []
    for shard, n in shards.items():
        nodes.append((shard, n[0]))
    return nodes
