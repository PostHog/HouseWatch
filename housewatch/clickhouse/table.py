from housewatch.clickhouse.client import run_query


def is_replicated_table(database, table):
    QUERY = """SELECT is_replicated FROM system.tables WHERE database = '%(database)s' AND name = '%(table)s'"""
    return "replicated" in run_query(QUERY, {"database": database, "table": table})[0]["engine"].lower()
