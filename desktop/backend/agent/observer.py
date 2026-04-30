import json
from database.connection import DatabaseConnection


def _get_all_tables(db: DatabaseConnection, database_type: str) -> list[str]:
    if database_type in ['sqlserver', 'mssql']:
        query = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"
    elif database_type == 'postgresql':
        query = "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
    else:  # mysql
        query = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA = DATABASE()"

    res = db.execute_select(query)
    return [row[0] for row in res.get('rows', [])]


def _get_table_columns(db: DatabaseConnection, table: str, database_type: str) -> list[str]:
    try:
        if database_type in ['sqlserver', 'mssql']:
            query = f"SELECT TOP 1 * FROM {table}"
        else:
            query = f"SELECT * FROM {table} LIMIT 1"
        res = db.execute_select(query)
        return res.get('columns', [])
    except Exception:
        return []


def run_proactive_observation(connection_string: str, database_type: str, ai_client) -> str | None:
    """
    Observer Engine:
    1. Connects to the DB and lists ALL tables
    2. Gets row counts + column names for each table
    3. Feeds the full snapshot to the LLM to detect anomalies
    4. Returns an alert string if something looks off, else None
    """
    try:
        db = DatabaseConnection(connection_string, database_type)

        tables = _get_all_tables(db, database_type)
        if not tables:
            return None

        # Limit to 30 tables to keep the prompt reasonable
        tables = tables[:30]

        stats = []
        for table in tables:
            try:
                count_res = db.execute_select(f"SELECT COUNT(*) FROM {table}")
                row_count = count_res['rows'][0][0] if count_res.get('rows') else 0
                columns = _get_table_columns(db, table, database_type)
                stats.append({
                    "table": table,
                    "row_count": row_count,
                    "columns": columns[:15],  # cap column list
                })
            except Exception:
                pass

        if not stats:
            return None

        stats_str = json.dumps(stats, indent=2, ensure_ascii=False)
        prompt = f"""You are a proactive database monitoring agent.
Here is a full snapshot of all tables in the database, including their row counts and column names:

{stats_str}

Analyze this snapshot for anything that might concern a developer or DBA:
- Unexpectedly empty tables that look like they should have data
- Tables with suspiciously high or low row counts relative to each other
- Column names that suggest sensitive data without obvious protection (e.g. password, token, secret stored as plain text fields)
- Any other structural or data anomaly worth flagging

If EVERYTHING LOOKS NORMAL, respond with exactly the word "NORMAL" and nothing else.
If you find a concern, write a short, friendly alert (2-4 sentences max) describing what you noticed and what the user might want to check. Do not use JSON. Do not list every table — only mention the concerning ones."""

        result = ai_client.generate_sql(
            question=prompt,
            schema="[Observer Mode — Full Table Scan]",
            database_type=database_type
        )

        reply = result.get('explanation', '').strip()

        if not reply or reply.upper().startswith('NORMAL'):
            return None

        return reply

    except Exception as e:
        print(f"[Observer ERROR] {e}")
        return None
