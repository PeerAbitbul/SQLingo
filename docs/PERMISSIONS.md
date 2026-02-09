# Qognix - Minimum Database Permissions Required

This document outlines the minimum permissions required for Qognix to function properly across different database systems.

## Security Philosophy

> **"Give Qognix just enough to do its job, but never enough to break anything"**

Qognix follows the **Principle of Least Privilege**. Even with all permissions granted, Qognix is **READ-ONLY** and cannot:

- ❌ Modify, insert, or delete data (no INSERT, UPDATE, DELETE)
- ❌ Change database structure (no CREATE, ALTER, DROP)
- ❌ Execute stored procedures (can only read their definitions)
- ❌ Grant permissions to other users
- ❌ Perform backups or restores
- ❌ Access server-level configurations

**What Qognix CAN do:**
- ✅ Read schema metadata (tables, columns, views, enums)
- ✅ Read stored procedure definitions (source code only)
- ✅ Query data from tables (SELECT only)
- ✅ View database properties (size, owner, creation date)

This makes Qognix safe for production environments and compliant with security standards like SOC2, ISO27001, and GDPR.

---

## Overview

Qognix requires specific database permissions to access schema information, stored procedures, and database metadata. The permissions are categorized into three levels:

1. **Required (Critical)** - Without these, Qognix cannot function
2. **Recommended** - Enables full functionality including stored procedures
3. **Optional** - Provides additional metadata like database properties

---

## SQL Server / Azure SQL

### Required Permissions (Minimum for Core Functionality)

These permissions are **essential** for Qognix to work:

```sql
-- Replace 'qognix_user' with your actual username
USE [YourDatabaseName];
GO

-- Grant VIEW DEFINITION to see schema metadata
GRANT VIEW DEFINITION TO qognix_user;

-- Grant SELECT on system schema views
GRANT SELECT ON SCHEMA::information_schema TO qognix_user;

-- Alternative: Add user to db_datareader role
-- This grants read access to all user tables
EXEC sp_addrolemember 'db_datareader', 'qognix_user';
GO
```

### Recommended Permissions (For Stored Procedures)

Add these for full stored procedures support:

```sql
USE [YourDatabaseName];
GO

-- Grant SELECT on system views for procedures
GRANT SELECT ON sys.procedures TO qognix_user;
GRANT SELECT ON sys.sql_modules TO qognix_user;
GRANT SELECT ON sys.parameters TO qognix_user;
GO
```

### Optional Permissions (For Database Properties)

Add these for database metadata (owner, size, etc.):

```sql
USE [YourDatabaseName];
GO

-- Grant VIEW DATABASE STATE
GRANT VIEW DATABASE STATE TO qognix_user;

-- Grant SELECT on database system views
GRANT SELECT ON sys.databases TO qognix_user;
GRANT SELECT ON sys.master_files TO qognix_user;
GO
```

### Complete Setup Example (All Permissions)

```sql
USE [YourDatabaseName];
GO

-- Core permissions
GRANT VIEW DEFINITION TO qognix_user;
GRANT SELECT ON SCHEMA::information_schema TO qognix_user;
EXEC sp_addrolemember 'db_datareader', 'qognix_user';

-- Stored procedures permissions
GRANT SELECT ON sys.procedures TO qognix_user;
GRANT SELECT ON sys.sql_modules TO qognix_user;
GRANT SELECT ON sys.parameters TO qognix_user;

-- Database properties permissions
GRANT VIEW DATABASE STATE TO qognix_user;
GRANT SELECT ON sys.databases TO qognix_user;
GRANT SELECT ON sys.master_files TO qognix_user;
GO
```

---

## PostgreSQL

### Required Permissions (Minimum for Core Functionality)

These permissions are **essential** for Qognix to work:

```sql
-- Replace 'qognix_user' with your actual username

-- Grant USAGE on the schema (usually 'public')
GRANT USAGE ON SCHEMA public TO qognix_user;

-- Grant SELECT on information_schema tables
GRANT SELECT ON ALL TABLES IN SCHEMA information_schema TO qognix_user;

-- If using a custom schema (not 'public'), also grant:
GRANT USAGE ON SCHEMA your_schema_name TO qognix_user;
```

### Recommended Permissions (For Stored Procedures)

Add these for full stored procedures support:

```sql
-- Grant SELECT on procedure-related system catalogs
GRANT SELECT ON pg_proc TO qognix_user;
GRANT SELECT ON pg_namespace TO qognix_user;
GRANT SELECT ON information_schema.routines TO qognix_user;
GRANT SELECT ON information_schema.parameters TO qognix_user;
```

### Optional Permissions (For Database Properties)

Add these for database metadata (owner, size, etc.):

```sql
-- Grant SELECT on database system catalog
GRANT SELECT ON pg_database TO qognix_user;

-- Grant statistics reading role
GRANT pg_read_all_stats TO qognix_user;

-- Grant EXECUTE on size functions
GRANT EXECUTE ON FUNCTION pg_database_size(name) TO qognix_user;
GRANT EXECUTE ON FUNCTION pg_size_pretty(bigint) TO qognix_user;
```

### Complete Setup Example (All Permissions)

```sql
-- Core permissions
GRANT USAGE ON SCHEMA public TO qognix_user;
GRANT SELECT ON ALL TABLES IN SCHEMA information_schema TO qognix_user;

-- Stored procedures permissions
GRANT SELECT ON pg_proc TO qognix_user;
GRANT SELECT ON pg_namespace TO qognix_user;
GRANT SELECT ON information_schema.routines TO qognix_user;
GRANT SELECT ON information_schema.parameters TO qognix_user;

-- Database properties permissions
GRANT SELECT ON pg_database TO qognix_user;
GRANT pg_read_all_stats TO qognix_user;
GRANT EXECUTE ON FUNCTION pg_database_size(name) TO qognix_user;
GRANT EXECUTE ON FUNCTION pg_size_pretty(bigint) TO qognix_user;
```

---

## MySQL / MariaDB

### Required Permissions (Minimum for Core Functionality)

These permissions are **essential** for Qognix to work:

```sql
-- Replace 'qognix_user' with your actual username
-- Replace 'hostname' with the user's host (often 'localhost' or '%')

-- Grant SELECT on information_schema
GRANT SELECT ON information_schema.* TO 'qognix_user'@'hostname';

-- Grant SHOW VIEW privilege
GRANT SHOW VIEW ON YourDatabaseName.* TO 'qognix_user'@'hostname';

-- Apply changes
FLUSH PRIVILEGES;
```

### Recommended Permissions (For Stored Procedures)

Add these for full stored procedures support:

```sql
-- Grant SELECT on routines information
GRANT SELECT ON information_schema.routines TO 'qognix_user'@'hostname';

-- Grant SELECT on mysql.proc (if accessible)
GRANT SELECT ON mysql.proc TO 'qognix_user'@'hostname';

FLUSH PRIVILEGES;
```

### Optional Permissions (For Database Properties)

Add these for database metadata (owner, size, etc.):

```sql
-- Grant SELECT on schema and table information
GRANT SELECT ON information_schema.schemata TO 'qognix_user'@'hostname';
GRANT SELECT ON information_schema.tables TO 'qognix_user'@'hostname';

FLUSH PRIVILEGES;
```

### Complete Setup Example (All Permissions)

```sql
-- Core permissions
GRANT SELECT ON information_schema.* TO 'qognix_user'@'hostname';
GRANT SHOW VIEW ON YourDatabaseName.* TO 'qognix_user'@'hostname';

-- Stored procedures permissions
GRANT SELECT ON information_schema.routines TO 'qognix_user'@'hostname';
GRANT SELECT ON mysql.proc TO 'qognix_user'@'hostname';

-- Database properties permissions
GRANT SELECT ON information_schema.schemata TO 'qognix_user'@'hostname';
GRANT SELECT ON information_schema.tables TO 'qognix_user'@'hostname';

FLUSH PRIVILEGES;
```

---

## Creating a Dedicated Qognix User

### SQL Server

```sql
-- Create login (server level)
CREATE LOGIN qognix_user WITH PASSWORD = 'YourSecurePassword123!';
GO

-- Create user in your database
USE [YourDatabaseName];
GO
CREATE USER qognix_user FOR LOGIN qognix_user;
GO

-- Then apply the permissions from the sections above
```

### PostgreSQL

```sql
-- Create user
CREATE USER qognix_user WITH PASSWORD 'YourSecurePassword123!';

-- Then apply the permissions from the sections above
```

### MySQL

```sql
-- Create user
CREATE USER 'qognix_user'@'localhost' IDENTIFIED BY 'YourSecurePassword123!';

-- Or for remote access:
CREATE USER 'qognix_user'@'%' IDENTIFIED BY 'YourSecurePassword123!';

-- Then apply the permissions from the sections above
```

---

## Permission Levels Summary

| Feature | SQL Server | PostgreSQL | MySQL |
|---------|-----------|------------|-------|
| **Schema Reading** (Required) | VIEW DEFINITION, SELECT on information_schema | USAGE on schema, SELECT on information_schema | SELECT on information_schema, SHOW VIEW |
| **Stored Procedures** (Recommended) | SELECT on sys.procedures, sys.sql_modules | SELECT on pg_proc, information_schema.routines | SELECT on information_schema.routines, mysql.proc |
| **Database Properties** (Optional) | VIEW DATABASE STATE, SELECT on sys.databases | SELECT on pg_database, pg_read_all_stats | SELECT on information_schema.schemata, tables |

---

## Troubleshooting Permission Errors

If you encounter permission errors:

1. **Check Current Permissions**:
   - SQL Server: `EXECUTE AS USER = 'qognix_user'; SELECT * FROM fn_my_permissions(NULL, 'DATABASE'); REVERT;`
   - PostgreSQL: `\du qognix_user` (in psql)
   - MySQL: `SHOW GRANTS FOR 'qognix_user'@'hostname';`

2. **Error Messages**: Qognix will display helpful error messages with the exact permissions needed and SQL scripts to grant them.

3. **Minimum Test**: Try connecting with just the **Required Permissions** first. If Qognix works, you can add Recommended and Optional permissions later.

---

## Security Best Practices

1. **Use Dedicated User**: Create a separate database user specifically for Qognix
2. **Least Privilege**: Start with minimum required permissions and add more only if needed
3. **Read-Only Access**: Qognix only needs read permissions - never grant INSERT, UPDATE, DELETE, or DDL permissions
4. **Strong Passwords**: Use strong, unique passwords for database users
5. **Connection Strings**: Store connection strings securely, never in source code
6. **Regular Audits**: Periodically review granted permissions

---

## Notes

- Qognix will continue to work even if optional permissions are missing
- Schema reading permissions are **mandatory** - without them, Qognix cannot function
- Stored procedures and database properties are **optional features** that enhance functionality
- All permissions are **read-only** - Qognix never modifies your database
