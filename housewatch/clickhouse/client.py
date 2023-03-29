from clickhouse_driver import Client
import os
    
client = Client(
    host=os.getenv("CLICKHOUSE_HOST", "localhost"),
    database=os.getenv("CLICKHOUSE_DATABASE", ""),
    secure=os.getenv("CLICKHOUSE_SECURE", ""),
    user=os.getenv("CLICKHOUSE_USER", "default"),
    password=os.getenv("CLICKHOUSE_PASSWORD", ""),
    ca_certs=os.getenv("CLICKHOUSE_CA", None),
    verify=os.getenv("CLICKHOUSE_VERIFY", True),
    settings={"max_result_rows": "10000"},
)