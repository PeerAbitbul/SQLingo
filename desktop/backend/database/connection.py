"""
Database Connection Handler
Supports SQL Server, PostgreSQL, MySQL
"""
# Import with fallback for missing drivers
MSSQL_DRIVER = None

# Try pymssql first (Python 3.13 compatible)
try:
    import pymssql
    MSSQL_DRIVER = "pymssql"
    print("[OK] Using pymssql driver for SQL Server")
except ImportError:
    # Fallback to pyodbc
    try:
        import pyodbc
        MSSQL_DRIVER = "pyodbc"
        print("[OK] Using pyodbc driver for SQL Server")
    except ImportError:
        print("[WARNING] No SQL Server driver available. Install with: pip install pymssql or pip install pyodbc")

import psycopg2
import pymysql
from typing import Dict, List, Any, Optional
from sqlalchemy import create_engine, text

class DatabaseConnection:
    """Unified database connection handler"""
    
    def __init__(self, connection_string: str, database_type: str):
        self.connection_string = connection_string
        self.database_type = database_type.lower()
        self.engine = None
        
    def _get_engine(self):
        """Create SQLAlchemy engine based on database type"""
        if self.engine is None:
            if self.database_type == 'sqlserver':
                if not MSSQL_DRIVER:
                    raise ValueError(
                        "SQL Server support requires a driver. "
                        "Install with: pip install pymssql (Python 3.13+) "
                        "or pip install pyodbc (Python 3.12 and below)"
                    )
                
                # Adjust connection string based on driver
                conn_str = self.connection_string
                if MSSQL_DRIVER == "pymssql":
                    # pymssql uses: mssql+pymssql://
                    if conn_str.startswith("mssql+pyodbc://"):
                        conn_str = conn_str.replace("mssql+pyodbc://", "mssql+pymssql://")
                    elif conn_str.startswith("mssql://"):
                        conn_str = conn_str.replace("mssql://", "mssql+pymssql://")
                elif MSSQL_DRIVER == "pyodbc":
                    # pyodbc uses: mssql+pyodbc://
                    if not conn_str.startswith("mssql+pyodbc://"):
                        if conn_str.startswith("mssql://"):
                            conn_str = conn_str.replace("mssql://", "mssql+pyodbc://")
                
                self.engine = create_engine(conn_str)
            elif self.database_type == 'postgresql':
                # PostgreSQL connection string format:
                # postgresql://user:pass@host:port/database
                self.engine = create_engine(self.connection_string)
            elif self.database_type == 'mysql':
                # MySQL connection string format:
                # mysql+pymysql://user:pass@host:port/database
                self.engine = create_engine(self.connection_string)
            else:
                raise ValueError(f"Unsupported database type: {self.database_type}")
        
        return self.engine
    
    def test_connection(self) -> bool:
        """Test if connection is valid"""
        try:
            engine = self._get_engine()
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True
        except Exception as e:
            print(f"Connection test failed: {e}")
            return False
    
    def execute_query(self, query: str) -> List[Dict[str, Any]]:
        """
        Execute any query and return results as list of dicts
        Used for schema extraction queries
        
        Args:
            query: SQL query to execute
            
        Returns:
            List of row dictionaries
        """
        try:
            engine = self._get_engine()
            
            with engine.connect() as conn:
                result = conn.execute(text(query))
                columns = list(result.keys())
                rows = result.fetchall()
                
                # Convert to list of dicts
                return [dict(zip(columns, row)) for row in rows]
        except Exception as e:
            raise Exception(f"Query execution failed: {str(e)}")
    
    def execute_select(self, query: str, limit: int = 100) -> Dict[str, Any]:
        """
        Execute SELECT query and return results
        
        Args:
            query: SQL SELECT query
            limit: Maximum number of rows to return
            
        Returns:
            Dict with 'columns' and 'rows' keys
        """
        try:
            engine = self._get_engine()
            
            # Add LIMIT clause only for SELECT queries
            query_upper = query.strip().upper()
            
            # Only add LIMIT to SELECT queries (not SHOW, DESCRIBE, etc.)
            if query_upper.startswith('SELECT') and 'LIMIT' not in query_upper and 'TOP' not in query_upper:
                if self.database_type == 'sqlserver':
                    # SQL Server uses TOP
                    query = query.strip()
                    query = f"SELECT TOP {limit} " + query[6:]
                else:
                    # PostgreSQL and MySQL use LIMIT
                    query = f"{query.rstrip(';')} LIMIT {limit}"
            
            with engine.connect() as conn:
                result = conn.execute(text(query))
                columns = list(result.keys())
                rows = [list(row) for row in result.fetchall()]
                
                return {
                    'columns': columns,
                    'rows': rows
                }
        except Exception as e:
            raise Exception(f"Query execution failed: {str(e)}")
    
    def execute_action(self, query: str) -> Dict[str, Any]:
        """
        Execute a write query (INSERT, UPDATE, DELETE, EXEC, CALL) with proper commit.
        Returns affected row count and success status.
        """
        try:
            engine = self._get_engine()
            with engine.begin() as conn:  # auto-commit on success, rollback on exception
                result = conn.execute(text(query))
                affected = result.rowcount if result.rowcount is not None else 0
            return {'success': True, 'affected_rows': affected}
        except Exception as e:
            raise Exception(f"Action execution failed: {str(e)}")

    def get_tables(self) -> List[str]:
        """Get list of all tables in database"""
        try:
            engine = self._get_engine()
            
            if self.database_type == 'sqlserver':
                query = """
                    SELECT TABLE_NAME 
                    FROM INFORMATION_SCHEMA.TABLES 
                    WHERE TABLE_TYPE = 'BASE TABLE'
                    ORDER BY TABLE_NAME
                """
            elif self.database_type == 'postgresql':
                query = """
                    SELECT tablename 
                    FROM pg_tables 
                    WHERE schemaname = 'public'
                    ORDER BY tablename
                """
            elif self.database_type == 'mysql':
                query = """
                    SELECT TABLE_NAME 
                    FROM INFORMATION_SCHEMA.TABLES 
                    WHERE TABLE_SCHEMA = DATABASE()
                    ORDER BY TABLE_NAME
                """
            else:
                raise ValueError(f"Unsupported database type: {self.database_type}")
            
            with engine.connect() as conn:
                result = conn.execute(text(query))
                return [row[0] for row in result.fetchall()]
        except Exception as e:
            raise Exception(f"Failed to get tables: {str(e)}")
    
    def get_columns(self, table_name: str) -> List[Dict[str, Any]]:
        """Get columns for a specific table"""
        try:
            engine = self._get_engine()
            
            if self.database_type == 'sqlserver':
                query = f"""
                    SELECT 
                        COLUMN_NAME,
                        DATA_TYPE,
                        IS_NULLABLE,
                        COLUMN_DEFAULT
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = '{table_name}'
                    ORDER BY ORDINAL_POSITION
                """
            elif self.database_type == 'postgresql':
                query = f"""
                    SELECT 
                        column_name,
                        data_type,
                        is_nullable,
                        column_default
                    FROM information_schema.columns
                    WHERE table_name = '{table_name}'
                    ORDER BY ordinal_position
                """
            elif self.database_type == 'mysql':
                query = f"""
                    SELECT 
                        COLUMN_NAME,
                        DATA_TYPE,
                        IS_NULLABLE,
                        COLUMN_DEFAULT
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = '{table_name}'
                    AND TABLE_SCHEMA = DATABASE()
                    ORDER BY ORDINAL_POSITION
                """
            else:
                raise ValueError(f"Unsupported database type: {self.database_type}")
            
            with engine.connect() as conn:
                result = conn.execute(text(query))
                columns = []
                for row in result.fetchall():
                    columns.append({
                        'name': row[0],
                        'type': row[1],
                        'nullable': row[2] == 'YES',
                        'default': row[3]
                    })
                return columns
        except Exception as e:
            raise Exception(f"Failed to get columns for {table_name}: {str(e)}")

