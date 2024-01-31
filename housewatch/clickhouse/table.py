from housewatch.clickhouse.client import run_query


def is_replicated_table(database, table):
    QUERY = """SELECT engine FROM system.tables WHERE database = '%(database)s' AND name = '%(table)s'"""
    return "replicated" in run_query(QUERY, {"database": database, "table": table})[0]["engine"].lower()


def table_engine_full(database, table):
    QUERY = """SELECT engine_full FROM system.tables WHERE database = '%(database)s' AND name = '%(table)s'"""
    return run_query(QUERY, {"database": database, "table": table})[0]["engine_full"]


def parse_engine(engine_full):
    engine = engine_full.split("(")[0].strip()
    params = engine_full.split("(")[1].split(")")[0].split(",")
    return engine, params


def is_sharded_table(database, table):
    return "sharded" in table_engine_full(database, table).lower()
