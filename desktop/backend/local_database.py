"""
Local SQLite database for device tracking

This database stores:
1. Device identification (hardware fingerprint)
2. Local chat history and settings

The data is stored in a hidden directory and tied to this machine's hardware.
"""
import sqlite3
import os
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime
import base64
import hashlib


def get_encryption_key() -> bytes:
    """
    Generate encryption key based on machine-specific data
    This ensures the database is tied to this specific machine
    """
    from device_id import get_hardware_id

    hardware_id = get_hardware_id()
    # Derive a Fernet key from hardware ID
    key_material = hashlib.sha256(hardware_id.encode()).digest()
    return base64.urlsafe_b64encode(key_material)


def get_database_path() -> Path:
    """
    Get path to local database in hidden user directory
    Platform-specific paths:
    - macOS: ~/Library/Application Support/SQLingo/.sqlingo.db
    - Windows: %APPDATA%/SQLingo/.sqlingo.db
    - Linux: ~/.config/sqlingo/.sqlingo.db
    """
    import platform

    system = platform.system()

    if system == "Darwin":  # macOS
        base_dir = Path.home() / "Library" / "Application Support" / "SQLingo"
    elif system == "Windows":
        app_data = os.getenv("APPDATA")
        base_dir = Path(app_data) / "SQLingo" if app_data else Path.home() / "SQLingo"
    else:  # Linux
        base_dir = Path.home() / ".config" / "sqlingo"

    # Create directory if it doesn't exist
    base_dir.mkdir(parents=True, exist_ok=True)

    # Hidden database file
    return base_dir / ".sqlingo.db"


def init_local_database() -> sqlite3.Connection:
    """
    Initialize local SQLite database with schema
    Returns connection object
    """
    db_path = get_database_path()

    # Connect to database with WAL mode for better concurrent access
    conn = sqlite3.connect(
        str(db_path),
        timeout=30.0,  # Wait up to 30 seconds if locked
        check_same_thread=False  # Allow access from multiple threads
    )
    conn.row_factory = sqlite3.Row  # Enable column access by name
    # Enable WAL mode for better concurrent access
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=30000")  # 30 seconds

    cursor = conn.cursor()

    # Create schema
    cursor.executescript("""
        -- Device information (single row)
        CREATE TABLE IF NOT EXISTS device_info (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            device_uuid TEXT UNIQUE NOT NULL,
            hardware_id TEXT NOT NULL,
            device_name TEXT,
            registered_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- User state (single row) - minimal local tracking
        CREATE TABLE IF NOT EXISTS user_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            messages_used INTEGER DEFAULT 0,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- Message log (for local history only)
        CREATE TABLE IF NOT EXISTS message_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id TEXT,
            ai_provider TEXT,
            success INTEGER DEFAULT 1,
            error_message TEXT,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_message_log_timestamp ON message_log(timestamp);
    """)

    conn.commit()

    return conn


def get_local_connection() -> sqlite3.Connection:
    """Get connection to local database"""
    return init_local_database()


def get_or_create_device_info(conn: sqlite3.Connection) -> dict:
    """Get or create device info"""
    from device_id import init_device_identifiers, get_device_info

    cursor = conn.cursor()

    # Try to get existing
    cursor.execute("SELECT * FROM device_info LIMIT 1")
    row = cursor.fetchone()

    if row:
        return dict(row)

    # Create new - initialize device identifiers and cache them
    device_uuid, hardware_id = init_device_identifiers(conn)
    device_info = get_device_info()

    cursor.execute("""
        INSERT INTO device_info (id, device_uuid, hardware_id, device_name)
        VALUES (1, ?, ?, ?)
    """, (device_uuid, hardware_id, device_info["device_name"]))

    conn.commit()

    cursor.execute("SELECT * FROM device_info LIMIT 1")
    return dict(cursor.fetchone())


def get_user_state(conn: sqlite3.Connection) -> Optional[dict]:
    """Get current user state"""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM user_state LIMIT 1")
    row = cursor.fetchone()

    if row:
        return dict(row)

    # Initialize with default state
    cursor.execute("""
        INSERT INTO user_state (id, messages_used)
        VALUES (1, 0)
    """)
    conn.commit()

    cursor.execute("SELECT * FROM user_state LIMIT 1")
    return dict(cursor.fetchone())


def update_user_state(conn: sqlite3.Connection, **kwargs) -> None:
    """Update user state"""
    cursor = conn.cursor()

    # Build update query
    fields = []
    values = []

    for key, value in kwargs.items():
        fields.append(f"{key} = ?")
        values.append(value)

    fields.append("updated_at = datetime('now')")

    query = f"UPDATE user_state SET {', '.join(fields)} WHERE id = 1"
    cursor.execute(query, values)
    conn.commit()


def increment_local_usage(
    conn: sqlite3.Connection,
    chat_id: str = "",
    ai_provider: str = "",
    success: bool = True,
    error_message: str = None
) -> Dict[str, Any]:
    """
    Increment local message counter and log the usage.
    Returns updated usage info.
    """
    cursor = conn.cursor()
    
    # Increment usage counter
    cursor.execute("""
        UPDATE user_state SET 
            messages_used = messages_used + 1,
            updated_at = datetime('now')
        WHERE id = 1
    """)
    
    # Log the message
    cursor.execute("""
        INSERT INTO message_log (chat_id, ai_provider, success, error_message)
        VALUES (?, ?, ?, ?)
    """, (
        chat_id, 
        ai_provider, 
        1 if success else 0, 
        error_message
    ))
    
    message_id = cursor.lastrowid
    conn.commit()
    
    # Get updated state
    cursor.execute("SELECT messages_used FROM user_state WHERE id = 1")
    row = cursor.fetchone()
    
    return {
        "message_id": message_id,
        "messages_used": row[0] if row else 0
    }


def get_connection_count(conn: sqlite3.Connection) -> int:
    """
    Get number of database connections configured
    """
    # Import here to avoid circular dependency
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(__file__)))

    try:
        # Try to import from frontend store
        # In practice, we'll need to query this via the API
        # For now, return 0 as placeholder
        return 0
    except:
        return 0
