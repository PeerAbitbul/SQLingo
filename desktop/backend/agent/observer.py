import json
from datetime import datetime
from database.connection import DatabaseConnection

def run_proactive_observation(connection_string: str, database_type: str, ai_client):
    """
    Observer Engine:
    1. Connects to the database
    2. Identifies critical tables (Logs, Transactions, Errors)
    3. Samples metadata or recent row counts
    4. Feeds to LLM to detect anomalies
    5. Returns an alert text if an anomaly is found, else None
    """
    try:
        db = DatabaseConnection(connection_string, database_type)
        
        # 1. Identify interesting tables (heuristic approach)
        if database_type in ['sqlserver', 'mssql']:
            schema_query = """
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_TYPE = 'BASE TABLE'
                AND (
                    TABLE_NAME LIKE '%log%' 
                    OR TABLE_NAME LIKE '%error%' 
                    OR TABLE_NAME LIKE '%tran%'
                    OR TABLE_NAME LIKE '%audit%'
                    OR TABLE_NAME LIKE '%history%'
                )
            """
        elif database_type == 'postgresql':
            schema_query = """
                SELECT tablename as TABLE_NAME 
                FROM pg_tables 
                WHERE schemaname = 'public'
                AND (
                    tablename ILIKE '%log%' 
                    OR tablename ILIKE '%error%' 
                    OR tablename ILIKE '%tran%'
                    OR tablename ILIKE '%audit%'
                    OR tablename ILIKE '%history%'
                )
            """
        else: # mysql
            schema_query = """
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA = DATABASE()
                AND (
                    TABLE_NAME LIKE '%log%' 
                    OR TABLE_NAME LIKE '%error%' 
                    OR TABLE_NAME LIKE '%tran%'
                    OR TABLE_NAME LIKE '%audit%'
                    OR TABLE_NAME LIKE '%history%'
                )
            """
            
        tables_res = db.execute_select(schema_query)
        tables = [row[0] for row in tables_res.get('rows', [])]
        
        if not tables:
            return None # No interesting tables found to observe
            
        # Limit to top 5 most likely critical tables
        tables = tables[:5]
        
        # 2. Gather simple volume metrics for the tables
        stats = []
        for table in tables:
            try:
                # Count total rows as a simple metric
                count_query = f"SELECT COUNT(*) FROM {table}"
                count_res = db.execute_select(count_query)
                row_count = count_res['rows'][0][0] if count_res.get('rows') else 0
                stats.append({"table": table, "total_rows": row_count})
            except:
                pass
                
        if not stats:
            return None
            
        # 3. LLM Anomaly Detection Prompt
        stats_str = json.dumps(stats, indent=2)
        prompt = f"""
I am running a proactive database observation agent. Here are the row counts for critical 'Log/Audit' tables in the database right now:
{stats_str}

Analyze these metrics. Based on common database patterns, does anything seem alarming or requiring user attention? (e.g., usually an error table shouldn't be massive compared to transaction tables).

If EVERYTHING LOOKS NORMAL, you MUST return exactly the word "NORMAL" and nothing else.
If you spot a potential anomaly or concern, write a short, friendly alert string addressed to the user detailing what you noticed and what they might want to investigate. Do not use JSON formatting.
"""

        analysis_result = ai_client.generate_sql(
            question=prompt,
            schema="[Observer Mode]",
            database_type=database_type
        )
        
        reply = analysis_result.get('explanation', '').strip()
        
        if reply == "NORMAL" or "NORMAL" in reply.upper()[:10]:
            return None
            
        return reply

    except Exception as e:
        print(f"[Observer ERROR] {e}")
        return None
