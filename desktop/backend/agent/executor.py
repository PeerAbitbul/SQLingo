from datetime import datetime
import sys
import os

# Add parent directory to path to allow importing database module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.agent_storage import agent_db

def execute_agent_job(agent_id: str):
    """
    This function runs in a background thread by APScheduler.
    If it crashes, APScheduler catches it without crashing the API.
    """
    try:
        now_str = datetime.now().isoformat()
        print(f"[AGENT: {agent_id}] Waking up at {now_str}")
        
        # 1. Fetch Agent data
        agent = agent_db.get_agent(agent_id)
        if not agent:
            # If deleted but job still exists
            print(f"[AGENT: {agent_id}] Agent not found in DB. Skipping.")
            return

        if not agent.get('is_active'):
            print(f"[AGENT: {agent_id}] Agent is inactive. Skipping.")
            return

        # 2. Connect to DB
        query_logic = agent.get('query_logic', '')
        agent_type = agent.get('agent_type', 'monitor')
        print(f"[AGENT: {agent_id}] Type={agent_type}, Executing: {query_logic[:80]}")

        target_conn = agent.get('destination_config', {})
        if not target_conn or not target_conn.get('connection_string'):
            raise ValueError("No connection_string found in agent configuration")

        from database.connection import DatabaseConnection
        db = DatabaseConnection(
            target_conn.get('connection_string'),
            target_conn.get('database_type')
        )

        message_str = f"**Agent: {agent.get('name')}**\n"
        message_str += f"*{datetime.now().strftime('%d/%m/%Y %H:%M')}*\n---\n\n"

        if agent_type == 'action':
            # Run a write query (INSERT / UPDATE / DELETE / EXEC)
            action_result = db.execute_action(query_logic)
            affected = action_result.get('affected_rows', 0)
            message_str += f"Action executed successfully. Rows affected: **{affected}**"
            row_count = affected

        elif agent_type == 'conditional':
            # Check condition first, then run action if triggered
            import json as _json
            steps = _json.loads(query_logic) if query_logic.strip().startswith('[') else None
            if not steps or len(steps) < 2:
                raise ValueError("Conditional agent requires query_logic as JSON array: [condition_sql, action_sql]")

            condition_sql, action_sql = steps[0], steps[1]
            check = db.execute_select(condition_sql, limit=1)
            row_count = len(check.get('rows', []))

            if row_count > 0:
                action_result = db.execute_action(action_sql)
                affected = action_result.get('affected_rows', 0)
                message_str += f"Condition met ({row_count} row(s)). "
                message_str += f"Action executed — rows affected: **{affected}**"
            else:
                message_str += "Condition check returned 0 rows. No action taken."

        else:
            # Default: monitor — read-only SELECT
            result = db.execute_select(query_logic, limit=100)
            row_count = len(result.get('rows', []))

            if row_count > 0:
                message_str += f"**Found {row_count} result(s):**\n\n"
                headers = " | ".join(str(h) for h in result.get('columns', []))
                separator = " | ".join(["---"] * len(result.get('columns', [])))
                message_str += f"| {headers} |\n| {separator} |\n"
                for row in result['rows']:
                    message_str += f"| {' | '.join(str(c) for c in row)} |\n"
            else:
                message_str += "Query returned 0 rows."

        agent_db.add_message(agent_id, message_str)
        agent_db.update_agent_status(agent_id, now_str, "SUCCESS")
        agent_db.add_run_log(agent_id, status='SUCCESS', row_count=row_count, summary=message_str[:120])
        
    except Exception as e:
        print(f"[AGENT: {agent_id}] CRITICAL ERROR: {e}")
        try:
            agent_db.update_agent_status(agent_id, datetime.now().isoformat(), f"ERROR: {str(e)}")
            agent_db.add_run_log(agent_id, status='ERROR', error_message=str(e))
        except Exception as db_err:
            print(f"[AGENT: {agent_id}] Could not write to DB: {db_err}")


def execute_observer_job():
    """
    Default system observer job.
    Scans all saved DB connections for anomalies using the stored AI config.
    """
    try:
        print(f"[OBSERVER] Proactive scan starting at {datetime.now().isoformat()}")

        ai_client = _get_observer_ai_client()
        if not ai_client:
            print("[OBSERVER] No AI client configured. Go to Settings → API Keys to enable observer.")
            return

        # Get all saved connections from the main encrypted DB
        from encryption.cipher import get_db
        all_connections = get_db().get_all_connections()

        if not all_connections:
            print("[OBSERVER] No saved connections found. Skipping.")
            return

        from agent.observer import run_proactive_observation

        for conn_info in all_connections:
            conn_name = conn_info.get('name', 'Unknown')
            try:
                alert = run_proactive_observation(
                    conn_info['connection_string'],
                    conn_info['database_type'],
                    ai_client
                )
                if alert:
                    message = f"**Proactive Scan — {conn_name}**\n"
                    message += f"*{datetime.now().strftime('%d/%m/%Y %H:%M')}*\n---\n\n"
                    message += alert
                    agent_db.add_message("observer", message)
                    print(f"[OBSERVER] Anomaly detected in '{conn_name}'.")
                else:
                    print(f"[OBSERVER] All clear for '{conn_name}'.")
            except Exception as conn_err:
                print(f"[OBSERVER] Error scanning '{conn_name}': {conn_err}")

    except Exception as e:
        print(f"[OBSERVER] CRITICAL ERROR: {e}")


def _get_observer_ai_client():
    """Build an AI client from keys saved via the observer-config endpoint."""
    try:
        import json
        from ai.client import AIClient
        from ai.providers import AIProvider
        from database.storage import get_storage

        storage = get_storage()

        # Try keys saved from the frontend (via /api/agents/observer-config)
        raw_keys = storage.get_setting('observer_keys')
        keys = json.loads(raw_keys) if raw_keys else {}

        provider_map = [
            ('claude', AIProvider.CLAUDE),
            ('openai', AIProvider.OPENAI),
            ('gemini', AIProvider.GEMINI),
        ]
        for name, provider_enum in provider_map:
            key = keys.get(name, '').strip()
            if key:
                return AIClient(provider=provider_enum, api_key=key)

        # Fallback: env vars
        if os.environ.get('ANTHROPIC_API_KEY'):
            return AIClient(provider=AIProvider.CLAUDE, api_key=os.environ['ANTHROPIC_API_KEY'])
        if os.environ.get('OPENAI_API_KEY'):
            return AIClient(provider=AIProvider.OPENAI, api_key=os.environ['OPENAI_API_KEY'])
        if os.environ.get('GEMINI_API_KEY'):
            return AIClient(provider=AIProvider.GEMINI, api_key=os.environ['GEMINI_API_KEY'])

        # Fallback: Ollama (no key needed)
        try:
            import urllib.request
            urllib.request.urlopen('http://localhost:11434/api/tags', timeout=2)
            return AIClient(provider=AIProvider.OLLAMA)
        except Exception:
            pass

        return None
    except Exception:
        return None
