import sqlite3
import json
import uuid
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional

class AgentStorage:
    def __init__(self):
        # Store in user's home directory like connection storage
        self.config_dir = Path.home() / '.sqlingo'
        self.config_dir.mkdir(exist_ok=True)
        self.db_path = self.config_dir / 'agents.db'
        self._init_db()

    def _get_connection(self):
        # We use a row factory to access columns by name
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS agents (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    connection_id TEXT NOT NULL,
                    schedule TEXT NOT NULL,
                    query_logic TEXT NOT NULL,
                    destination TEXT NOT NULL,
                    destination_config TEXT,
                    is_active INTEGER DEFAULT 1,
                    created_at TEXT NOT NULL,
                    last_run_at TEXT,
                    last_status TEXT,
                    agent_type TEXT DEFAULT 'monitor'
                )
            ''')
            # Migration: add agent_type column to existing DBs
            try:
                cursor.execute("ALTER TABLE agents ADD COLUMN agent_type TEXT DEFAULT 'monitor'")
            except Exception:
                pass  # Column already exists
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS agent_messages (
                    id TEXT PRIMARY KEY,
                    agent_id TEXT NOT NULL,
                    content TEXT NOT NULL,
                    is_read INTEGER DEFAULT 0,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(agent_id) REFERENCES agents(id)
                )
            ''')
            
            # Seed the default system observer agent
            cursor.execute('''
                INSERT OR IGNORE INTO agents
                (id, name, connection_id, schedule, query_logic, destination, destination_config, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                'observer',
                'System Observer (Auto-Discovery)',
                'system',
                'cron:*/30 * * * *',
                'Proactive scan of Log/Audit/Error tables for anomalies',
                'local',
                '{}',
                1,
                datetime.now().isoformat()
            ))

            # Agent run history table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS agent_runs (
                    id TEXT PRIMARY KEY,
                    agent_id TEXT NOT NULL,
                    started_at TEXT NOT NULL,
                    finished_at TEXT,
                    status TEXT NOT NULL,
                    row_count INTEGER DEFAULT 0,
                    summary TEXT,
                    error_message TEXT,
                    FOREIGN KEY(agent_id) REFERENCES agents(id)
                )
            ''')
            
            conn.commit()

    def create_agent(self, agent_data: Dict[str, Any]) -> str:
        agent_id = str(uuid.uuid4())
        now = datetime.now().isoformat()

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO agents
                (id, name, connection_id, schedule, query_logic, destination, destination_config, is_active, created_at, agent_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                agent_id,
                agent_data.get('name', 'Unnamed Agent'),
                agent_data.get('connection_id'),
                agent_data.get('schedule', '0 8 * * *'),
                agent_data.get('query_logic', ''),
                agent_data.get('destination', 'local'),
                json.dumps(agent_data.get('destination_config', {})),
                1 if agent_data.get('is_active', True) else 0,
                now,
                agent_data.get('agent_type', 'monitor'),
            ))
            conn.commit()

        return agent_id

    def get_agent(self, agent_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM agents WHERE id = ?', (agent_id,))
            row = cursor.fetchone()
            
            if row:
                agent = dict(row)
                if agent.get('destination_config'):
                    agent['destination_config'] = json.loads(agent['destination_config'])
                agent['is_active'] = bool(agent['is_active'])
                return agent
            return None

    def get_all_agents(self, active_only: bool = False) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            if active_only:
                cursor.execute('SELECT * FROM agents WHERE is_active = 1 ORDER BY created_at DESC')
            else:
                cursor.execute('SELECT * FROM agents ORDER BY created_at DESC')
                
            agents = []
            for row in cursor.fetchall():
                agent = dict(row)
                if agent.get('destination_config'):
                    agent['destination_config'] = json.loads(agent['destination_config'])
                agent['is_active'] = bool(agent['is_active'])
                agents.append(agent)
                
            return agents

    def update_agent_status(self, agent_id: str, last_run_at: str, last_status: str):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE agents 
                SET last_run_at = ?, last_status = ?
                WHERE id = ?
            ''', (last_run_at, last_status, agent_id))
            conn.commit()

    def toggle_agent(self, agent_id: str, is_active: bool):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('UPDATE agents SET is_active = ? WHERE id = ?', (1 if is_active else 0, agent_id))
            conn.commit()

    def delete_agent(self, agent_id: str):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM agents WHERE id = ?', (agent_id,))
            conn.commit()

    def add_message(self, agent_id: str, content: str) -> str:
        msg_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO agent_messages (id, agent_id, content, is_read, created_at)
                VALUES (?, ?, ?, 0, ?)
            ''', (msg_id, agent_id, content, now))
            conn.commit()
        return msg_id
        
    def get_unread_messages(self) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT m.*, a.name as agent_name 
                FROM agent_messages m 
                JOIN agents a ON m.agent_id = a.id 
                WHERE m.is_read = 0 
                ORDER BY m.created_at ASC
            ''')
            return [dict(row) for row in cursor.fetchall()]
            
    def mark_messages_read(self, message_ids: List[str]):
        if not message_ids: return
        with self._get_connection() as conn:
            cursor = conn.cursor()
            placeholders = ','.join('?' * len(message_ids))
            cursor.execute(f'UPDATE agent_messages SET is_read = 1 WHERE id IN ({placeholders})', message_ids)
            conn.commit()

    # ── Agent Run Logs ──────────────────────────────────────
    def add_run_log(self, agent_id: str, status: str, row_count: int = 0, summary: str = '', error_message: str = '') -> str:
        run_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO agent_runs (id, agent_id, started_at, finished_at, status, row_count, summary, error_message)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (run_id, agent_id, now, now, status, row_count, summary, error_message))
            conn.commit()
        return run_id

    def get_agent_runs(self, agent_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM agent_runs 
                WHERE agent_id = ? 
                ORDER BY started_at DESC 
                LIMIT ?
            ''', (agent_id, limit))
            return [dict(row) for row in cursor.fetchall()]

# Create a singleton instance
agent_db = AgentStorage()
