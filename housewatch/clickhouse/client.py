from clickhouse_driver import Client
import os
    
client = Client(
    host=os.getenv("CLICKHOUSE_HOST", "localhost"),
    database=os.getenv("CLICKHOUSE_DATABASE", "default"),
    secure=os.getenv("CLICKHOUSE_SECURE", ""),
    user=os.getenv("CLICKHOUSE_USER", "default"),
    password=os.getenv("CLICKHOUSE_PASSWORD", ""),
    ca_certs=os.getenv("CLICKHOUSE_CA", None),
    verify=os.getenv("CLICKHOUSE_VERIFY", True),
    settings={"max_result_rows": "10000"},
)

def run_query(query: str):
    result = client.execute(query,  with_column_types=True)
    response = []
    for res in result[0]:
        item = {}
        for index, key in enumerate(result[1]):
            item[key[0]] = res[index]
        
        response.append(item)
    return response