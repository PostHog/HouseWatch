from typing import Dict
from clickhouse_pool import ChPool
import os
from housewatch.clickhouse.queries.sql import EXISTING_TABLES_SQL

ch_host = os.getenv("CLICKHOUSE_HOST", "localhost")
ch_verify = os.getenv("CLICKHOUSE_VERIFY", True)
ch_ca = os.getenv("CLICKHOUSE_CA", None)
ch_secure = os.getenv("CLICKHOUSE_SECURE", True)

pool = ChPool(
    host=ch_host,
    database=os.getenv("CLICKHOUSE_DATABASE", "default"),
    user=os.getenv("CLICKHOUSE_USER", "default"),
    password=os.getenv("CLICKHOUSE_PASSWORD", ""),
    secure=ch_secure if ch_secure != "" else True,
    ca_certs=ch_ca if ch_ca != "" else None,
    verify=ch_verify if ch_verify != "" else True,
    settings={"max_result_rows": "2000"},
    send_receive_timeout=30,
)


def run_query(query: str, params: Dict[str, str | int] = {}, settings: Dict[str, str | int] = {}):
    with pool.get_client() as client:
        result = client.execute(query % (params or {}), settings=settings, with_column_types=True)
        response = []
        for res in result[0]:
            item = {}
            for index, key in enumerate(result[1]):
                item[key[0]] = res[index]

            response.append(item)
        return response


existing_system_tables = [row["name"] for row in run_query(EXISTING_TABLES_SQL)]
