"""
Database schema extraction queries for different database types
"""
from .postgres import POSTGRES_SCHEMA_QUERIES
from .mysql import MYSQL_SCHEMA_QUERIES
from .mssql import MSSQL_SCHEMA_QUERIES

__all__ = ['POSTGRES_SCHEMA_QUERIES', 'MYSQL_SCHEMA_QUERIES', 'MSSQL_SCHEMA_QUERIES']

