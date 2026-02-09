# Database Connection Guide

## How Connections Work

Instead of manually entering complex connection strings, DB Chat provides a simple form where you enter:

- **Connection Name** - A friendly name for this connection
- **Database Type** - SQL Server, PostgreSQL, or MySQL
- **Host/Server** - Server address (e.g., `localhost`, `192.168.1.100`)
- **Port** - Database port (auto-filled with defaults)
- **Database Name** - The database you want to connect to
- **Username** - Database user
- **Password** - Database password

The application automatically builds the correct connection string behind the scenes.

---

## Default Ports

The application automatically sets the correct port when you select a database type:

| Database Type | Default Port |
|--------------|--------------|
| SQL Server   | 1433         |
| PostgreSQL   | 5432         |
| MySQL        | 3306         |

You can change the port if your database uses a different one.

---

## Connection String Format (Auto-Generated)

The application builds connection strings in the following formats:

### SQL Server
```
mssql+mssqlpython://username:password@host:port/database
```

Example:
```
mssql+mssqlpython://sa:MyPassword123@localhost:1433/MyDatabase
```

### PostgreSQL
```
postgresql://username:password@host:port/database
```

Example:
```
postgresql://postgres:MyPassword123@localhost:5432/MyDatabase
```

### MySQL
```
mysql+pymysql://username:password@host:port/database
```

Example:
```
mysql+pymysql://root:MyPassword123@localhost:3306/MyDatabase
```

---

## Adding a Connection

1. Click the **Connection** icon in the header
2. Click **+ Add New Connection**
3. Fill in the form:
   - **Connection Name**: `My Production DB`
   - **Database Type**: Select from dropdown
   - **Host**: `localhost` or IP address
   - **Port**: Auto-filled (can be changed)
   - **Database Name**: Your database name
   - **Username**: Database user
   - **Password**: Database password
4. Click **Test Connection** to verify (optional)
5. Click **Save**

---

## Testing a Connection

Before saving, you can test the connection:

1. Fill in all connection details
2. Click **Test Connection**
3. Wait for the result:
   - **Success**: "Connection successful!"
   - **Failure**: Error message with details

---

## Managing Connections

### Selecting a Connection
- Click on a connection card to make it active
- The active connection is highlighted
- All queries will use the active connection

### Deleting a Connection
- Click **Delete** on the connection card
- Confirm deletion
- The connection is removed permanently

### Editing a Connection
Currently, you need to:
1. Delete the old connection
2. Create a new one with updated details

(Edit functionality coming soon!)

---

## Security Notes

### Password Storage
- Passwords are stored locally in your browser
- They are NOT encrypted (yet)
- Do NOT use this on shared computers with sensitive data

### Future Improvements
- SQLCipher encryption for local storage
- Password masking in connection list
- Secure credential storage

---

## Connection Examples

### Local SQL Server (Windows Authentication)
```
Name: Local SQL Server
Type: SQL Server
Host: localhost
Port: 1433
Database: MyDatabase
Username: sa
Password: YourPassword
```

### Remote PostgreSQL
```
Name: Production PostgreSQL
Type: PostgreSQL
Host: 192.168.1.100
Port: 5432
Database: production_db
Username: postgres
Password: SecurePassword123
```

### MySQL on Docker
```
Name: Docker MySQL
Type: MySQL
Host: localhost
Port: 3307
Database: test_db
Username: root
Password: root
```

---

## Troubleshooting

### Connection Failed

**Check:**
1. Database server is running
2. Host/IP is correct
3. Port is correct
4. Database exists
5. Username/password are correct
6. Firewall allows connection

### Wrong Port

**Solution:**
- SQL Server: Usually 1433
- PostgreSQL: Usually 5432
- MySQL: Usually 3306
- Check your database configuration

### Authentication Failed

**Solution:**
- Verify username and password
- Check user permissions
- For SQL Server: Enable SQL Server authentication
- For PostgreSQL: Check `pg_hba.conf`
- For MySQL: Check user grants

### Cannot Connect to Remote Server

**Solution:**
- Check firewall rules
- Verify server allows remote connections
- For SQL Server: Enable TCP/IP in SQL Server Configuration Manager
- For PostgreSQL: Edit `postgresql.conf` and `pg_hba.conf`
- For MySQL: Check `bind-address` in `my.cnf`

---

## Best Practices

1. **Use descriptive names** - "Production DB", "Dev MySQL", etc.
2. **Test before saving** - Always test the connection first
3. **Keep passwords secure** - Don't use sensitive passwords on shared machines
4. **Use read-only users** - For safety, use database users with limited permissions
5. **Document your connections** - Keep a separate note of what each connection is for

---

## Advanced: Manual Connection Strings

If you need to use advanced connection string parameters, you can:

1. Build the connection string manually
2. Use it directly in the backend API
3. Or modify the `buildConnectionString` function in `connectionStore.ts`

Example with SSL:
```
postgresql://user:pass@host:5432/db?sslmode=require
```

---

## Support

For connection issues:
1. Check backend logs: `desktop/backend/logs/`
2. Check browser console (F12)
3. Verify database server logs
4. Test connection with a database client first (e.g., DBeaver, pgAdmin)

---

**Connection management made simple!**

