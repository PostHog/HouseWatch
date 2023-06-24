from rest_framework.viewsets import GenericViewSet
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.decorators import action

from django.conf import settings

from housewatch.clickhouse.client import run_query, existing_system_tables
from housewatch.clickhouse.queries.sql import (
    SLOW_QUERIES_SQL,
    SCHEMA_SQL,
    QUERY_EXECUTION_COUNT_SQL,
    QUERY_LOAD_SQL,
    ERRORS_SQL,
    QUERY_MEMORY_USAGE_SQL,
    QUERY_READ_BYTES_SQL,
    RUNNING_QUERIES_SQL,
    KILL_QUERY_SQL,
    PARTS_SQL,
    NODE_STORAGE_SQL,
    GET_QUERY_BY_NORMALIZED_HASH_SQL,
    QUERY_CPU_USAGE_SQL,
    LOGS_SQL,
    LOGS_FREQUENCY_SQL,
    EXPLAIN_QUERY,
    BENCHMARKING_SQL,
    AVAILABLE_TABLES_SQL,
    TABLE_SCHEMAS_SQL,
)
from uuid import uuid4
import json
from time import sleep
import os
import openai
from housewatch.ai.templates import (
    NATURAL_LANGUAGE_QUERY_SYSTEM_PROMPT,
    NATURAL_LANGUAGE_QUERY_USER_PROMPT,
    TABLE_PROMPT,
)

openai.api_key = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")

DEFAULT_DAYS = 7

TIME_RANGE_TO_CLICKHOUSE_INTERVAL = {
    "-1w": "INTERVAL 1 WEEK",
    "-2w": "INTERVAL 2 WEEK",
    "-1m": "INTERVAL 1 MONTH",
    "-3m": "INTERVAL 3 MONTH",
}


class AnalyzeViewset(GenericViewSet):
    def list(self, request: Request) -> Response:
        pass

    @action(detail=False, methods=["GET"])
    def slow_queries(self, request: Request):
        ch_interval = TIME_RANGE_TO_CLICKHOUSE_INTERVAL[request.GET.get("time_range", "-1w")]
        params = {"limit": 100, "date_from": f"now() - {ch_interval}"}
        query_result = run_query(SLOW_QUERIES_SQL, params)
        return Response(query_result)

    @action(detail=True, methods=["GET"])
    def query_normalized(self, request: Request, pk: str):
        query_details = run_query(GET_QUERY_BY_NORMALIZED_HASH_SQL, {"normalized_query_hash": pk})
        normalized_query = query_details[0]["normalized_query"]

        return Response(
            {
                "query": normalized_query,
            }
        )

    @action(detail=True, methods=["GET"])
    def query_metrics(self, request: Request, pk: str):
        days = request.GET.get("days", DEFAULT_DAYS)
        conditions = "AND event_time > now() - INTERVAL 1 WEEK AND toString(normalized_query_hash) = '{}'".format(pk)
        execution_count = run_query(QUERY_EXECUTION_COUNT_SQL, {"days": days, "conditions": conditions})
        memory_usage = run_query(QUERY_MEMORY_USAGE_SQL, {"days": days, "conditions": conditions})
        read_bytes = run_query(QUERY_READ_BYTES_SQL, {"days": days, "conditions": conditions})
        cpu = run_query(QUERY_CPU_USAGE_SQL, {"days": days, "conditions": conditions})

        return Response(
            {"execution_count": execution_count, "memory_usage": memory_usage, "read_bytes": read_bytes, "cpu": cpu}
        )

    @action(detail=True, methods=["GET"])
    def query_explain(self, request: Request, pk: str):
        query_details = run_query(GET_QUERY_BY_NORMALIZED_HASH_SQL, {"normalized_query_hash": pk})
        example_queries = query_details[0]["example_queries"]
        explain = run_query(EXPLAIN_QUERY, {"query": example_queries[0]})

        return Response(
            {
                "explain": explain,
            }
        )

    @action(detail=True, methods=["GET"])
    def query_examples(self, request: Request, pk: str):
        query_details = run_query(GET_QUERY_BY_NORMALIZED_HASH_SQL, {"normalized_query_hash": pk})
        example_queries = query_details[0]["example_queries"]

        return Response(
            {
                "example_queries": [{"query": q} for q in example_queries],
            }
        )

    @action(detail=False, methods=["GET"])
    def query_graphs(self, request: Request):
        days = request.GET.get("days", DEFAULT_DAYS)
        execution_count = run_query(QUERY_EXECUTION_COUNT_SQL, {"days": days, "conditions": ""})
        memory_usage = run_query(QUERY_MEMORY_USAGE_SQL, {"days": days, "conditions": ""})
        read_bytes = run_query(QUERY_READ_BYTES_SQL, {"days": days, "conditions": ""})
        cpu = run_query(QUERY_CPU_USAGE_SQL, {"days": days, "conditions": ""})
        return Response(
            {"execution_count": execution_count, "memory_usage": memory_usage, "read_bytes": read_bytes, "cpu": cpu}
        )

    @action(detail=False, methods=["POST"])
    def logs(self, request: Request):
        if "text_log" not in existing_system_tables:
            return Response(status=418, data={"error": "text_log table does not exist"})
        query_result = run_query(
            LOGS_SQL, {"message": f"%{request.data['message_ilike']}%" if request.data["message_ilike"] else "%"}
        )
        return Response(query_result)

    @action(detail=False, methods=["POST"])
    def logs_frequency(self, request: Request):
        if "text_log" not in existing_system_tables:
            return Response(status=418, data={"error": "text_log table does not exist"})
        query_result = run_query(
            LOGS_FREQUENCY_SQL,
            {"message": f"%{request.data['message_ilike']}%" if request.data["message_ilike"] else "%"},
        )
        return Response(query_result)

    @action(detail=False, methods=["POST"])
    def query(self, request: Request):
        query_id = request.data["query_id"] if "query_id" in request.data else None
        try:
            query_result = run_query(request.data["sql"], query_id=query_id, use_cache=False, substitute_params=False)
        except Exception as e:
            return Response(status=418, data={"error": str(e)})
        return Response({"result": query_result})

    @action(detail=False, methods=["GET"])
    def hostname(self, request: Request):
        return Response({"hostname": settings.CLICKHOUSE_HOST})

    @action(detail=True, methods=["GET"])
    def schema(self, request: Request, pk: str):
        query_result = run_query(SCHEMA_SQL, {"table": pk})
        return Response(query_result)

    @action(detail=True, methods=["GET"])
    def parts(self, request: Request, pk: str):
        query_result = run_query(PARTS_SQL, {"table": pk})
        return Response(query_result)

    @action(detail=False, methods=["GET"])
    def query_load(self, request: Request):
        params = {
            "column_alias": "average_query_duration",
            "math_func": "avg",
            "load_metric": "query_duration_ms",
            "date_to": "now()",
            "date_from": "now() - INTERVAL 2 WEEK",
        }

        query_result = run_query(QUERY_LOAD_SQL, params)

        return Response(query_result)

    @action(detail=False, methods=["GET"])
    def errors(self, request: Request):
        params = {"date_from": "now() - INTERVAL 2 WEEK"}

        query_result = run_query(ERRORS_SQL, params)

        return Response(query_result)

    @action(detail=False, methods=["GET"])
    def running_queries(self, request: Request):
        query_result = run_query(RUNNING_QUERIES_SQL, use_cache=False)

        return Response(query_result)

    @action(detail=True, methods=["POST"])
    def kill_query(self, request: Request, pk: str):
        query_result = run_query(KILL_QUERY_SQL, {"query_id": request.data["query_id"]}, use_cache=False)
        return Response(query_result)

    @action(detail=False, methods=["GET"])
    def cluster_overview(self, request: Request):
        storage_query_result = run_query(NODE_STORAGE_SQL, {})

        full_result = []
        for i in range(len(storage_query_result)):
            node_result = {**storage_query_result[i]}
            full_result.append(node_result)

        return Response(full_result)

    @action(detail=False, methods=["POST"])
    def benchmark(self, request: Request):
        query1_tag = f"benchmarking_q1_{str(uuid4())}"
        query2_tag = f"benchmarking_q2_{str(uuid4())}"

        error_location = None
        # we use min_bytes_to_use_direct_io to try to not use the page cache
        # docs: https://clickhouse.com/docs/en/operations/settings/settings#settings-min-bytes-to-use-direct-io
        # it's unclear how well this works so this needs digging (see https://github.com/ClickHouse/ClickHouse/issues/36301)
        try:
            error_location = "Control"
            query1_result = run_query(
                request.data["query1"],
                settings={"log_comment": query1_tag, "min_bytes_to_use_direct_io": 1},
                use_cache=False,
                substitute_params=False,
            )

            error_location = "Test"
            query2_result = run_query(
                request.data["query2"],
                settings={"log_comment": query2_tag, "min_bytes_to_use_direct_io": 1},
                use_cache=False,
                substitute_params=False,
            )

            error_location = "benchmark"
            is_result_equal = json.dumps(query1_result, default=str) == json.dumps(query2_result, default=str)

            # make sure the query log populates
            run_query("SYSTEM FLUSH LOGS")
            benchmarking_result = []
            i = 0
            while len(benchmarking_result) == 0 and i < 10:
                benchmarking_result = run_query(
                    BENCHMARKING_SQL, params={"query1_tag": query1_tag, "query2_tag": query2_tag}, use_cache=False
                )
                i += 1
                sleep(0.5)
            return Response({"is_result_equal": is_result_equal, "benchmarking_result": benchmarking_result})
        except Exception as e:
            return Response(status=418, data={"error": str(e), "error_location": error_location})

    @action(detail=False, methods=["GET"])
    def ai_tools_available(self, request: Request):
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            return Response(
                status=400,
                data={
                    "error": "OPENAI_API_KEY not set. To use the AI toolset you must pass in an OpenAI API key via the OPENAI_API_KEY environment variable."
                },
            )
        return Response({"status": "ok"})

    @action(detail=False, methods=["GET"])
    def tables(self, request: Request):
        query_result = run_query(AVAILABLE_TABLES_SQL, use_cache=False)
        return Response(query_result)

    @action(detail=False, methods=["POST"])
    def natural_language_query(self, request: Request):

        table_schema_sql_conditions = []
        for full_table_name in request.data["tables_to_query"]:
            database, table = full_table_name.split(">>>>>")
            condition = f"(database = '{database}' AND table = '{table}')"
            table_schema_sql_conditions.append(condition)

        table_schemas = run_query(TABLE_SCHEMAS_SQL, {"conditions": " OR ".join(table_schema_sql_conditions)})

        user_prompt_tables = ""
        for row in table_schemas:
            user_prompt_tables += TABLE_PROMPT.format(
                database=row["database"], table=row["table"], create_table_query=row["create_table_query"]
            )

        final_user_prompt = NATURAL_LANGUAGE_QUERY_USER_PROMPT % {
            "tables_to_query": user_prompt_tables,
            "query": request.data["query"],
        }

        try:
            completion = openai.ChatCompletion.create(
                model=OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": NATURAL_LANGUAGE_QUERY_SYSTEM_PROMPT},
                    {"role": "user", "content": final_user_prompt},
                ],
            )
        except Exception as e:
            return Response(status=418, data={"error": str(e), "sql": None})

        response_json = json.loads(completion.choices[0].message["content"])
        sql = response_json["sql"]
        error = response_json["error"]
        if error:
            return Response(status=418, data={"error": error, "sql": sql})

        settings = {"readonly": 1} if request.data.get("readonly", False) else {}

        try:
            query_result = run_query(sql, use_cache=False, substitute_params=False, settings=settings)
            return Response({"result": query_result, "sql": sql, "error": None})
        except Exception as e:
            return Response(status=418, data={"error": str(e), "sql": sql})
