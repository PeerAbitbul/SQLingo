"""
SQLite Database with Field-Level Encryption
Uses cryptography.fernet for encrypting sensitive fields
"""
import os
import hashlib
import platform
import sqlite3
import base64
from typing import Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


class EncryptedDB:
    """SQLite database with field-level encryption for sensitive data"""

    def __init__(self, db_path: str = "db_chat.db"):
        self.db_path = db_path
        self.encryption_key = self._get_encryption_key()
        self.cipher = Fernet(self.encryption_key)
        self.conn: Optional[sqlite3.Connection] = None

    def _get_machine_key(self) -> str:
        """
        Generate machine-specific base key
        Uses machine ID + hostname to create unique key
        """
        # Get machine-specific identifiers
        machine_id = self._get_machine_id()
        hostname = platform.node()

        # Combine and hash
        combined = f"{machine_id}:{hostname}:db_chat_salt_v1"
        key_hash = hashlib.sha256(combined.encode()).hexdigest()

        return key_hash

    def _get_machine_id(self) -> str:
        """Get unique machine identifier"""
        system = platform.system()

        if system == "Darwin":  # macOS
            # Use IOPlatformUUID
            try:
                import subprocess
                result = subprocess.run(
                    ['ioreg', '-rd1', '-c', 'IOPlatformExpertDevice'],
                    capture_output=True,
                    text=True
                )
                for line in result.stdout.split('\n'):
                    if 'IOPlatformUUID' in line:
                        return line.split('"')[3]
            except:
                pass

        elif system == "Windows":
            # Use machine GUID
            try:
                import subprocess
                result = subprocess.run(
                    ['wmic', 'csproduct', 'get', 'UUID'],
                    capture_output=True,
                    text=True
                )
                lines = result.stdout.strip().split('\n')
                if len(lines) > 1:
                    return lines[1].strip()
            except:
                pass

        elif system == "Linux":
            # Use machine-id
            try:
                with open('/etc/machine-id', 'r') as f:
                    return f.read().strip()
            except:
                try:
                    with open('/var/lib/dbus/machine-id', 'r') as f:
                        return f.read().strip()
                except:
                    pass

        # Fallback: use MAC address
        import uuid
        mac = uuid.getnode()
        return str(mac)

    def _get_encryption_key(self) -> bytes:
        """
        Derive Fernet encryption key from machine-specific base key
        Uses PBKDF2 to derive a proper Fernet key
        """
        base_key = self._get_machine_key()

        # Use PBKDF2HMAC to derive a 32-byte key
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'sqlingo_desktop_v1',  # Fixed salt for consistency
            iterations=100000,
        )
        key_bytes = kdf.derive(base_key.encode())

        # Fernet requires base64-encoded 32-byte key
        return base64.urlsafe_b64encode(key_bytes)

    def encrypt_field(self, value: str) -> str:
        """Encrypt a string field"""
        if not value:
            return value
        encrypted_bytes = self.cipher.encrypt(value.encode())
        return encrypted_bytes.decode('utf-8')

    def decrypt_field(self, encrypted_value: str) -> str:
        """Decrypt a string field"""
        if not encrypted_value:
            return encrypted_value
        try:
            decrypted_bytes = self.cipher.decrypt(encrypted_value.encode())
            return decrypted_bytes.decode('utf-8')
        except Exception:
            # If decryption fails, return original (might be unencrypted old data)
            return encrypted_value

    def connect(self) -> sqlite3.Connection:
        """Connect to database"""
        if self.conn is None:
            # Add timeout and check_same_thread=False for better concurrent access
            self.conn = sqlite3.connect(
                self.db_path, 
                timeout=30.0,  # Wait up to 30 seconds if locked
                check_same_thread=False  # Allow access from multiple threads
            )
            self.conn.row_factory = sqlite3.Row  # Enable dict-like access
            # Enable WAL mode for better concurrent access
            self.conn.execute("PRAGMA journal_mode=WAL")
            self.conn.execute("PRAGMA busy_timeout=30000")  # 30 seconds
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

        # Connections table (connection_string is encrypted)
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

        # Device info table (for usage tracking)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS device_info (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                device_uuid TEXT UNIQUE NOT NULL,
                hardware_id TEXT NOT NULL,
                device_name TEXT,
                registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # User state table (minimal local tracking)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_state (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                messages_used INTEGER DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Message log table (for tracking sent messages)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS message_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chat_id TEXT,
                ai_provider TEXT,
                success INTEGER DEFAULT 1,
                
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Create indexes
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_message_log_timestamp
            ON message_log(timestamp)
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
        """
        Cleanup old data
        - Delete chats older than specified days
        - Limit messages per chat to 1000
        """
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

    # Helper methods for common operations with encryption

    def save_connection(self, name: str, connection_string: str, database_type: str) -> int:
        """Save a database connection (encrypts connection string)"""
        encrypted_conn_str = self.encrypt_field(connection_string)
        cursor = self.execute("""
            INSERT INTO connections (name, connection_string, database_type)
            VALUES (?, ?, ?)
        """, (name, encrypted_conn_str, database_type))
        return cursor.lastrowid

    def get_connection(self, connection_id: int) -> dict:
        """Get a database connection (decrypts connection string)"""
        row = self.fetchone("""
            SELECT id, name, connection_string, database_type, created_at
            FROM connections
            WHERE id = ?
        """, (connection_id,))

        if row:
            return {
                'id': row['id'],
                'name': row['name'],
                'connection_string': self.decrypt_field(row['connection_string']),
                'database_type': row['database_type'],
                'created_at': row['created_at']
            }
        return None

    def get_all_connections(self) -> list:
        """Get all database connections (decrypts connection strings)"""
        rows = self.fetchall("""
            SELECT id, name, connection_string, database_type, created_at
            FROM connections
            ORDER BY created_at DESC
        """)

        connections = []
        for row in rows:
            connections.append({
                'id': row['id'],
                'name': row['name'],
                'connection_string': self.decrypt_field(row['connection_string']),
                'database_type': row['database_type'],
                'created_at': row['created_at']
            })
        return connections


# Singleton instance
_db_instance: Optional[EncryptedDB] = None


def get_db() -> EncryptedDB:
    """Get database instance (singleton)"""
    global _db_instance
    if _db_instance is None:
        _db_instance = EncryptedDB()
        _db_instance.connect()
    return _db_instance
