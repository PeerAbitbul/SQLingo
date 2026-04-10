"""
Development version of cipher.py using standard SQLite
Use this for development when SQLCipher is not available
"""
import os
import hashlib
import platform
import sqlite3
from typing import Optional

class EncryptedDB:
    """SQLite database (non-encrypted for development)"""
    
    def __init__(self, db_path: str = "db_chat_dev.db"):
        self.db_path = db_path
        self.conn: Optional[sqlite3.Connection] = None
    
    def connect(self) -> sqlite3.Connection:
        """Connect to database"""
        if self.conn is None:
            self.conn = sqlite3.connect(self.db_path)
            self._init_schema()
        
        return self.conn
    
    def _init_schema(self):
        """Initialize database schema"""
        cursor = self.conn.cursor()
        
        # Settings table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Connections table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS connections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                connection_string TEXT NOT NULL,
                database_type TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Chats table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                connection_id INTEGER,
                title TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (connection_id) REFERENCES connections(id)
            )
        """)
        
        # Messages table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chat_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                sql_query TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chat_id) REFERENCES chats(id)
            )
        """)
        
        # Schema cache table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS schema_cache (
                connection_id INTEGER PRIMARY KEY,
                schema_json TEXT NOT NULL,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (connection_id) REFERENCES connections(id)
            )
        """)

        # Query favorites table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS query_favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                connection_id INTEGER,
                title TEXT NOT NULL,
                sql_query TEXT NOT NULL,
                description TEXT,
                tags TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (connection_id) REFERENCES connections(id)
            )
        """)
        
        self.conn.commit()
    
    def execute(self, query: str, params: tuple = ()):
        """Execute a query"""
        cursor = self.conn.cursor()
        cursor.execute(query, params)
        self.conn.commit()
        return cursor
    
    def fetchone(self, query: str, params: tuple = ()):
        """Fetch one result"""
        cursor = self.conn.cursor()
        cursor.execute(query, params)
        return cursor.fetchone()
    
    def fetchall(self, query: str, params: tuple = ()):
        """Fetch all results"""
        cursor = self.conn.cursor()
        cursor.execute(query, params)
        return cursor.fetchall()
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            self.conn = None
    
    def cleanup_old_data(self, days: int = 90):
        """Cleanup old data"""
        cursor = self.conn.cursor()
        
        # Delete old chats
        cursor.execute(f"""
            DELETE FROM chats 
            WHERE created_at < datetime('now', '-{days} days')
        """)
        
        # Delete orphaned messages
        cursor.execute("""
            DELETE FROM messages 
            WHERE chat_id NOT IN (SELECT id FROM chats)
        """)
        
        # Limit messages per chat
        cursor.execute("""
            DELETE FROM messages 
            WHERE id NOT IN (
                SELECT id FROM messages 
                ORDER BY created_at DESC 
                LIMIT 1000
            )
        """)
        
        # Vacuum to reduce file size
        cursor.execute("VACUUM")
        
        self.conn.commit()

# Singleton instance
_db_instance: Optional[EncryptedDB] = None

def get_db() -> EncryptedDB:
    """Get database instance (singleton)"""
    global _db_instance
    if _db_instance is None:
        _db_instance = EncryptedDB()
        _db_instance.connect()
    return _db_instance

