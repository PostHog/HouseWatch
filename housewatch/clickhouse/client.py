from typing import Dict, Optional
from clickhouse_pool import ChPool
import os
from housewatch.clickhouse.queries.sql import EXISTING_TABLES_SQL
from django.core.cache import cache
import hashlib
import json


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


def run_query(
    query: str,
    params: Dict[str, str | int] = {},
    settings: Dict[str, str | int] = {},
    query_id: Optional[str] = None,
    use_cache: bool = True,  # defaulting to True for now for simplicity, but ideally we should default this to False
    substitute_params: bool = True
):
    query_hash = ""
    if use_cache:
        query_hash = hashlib.sha256(query.encode("utf-8")).hexdigest()
        cached_result = cache.get(query_hash)
        if cached_result:
            return json.loads(cached_result)
    with pool.get_client() as client:
        final_query = query % (params or {}) if substitute_params else query
        result = client.execute(final_query, settings=settings, with_column_types=True, query_id=query_id)
        response = []
        for res in result[0]:
            item = {}
            for index, key in enumerate(result[1]):
                item[key[0]] = res[index]

            response.append(item)
        if use_cache:
            cache.set(query_hash, json.dumps(response, default=str), timeout=60 * 5)
        return response


existing_system_tables = [row["name"] for row in run_query(EXISTING_TABLES_SQL, use_cache=False)]
