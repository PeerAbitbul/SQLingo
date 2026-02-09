"""
Permission Error Detection and Helper Utilities
Detects database permission errors and provides helpful grant scripts
"""

def is_permission_error(error_message: str, db_type: str) -> bool:
    """
    Detect if an error is permission-related based on error message and database type

    Args:
        error_message: The error message from the database
        db_type: The database type ('postgresql', 'mysql', 'mssql', 'sqlserver')

    Returns:
        True if the error is permission-related, False otherwise
    """
    error_lower = str(error_message).lower()

    # Common permission error keywords across databases
    permission_keywords = [
        'permission denied',
        'access denied',
        'insufficient privileges',
        'insufficient permission',
        'authorization',
        'not authorized',
        'cannot access',
        'denied',
        'privilege',
    ]

    # Database-specific permission error patterns
    db_specific_patterns = {
        'postgresql': [
            'must be owner',
            'must have',
            'pg_',
        ],
        'mysql': [
            'access denied for user',
            'select command denied',
            'execute command denied',
        ],
        'mssql': [
            'permission was denied',
            'select permission denied',
            'view definition permission',
            'view database state',
        ],
        'sqlserver': [
            'permission was denied',
            'select permission denied',
            'view definition permission',
            'view database state',
        ],
    }

    # Check common keywords
    for keyword in permission_keywords:
        if keyword in error_lower:
            return True

    # Check database-specific patterns
    db_patterns = db_specific_patterns.get(db_type.lower(), [])
    for pattern in db_patterns:
        if pattern in error_lower:
            return True

    return False


def get_permission_error_response(error_type: str, db_type: str, database_name: str = None) -> dict:
    """
    Generate a helpful error message with SQL grant scripts for permission errors

    Args:
        error_type: Type of permission needed ('schema', 'procedures', 'database_info')
        db_type: The database type ('postgresql', 'mysql', 'mssql', 'sqlserver')
        database_name: Optional database name to include in scripts

    Returns:
        Dictionary with 'message' and 'grant_script' keys
    """
    db_type = db_type.lower()
    db_name = database_name or '<database_name>'

    if error_type == 'schema':
        return _get_schema_permission_message(db_type, db_name)
    elif error_type == 'procedures':
        return _get_procedures_permission_message(db_type, db_name)
    elif error_type == 'database_info':
        return _get_database_info_permission_message(db_type, db_name)
    else:
        return {
            'message': 'Permission denied. Please contact your database administrator.',
            'grant_script': ''
        }


def _get_schema_permission_message(db_type: str, db_name: str) -> dict:
    """Generate permission message for schema extraction"""

    if db_type == 'postgresql':
        message = """
⚠️ Permission Denied - Schema Access Required

Your database user doesn't have sufficient permissions to read the database schema.
This is the minimum permission required for SQLingo to work properly.

Required Permissions:
  • SELECT on information_schema tables
  • USAGE on the schema

To grant the necessary permissions, your database administrator should run:
"""
        grant_script = f"""-- PostgreSQL: Grant schema read permissions
-- Replace 'your_username' with the actual database username

GRANT USAGE ON SCHEMA public TO your_username;
GRANT SELECT ON ALL TABLES IN SCHEMA information_schema TO your_username;

-- If using a custom schema (not 'public'), also grant:
GRANT USAGE ON SCHEMA {db_name} TO your_username;
"""

    elif db_type == 'mysql':
        message = """
⚠️ Permission Denied - Schema Access Required

Your database user doesn't have sufficient permissions to read the database schema.
This is the minimum permission required for SQLingo to work properly.

Required Permissions:
  • SELECT on information_schema tables
  • SHOW VIEW privilege

To grant the necessary permissions, your database administrator should run:
"""
        grant_script = f"""-- MySQL: Grant schema read permissions
-- Replace 'your_username' with the actual database username
-- Replace 'hostname' with the user's host (often 'localhost' or '%')

GRANT SELECT ON information_schema.* TO 'your_username'@'hostname';
GRANT SHOW VIEW ON {db_name}.* TO 'your_username'@'hostname';
FLUSH PRIVILEGES;
"""

    elif db_type in ['mssql', 'sqlserver']:
        message = """
⚠️ Permission Denied - Schema Access Required

Your database user doesn't have sufficient permissions to read the database schema.
This is the minimum permission required for SQLingo to work properly.

Required Permissions:
  • VIEW DEFINITION on schema objects
  • SELECT on sys.tables, sys.columns, and other system views

To grant the necessary permissions, your database administrator should run:
"""
        grant_script = f"""-- SQL Server: Grant schema read permissions
-- Replace 'your_username' with the actual database username

USE [{db_name}];
GO

-- Grant VIEW DEFINITION to see object metadata
GRANT VIEW DEFINITION TO your_username;

-- Grant SELECT on system views
GRANT SELECT ON SCHEMA::information_schema TO your_username;

-- Alternative: Add user to db_datareader role (grants read access to all tables)
EXEC sp_addrolemember 'db_datareader', 'your_username';
"""

    else:
        message = "Permission denied. Please contact your database administrator."
        grant_script = ""

    return {
        'message': message.strip(),
        'grant_script': grant_script.strip()
    }


def _get_procedures_permission_message(db_type: str, db_name: str) -> dict:
    """Generate permission message for procedures access"""

    if db_type == 'postgresql':
        message = """
⚠️ Permission Denied - Stored Procedures Access (Optional Feature)

Your database user doesn't have permissions to view stored procedures.
This is an optional feature - SQLingo will continue working for regular queries.

Required Permissions:
  • SELECT on pg_proc and related system catalogs
  • USAGE on schemas containing procedures

To enable stored procedures access, your database administrator should run:
"""
        grant_script = """-- PostgreSQL: Grant procedures read permissions
-- Replace 'your_username' with the actual database username

GRANT SELECT ON pg_proc TO your_username;
GRANT SELECT ON pg_namespace TO your_username;
GRANT SELECT ON information_schema.routines TO your_username;
GRANT SELECT ON information_schema.parameters TO your_username;
"""

    elif db_type == 'mysql':
        message = """
⚠️ Permission Denied - Stored Procedures Access (Optional Feature)

Your database user doesn't have permissions to view stored procedures.
This is an optional feature - SQLingo will continue working for regular queries.

Required Permissions:
  • SELECT on information_schema.routines
  • SHOW VIEW privilege

To enable stored procedures access, your database administrator should run:
"""
        grant_script = f"""-- MySQL: Grant procedures read permissions
-- Replace 'your_username' with the actual database username
-- Replace 'hostname' with the user's host (often 'localhost' or '%')

GRANT SELECT ON information_schema.routines TO 'your_username'@'hostname';
GRANT SELECT ON mysql.proc TO 'your_username'@'hostname';
FLUSH PRIVILEGES;
"""

    elif db_type in ['mssql', 'sqlserver']:
        message = """
⚠️ Permission Denied - Stored Procedures Access (Optional Feature)

Your database user doesn't have permissions to view stored procedures.
This is an optional feature - SQLingo will continue working for regular queries.

Required Permissions:
  • VIEW DEFINITION on stored procedures
  • SELECT on sys.procedures and sys.sql_modules

To enable stored procedures access, your database administrator should run:
"""
        grant_script = f"""-- SQL Server: Grant procedures read permissions
-- Replace 'your_username' with the actual database username

USE [{db_name}];
GO

-- Grant VIEW DEFINITION to see procedure definitions
GRANT VIEW DEFINITION TO your_username;

-- Grant SELECT on system views for procedures
GRANT SELECT ON sys.procedures TO your_username;
GRANT SELECT ON sys.sql_modules TO your_username;
GRANT SELECT ON sys.parameters TO your_username;
"""

    else:
        message = "Permission denied. Please contact your database administrator."
        grant_script = ""

    return {
        'message': message.strip(),
        'grant_script': grant_script.strip()
    }


def _get_database_info_permission_message(db_type: str, db_name: str) -> dict:
    """Generate permission message for database info access"""

    if db_type == 'postgresql':
        message = """
⚠️ Permission Denied - Database Properties Access (Optional Feature)

Your database user doesn't have permissions to view database properties.
This is an optional feature - SQLingo will continue working for regular queries.

Required Permissions:
  • SELECT on pg_database
  • Access to database file information

To enable database properties access, your database administrator should run:
"""
        grant_script = """-- PostgreSQL: Grant database info read permissions
-- Replace 'your_username' with the actual database username

GRANT SELECT ON pg_database TO your_username;
GRANT pg_read_all_stats TO your_username;

-- For database size information
GRANT EXECUTE ON FUNCTION pg_database_size(name) TO your_username;
GRANT EXECUTE ON FUNCTION pg_size_pretty(bigint) TO your_username;
"""

    elif db_type == 'mysql':
        message = """
⚠️ Permission Denied - Database Properties Access (Optional Feature)

Your database user doesn't have permissions to view database properties.
This is an optional feature - SQLingo will continue working for regular queries.

Required Permissions:
  • SELECT on information_schema.schemata
  • SELECT on information_schema.tables

To enable database properties access, your database administrator should run:
"""
        grant_script = """-- MySQL: Grant database info read permissions
-- Replace 'your_username' with the actual database username
-- Replace 'hostname' with the user's host (often 'localhost' or '%')

GRANT SELECT ON information_schema.schemata TO 'your_username'@'hostname';
GRANT SELECT ON information_schema.tables TO 'your_username'@'hostname';
FLUSH PRIVILEGES;
"""

    elif db_type in ['mssql', 'sqlserver']:
        message = """
⚠️ Permission Denied - Database Properties Access (Optional Feature)

Your database user doesn't have permissions to view database properties.
This is an optional feature - SQLingo will continue working for regular queries.

Required Permissions:
  • VIEW DATABASE STATE
  • SELECT on sys.databases and sys.master_files

To enable database properties access, your database administrator should run:
"""
        grant_script = f"""-- SQL Server: Grant database info read permissions
-- Replace 'your_username' with the actual database username

USE [{db_name}];
GO

-- Grant VIEW DATABASE STATE to see database properties
GRANT VIEW DATABASE STATE TO your_username;

-- Grant SELECT on system views
GRANT SELECT ON sys.databases TO your_username;
GRANT SELECT ON sys.master_files TO your_username;
"""

    else:
        message = "Permission denied. Please contact your database administrator."
        grant_script = ""

    return {
        'message': message.strip(),
        'grant_script': grant_script.strip()
    }
