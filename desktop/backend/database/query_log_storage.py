import sqlite3
import uuid
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

class QueryLogStorage:
    def __init__(self):
        self.config_dir = Path.home() / '.sqlingo'
        self.config_dir.mkdir(exist_ok=True)
        self.db_path = self.config_dir / 'agents.db'
        self._init_db()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS write_query_logs (
                    id TEXT PRIMARY KEY,
                    connection_name TEXT,
                    database_type TEXT NOT NULL,
                    sql_query TEXT NOT NULL,
                    affected_rows INTEGER DEFAULT 0,
                    status TEXT NOT NULL,
                    error_message TEXT,
                    executed_at TEXT NOT NULL
                )
            ''')
            conn.commit()

    def log_query(
        self,
        database_type: str,
        sql_query: str,
        affected_rows: int,
        status: str,
        connection_name: Optional[str] = None,
        error_message: Optional[str] = None,
    ) -> str:
        log_id = str(uuid.uuid4())
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO write_query_logs
                (id, connection_name, database_type, sql_query, affected_rows, status, error_message, executed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (log_id, connection_name, database_type, sql_query, affected_rows, status, error_message, datetime.now().isoformat()))
            conn.commit()
        return log_id

    def get_logs(self, limit: int = 50) -> List[Dict]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, connection_name, database_type, sql_query, affected_rows, status, error_message, executed_at
                FROM write_query_logs
                ORDER BY executed_at DESC
                LIMIT ?
            ''', (limit,))
            return [dict(row) for row in cursor.fetchall()]
