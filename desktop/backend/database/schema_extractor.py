"""
Schema Extractor
Extracts database schema and formats it for AI consumption
Uses comprehensive schema queries from schemas/ folder
"""
from typing import List, Dict, Any
from database.connection import DatabaseConnection
from database.schemas.postgres import POSTGRES_SCHEMA_QUERIES
from database.schemas.mysql import MYSQL_SCHEMA_QUERIES
from database.schemas.mssql import MSSQL_SCHEMA_QUERIES

class SchemaExtractor:
    """Extract and format database schema"""
    
    def __init__(self, db: DatabaseConnection):
        self.db = db
        self.db_type = db.database_type.lower()
    
    def get_full_schema_text(self) -> str:
        """
        Get complete schema as formatted text using database-specific queries
        Includes: tables, columns, primary keys, foreign keys, indexes, constraints, views, enums
        
        Returns:
            Formatted schema text ready for AI
        """
        try:
            # Select appropriate query based on database type
            if self.db_type == 'postgresql':
                query = POSTGRES_SCHEMA_QUERIES['full_schema']
            elif self.db_type == 'mysql':
                query = MYSQL_SCHEMA_QUERIES['full_schema']
            elif self.db_type in ['mssql', 'sqlserver']:
                query = MSSQL_SCHEMA_QUERIES['full_schema']
            else:
                # Fallback to basic schema
                return self._get_basic_schema()
            
            # Execute the full schema query
            result = self.db.execute_query(query)
            
            if result and len(result) > 0:
                # The query returns a single row with the full schema text
                # Try different case variations
                row = result[0]
                schema_text = (
                    row.get('FullSchemaText') or 
                    row.get('fullschematext') or 
                    row.get('full_schema_text') or
                    row.get('FULLSCHEMATEXT') or
                    ''
                )
                
                if schema_text:
                    return schema_text
                else:
                    print(f"Warning: Schema query returned empty result. Keys: {row.keys()}")
                    return self._get_basic_schema()
            else:
                print(f"Warning: Schema query returned no rows for {self.db_type}")
                return self._get_basic_schema()
                
        except Exception as e:
            print(f"Error getting full schema for {self.db_type}: {e}")
            import traceback
            traceback.print_exc()
            # Fallback to basic schema
            return self._get_basic_schema()
    
    def _get_basic_schema(self) -> str:
        """Fallback method: Get basic schema (tables and columns only)"""
        try:
            schema = self.get_schema()
            return self.format_for_ai(schema)
        except Exception as e:
            print(f"Error in basic schema: {e}")
            return "Schema unavailable"
    
    def get_schema(self) -> List[Dict[str, Any]]:
        """
        Extract complete schema from database (basic version)
        
        Returns:
            List of tables with their columns
        """
        tables = self.db.get_tables()
        schema = []
        
        for table_name in tables:
            columns = self.db.get_columns(table_name)
            schema.append({
                'table_name': table_name,
                'columns': columns
            })
        
        return schema
    
    def format_for_ai(self, schema: List[Dict[str, Any]]) -> str:
        """
        Format schema as text for AI prompt
        
        Args:
            schema: Schema from get_schema()
            
        Returns:
            Formatted schema text
        """
        lines = ["DATABASE SCHEMA:\n"]
        
        for table in schema:
            lines.append(f"\nTable: {table['table_name']}")
            lines.append("Columns:")
            
            for col in table['columns']:
                nullable = "NULL" if col['nullable'] else "NOT NULL"
                default = f" DEFAULT {col['default']}" if col['default'] else ""
                lines.append(f"  - {col['name']}: {col['type']} {nullable}{default}")
        
        return "\n".join(lines)
    
    def get_table_info(self, table_name: str) -> Dict[str, Any]:
        """Get detailed information about a specific table"""
        columns = self.db.get_columns(table_name)
        return {
            'table_name': table_name,
            'columns': columns,
            'column_count': len(columns)
        }
    
    def get_tables_list(self) -> List[str]:
        """Get list of all table names"""
        try:
            if self.db_type == 'postgresql':
                query = POSTGRES_SCHEMA_QUERIES['tables']
            elif self.db_type == 'mysql':
                query = MYSQL_SCHEMA_QUERIES['tables']
            elif self.db_type in ['mssql', 'sqlserver']:
                query = MSSQL_SCHEMA_QUERIES['tables']
            else:
                return self.db.get_tables()
            
            result = self.db.execute_query(query)
            return [row.get('table_name') or row.get('tablename') for row in result]
        except:
            return self.db.get_tables()
    
    def get_enums(self) -> Dict[str, List[str]]:
        """Get enum types (PostgreSQL) or enum columns (MySQL/MSSQL)"""
        try:
            if self.db_type == 'postgresql':
                query = POSTGRES_SCHEMA_QUERIES['enums']
            elif self.db_type == 'mysql':
                query = MYSQL_SCHEMA_QUERIES['enums']
            elif self.db_type in ['mssql', 'sqlserver']:
                query = MSSQL_SCHEMA_QUERIES['enums']
            else:
                return {}
            
            result = self.db.execute_query(query)
            enums = {}
            
            for row in result:
                enum_name = row.get('enum_name')
                enum_values = row.get('enum_values')
                if enum_name and enum_values:
                    # Parse enum values (they come as comma-separated string)
                    values = [v.strip() for v in enum_values.split(',')]
                    enums[enum_name] = values
            
            return enums
        except Exception as e:
            print(f"Error getting enums: {e}")
            return {}
