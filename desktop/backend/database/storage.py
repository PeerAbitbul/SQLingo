"""
Database Storage Layer
CRUD operations for encrypted database
"""
from typing import List, Dict, Any, Optional
import json

# Import SQLite with Fernet encryption, fall back to dev version if needed
try:
    from encryption.cipher import get_db
    from encryption.connection_encryption import get_connection_cipher
    ENCRYPTION_AVAILABLE = True
except ImportError:
    from encryption.cipher_dev import get_db
    ENCRYPTION_AVAILABLE = False
    print("[WARNING] Using non-encrypted SQLite for development")
    print("   Encryption module not available - connection strings will not be encrypted")

class DatabaseStorage:
    """Storage layer for encrypted database"""
    
    def __init__(self):
        self.db = get_db()
        if ENCRYPTION_AVAILABLE:
            self.cipher = get_connection_cipher(self.db.encryption_key)
        else:
            self.cipher = None
    
    # Connection Management
    def save_connection(
        self,
        name: str,
        connection_string: str,
        database_type: str
    ) -> int:
        """Save database connection (encrypted)"""
        if self.cipher:
            encrypted_conn = self.cipher.encrypt(connection_string)
        else:
            # Development mode: store as-is (NOT SECURE!)
            encrypted_conn = connection_string
        
        cursor = self.db.execute(
            """
            INSERT INTO connections (name, connection_string, database_type)
            VALUES (?, ?, ?)
            """,
            (name, encrypted_conn, database_type)
        )
        
        return cursor.lastrowid
    
    def get_connection(self, connection_id: int) -> Optional[Dict[str, Any]]:
        """Get connection by ID (decrypts connection string)"""
        row = self.db.fetchone(
            "SELECT id, name, connection_string, database_type, created_at FROM connections WHERE id = ?",
            (connection_id,)
        )
        
        if row:
            if self.cipher:
                connection_string = self.cipher.decrypt(row[2])
            else:
                connection_string = row[2]  # Development mode
            
            return {
                'id': row[0],
                'name': row[1],
                'connection_string': connection_string,
                'database_type': row[3],
                'created_at': row[4]
            }
        return None
    
    def list_connections(self) -> List[Dict[str, Any]]:
        """List all connections (without decrypting connection strings)"""
        rows = self.db.fetchall(
            "SELECT id, name, database_type, created_at FROM connections ORDER BY created_at DESC"
        )
        
        return [
            {
                'id': row[0],
                'name': row[1],
                'database_type': row[2],
                'created_at': row[3]
            }
            for row in rows
        ]
    
    def delete_connection(self, connection_id: int):
        """Delete connection"""
        self.db.execute("DELETE FROM connections WHERE id = ?", (connection_id,))
    
    # Chat Management
    def create_chat(self, title: str, connection_id: Optional[int] = None) -> int:
        """Create new chat"""
        cursor = self.db.execute(
            "INSERT INTO chats (title, connection_id) VALUES (?, ?)",
            (title, connection_id)
        )
        return cursor.lastrowid
    
    def get_chat(self, chat_id: int) -> Optional[Dict[str, Any]]:
        """Get chat by ID"""
        row = self.db.fetchone(
            "SELECT id, title, connection_id, created_at FROM chats WHERE id = ?",
            (chat_id,)
        )
        
        if row:
            return {
                'id': row[0],
                'title': row[1],
                'connection_id': row[2],
                'created_at': row[3]
            }
        return None
    
    def list_chats(self, limit: int = 50) -> List[Dict[str, Any]]:
        """List recent chats"""
        rows = self.db.fetchall(
            f"SELECT id, title, connection_id, created_at FROM chats ORDER BY created_at DESC LIMIT {limit}"
        )
        
        return [
            {
                'id': row[0],
                'title': row[1],
                'connection_id': row[2],
                'created_at': row[3]
            }
            for row in rows
        ]
    
    def delete_chat(self, chat_id: int):
        """Delete chat and its messages"""
        self.db.execute("DELETE FROM messages WHERE chat_id = ?", (chat_id,))
        self.db.execute("DELETE FROM chats WHERE id = ?", (chat_id,))
    
    # Message Management
    def add_message(
        self,
        chat_id: int,
        role: str,
        content: str,
        sql_query: Optional[str] = None
    ) -> int:
        """Add message to chat"""
        cursor = self.db.execute(
            """
            INSERT INTO messages (chat_id, role, content, sql_query)
            VALUES (?, ?, ?, ?)
            """,
            (chat_id, role, content, sql_query)
        )
        return cursor.lastrowid
    
    def get_messages(self, chat_id: int) -> List[Dict[str, Any]]:
        """Get all messages for a chat"""
        rows = self.db.fetchall(
            """
            SELECT id, role, content, sql_query, created_at 
            FROM messages 
            WHERE chat_id = ? 
            ORDER BY created_at ASC
            """,
            (chat_id,)
        )
        
        return [
            {
                'id': row[0],
                'role': row[1],
                'content': row[2],
                'sql_query': row[3],
                'created_at': row[4]
            }
            for row in rows
        ]
    
    # Schema Cache
    def save_schema_cache(self, connection_id: int, schema: List[Dict[str, Any]]):
        """Save schema cache"""
        schema_json = json.dumps(schema)
        
        self.db.execute(
            """
            INSERT OR REPLACE INTO schema_cache (connection_id, schema_json, last_updated)
            VALUES (?, ?, datetime('now'))
            """,
            (connection_id, schema_json)
        )
    
    def get_schema_cache(self, connection_id: int, max_age_hours: int = 24) -> Optional[List[Dict[str, Any]]]:
        """Get cached schema if not expired"""
        row = self.db.fetchone(
            f"""
            SELECT schema_json FROM schema_cache 
            WHERE connection_id = ? 
            AND last_updated > datetime('now', '-{max_age_hours} hours')
            """,
            (connection_id,)
        )
        
        if row:
            return json.loads(row[0])
        return None
    
    # Settings
    def set_setting(self, key: str, value: str):
        """Set a setting"""
        self.db.execute(
            """
            INSERT OR REPLACE INTO settings (key, value, updated_at)
            VALUES (?, ?, datetime('now'))
            """,
            (key, value)
        )
    
    def get_setting(self, key: str) -> Optional[str]:
        """Get a setting"""
        row = self.db.fetchone("SELECT value FROM settings WHERE key = ?", (key,))
        return row[0] if row else None
    
    # Cleanup
    def cleanup(self, days: int = 90):
        """Cleanup old data"""
        self.db.cleanup_old_data(days)

# Singleton instance
_storage_instance: Optional[DatabaseStorage] = None

def get_storage() -> DatabaseStorage:
    """Get storage instance (singleton)"""
    global _storage_instance
    if _storage_instance is None:
        _storage_instance = DatabaseStorage()
    return _storage_instance

