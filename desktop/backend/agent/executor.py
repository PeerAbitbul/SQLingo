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

        # 2. Execute target SQL
        query_logic = agent.get('query_logic', '')
        print(f"[AGENT: {agent_id}] Executing logic: {query_logic}")
        
        target_conn = agent.get('destination_config', {})
        if not target_conn or not target_conn.get('connection_string'):
            raise ValueError("No connection_string found in agent configuration")
            
        from database.connection import DatabaseConnection
        db = DatabaseConnection(
            target_conn.get('connection_string'),
            target_conn.get('database_type')
        )
        
        # Execute query
        result = db.execute_select(query_logic, limit=100)
        
        # Create Message format
        message_str = f"**Agent Alert:** {agent.get('name')}\n"
        message_str += f"*Executed at: {now_str}*\n"
        message_str += f"---\n\n"
        
        row_count = len(result.get('rows', []))
        
        if row_count > 0:
            message_str += f"**Found {row_count} result(s):**\n\n"
            # Format as markdown table
            headers = " | ".join(str(h) for h in result.get('columns', []))
            separator = " | ".join(["---"] * len(result.get('columns', [])))
            
            message_str += f"| {headers} |\n| {separator} |\n"
            for row in result['rows']:
                row_str = " | ".join(str(cell) for cell in row)
                message_str += f"| {row_str} |\n"
        else:
            message_str += "Query returned 0 rows.\n"
            
        print(f"[AGENT: {agent_id}] Sending to destination: {agent.get('destination')}")
        
        if agent.get('destination', 'local') == 'local':
            # Save to local agent_messages inbox
            agent_db.add_message(agent_id, message_str)
        else:
            print(f"[AGENT: {agent_id}] Destination {agent.get('destination')} is not fully implemented yet, fallback to local.")
            agent_db.add_message(agent_id, message_str)
        
        # Update DB Last Run 
        agent_db.update_agent_status(agent_id, now_str, "SUCCESS")
        agent_db.add_run_log(agent_id, status='SUCCESS', row_count=row_count, summary=f'Query returned {row_count} row(s)')
        
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
    Scans all active agents' connections for anomalies.
    Does NOT require a specific agent_id — it's a system-level scan.
    """
    try:
        print(f"[OBSERVER] Proactive scan starting at {datetime.now().isoformat()}")

        # Get all active agents to find valid connection configs
        all_agents = agent_db.get_all_agents(active_only=True)

        # Collect unique connection configs
        seen_conns = set()
        connections_to_scan = []
        for agent in all_agents:
            config = agent.get('destination_config', {})
            conn_str = config.get('connection_string', '')
            db_type = config.get('database_type', '')
            if conn_str and db_type and conn_str not in seen_conns:
                seen_conns.add(conn_str)
                connections_to_scan.append({'connection_string': conn_str, 'database_type': db_type})

        if not connections_to_scan:
            print("[OBSERVER] No active connections found to scan. Skipping.")
            return

        from agent.observer import run_proactive_observation
        from ai.client import AIClient

        for conn_info in connections_to_scan:
            try:
                # Try to create a minimal AI client
                # The observer uses whatever provider/key is available
                # For now, we'll attempt with environment-level keys or skip
                ai_client = _get_observer_ai_client()
                if not ai_client:
                    print("[OBSERVER] No AI client available for observation. Skipping.")
                    return

                alert = run_proactive_observation(
                    conn_info['connection_string'],
                    conn_info['database_type'],
                    ai_client
                )

                if alert:
                    message = f"**Proactive Database Scan**\n"
                    message += f"*Scanned at: {datetime.now().isoformat()}*\n"
                    message += f"---\n\n"
                    message += alert

                    # Store as a system message (agent_id = "observer")
                    agent_db.add_message("observer", message)
                    print(f"[OBSERVER] Anomaly detected and saved to inbox.")
                else:
                    print(f"[OBSERVER] All clear for {conn_info['database_type']} connection.")
            except Exception as conn_err:
                print(f"[OBSERVER] Error scanning connection: {conn_err}")

    except Exception as e:
        print(f"[OBSERVER] CRITICAL ERROR: {e}")


def _get_observer_ai_client():
    """Try to build an AI client from environment variables for the observer."""
    try:
        from ai.client import AIClient
        from ai.providers.base import AIProvider

        api_key = os.environ.get('OPENAI_API_KEY') or os.environ.get('ANTHROPIC_API_KEY') or os.environ.get('GEMINI_API_KEY')
        if api_key:
            # Determine provider
            if os.environ.get('OPENAI_API_KEY'):
                provider = AIProvider.OPENAI
            elif os.environ.get('ANTHROPIC_API_KEY'):
                provider = AIProvider.CLAUDE
            else:
                provider = AIProvider.GEMINI
            return AIClient(provider=provider, api_key=api_key)

        # Try Ollama as fallback (no key needed)
        try:
            import requests
            resp = requests.get('http://localhost:11434/api/tags', timeout=2)
            if resp.status_code == 200:
                return AIClient(provider=AIProvider.OLLAMA)
        except:
            pass

        return None
    except Exception:
        return None
