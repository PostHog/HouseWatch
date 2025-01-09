import random
from collections import defaultdict
from housewatch.clickhouse.client import run_query

from housewatch.models.preferred_replica import PreferredReplica


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
        nodes[node["shard_num"]].append(node)
    return nodes


def get_node_per_shard(cluster):
    # We want to return a node per shard, but if we have preferred replicas we should use those

    shards = get_shards(cluster)
    nodes = []

    preferred = PreferredReplica.objects.filter(cluster=cluster).values_list("replica", flat=True)
    for shard, n in shards.items():
        preferred_replica_found = False
        # shuffle the nodes so we don't always pick the first preferred one
        random.shuffle(n)
        for node in n:
            if node["host_name"] in preferred:
                nodes.append((shard, node))
                preferred_replica_found = True
                break
        if not preferred_replica_found:
            nodes.append((shard, random.choice(n)))
    random.shuffle(nodes)
    return nodes

def get_all_replica_hosts(cluster):
    QUERY = """
    SELECT host_name
    FROM system.clusters
    WHERE cluster = '%(cluster_name)s' """
    return run_query(QUERY, params={"cluster_name": cluster})


def get_replication_queues(cluster):
    nodes = get_all_replica_hosts(cluster)
    for node in nodes:
        yield get_replication_queue(node)


def get_replication_queue(node):
    QUERY = """
    SELECT
    database,
    table,
    replica_name,
    position,
    node_name,
    type,
    create_time,
    required_quorum,
    source_replica,
    new_part_name,
    parts_to_merge,
    is_detach,
    is_currently_executing,
    num_tries,
    last_exception,
    last_attempt_time,
    last_postpone_time,
    postpone_reason,
    last_postpone_time,
    merge_type
    FROM system.replication_queue
    WHERE last_exception != '' or postpone_reason != ''
    ORDER BY create_time desc
    LIMIT 100
    """
    return run_query(QUERY, node=node)
