# Desktop Encryption - Security Architecture

## Overview

Qognix Desktop uses **field-level encryption** with `cryptography.fernet` to protect sensitive data stored locally.

## Why Not SQLCipher?

**Decision:** Use `cryptography` library instead of SQLCipher for encryption.

**Reasons:**
1. **Cross-platform compatibility** - Works on macOS, Windows, and Linux without external dependencies
2. **No Homebrew required** - SQLCipher requires `brew install sqlcipher` which is complex
3. **Simpler deployment** - No need to compile C extensions or install system libraries
4. **Already available** - `cryptography` is already a dependency for FastAPI
5. **Sufficient security** - Field-level encryption with Fernet (AES-128) is secure for desktop use

## Encryption Approach

### What's Encrypted?
- **Database connection strings** (contains passwords, hosts, etc.)
- Any other sensitive fields can be encrypted using the same mechanism

### What's NOT Encrypted?
- Database structure (table names, schemas)
- Chat messages and SQL queries (stored in plaintext for searchability)
- Settings and preferences

This is intentional - we only encrypt what needs to be encrypted, keeping the database fast and searchable.

## Technical Implementation

### Encryption Key Derivation

```python
# 1. Get machine-specific identifier
machine_id = get_machine_id()  # IOPlatformUUID (macOS), Machine GUID (Windows), etc.
hostname = platform.node()

# 2. Create base key
base_key = SHA256(f"{machine_id}:{hostname}:db_chat_salt_v1")

# 3. Derive Fernet key using PBKDF2
kdf = PBKDF2(
    algorithm=SHA256,
    length=32,
    salt=b'qognix_desktop_v1',
    iterations=100000
)
fernet_key = base64_urlsafe_encode(kdf.derive(base_key))

# 4. Create cipher
cipher = Fernet(fernet_key)
```

### Machine-Specific Protection

The encryption key is derived from:
1. **Machine ID**
   - macOS: `IOPlatformUUID` from ioreg
   - Windows: Machine GUID from WMIC
   - Linux: `/etc/machine-id`
   - Fallback: MAC address

2. **Hostname**
   - Additional uniqueness factor
   - Changes if machine is renamed

This means:
- Database file cannot be decrypted on another machine
- Database file cannot be decrypted if machine ID changes
- Each installation has a unique encryption key

### Encryption Process

```python
# Encrypting
plaintext = "postgresql://user:pass@localhost:5432/db"
encrypted = cipher.encrypt(plaintext.encode())
stored_value = encrypted.decode('utf-8')

# Decrypting
encrypted_bytes = stored_value.encode('utf-8')
decrypted = cipher.decrypt(encrypted_bytes)
plaintext = decrypted.decode('utf-8')
```

## Security Properties

### Encryption Algorithm
- **Fernet** (symmetric encryption)
- Uses **AES-128** in CBC mode
- HMAC-SHA256 for authentication
- Built-in timestamp for expiration (not used in our case)

### Key Derivation
- **PBKDF2** with 100,000 iterations
- SHA-256 hash function
- Fixed salt for consistency (machine-specific key already provides uniqueness)

### Protection Against
✅ Database file theft - Cannot decrypt on another machine
✅ Connection string exposure - Encrypted in database
✅ Casual inspection - Cannot read with SQLite tools
✅ Memory dumps - Short-lived decrypted values

### Does NOT Protect Against
❌ Process memory inspection while running
❌ Root/admin access on the same machine
❌ Malware running with same user privileges
❌ Physical machine theft with active user session

This is **intentional and acceptable** for a desktop application. The goal is to protect against:
- Accidental file sharing
- Database backups being exposed
- Casual snooping of database files

## Usage Examples

### Basic Database Operations

```python
from encryption.cipher import get_db

# Get database instance
db = get_db()

# Save encrypted connection
conn_id = db.save_connection(
    name="Production DB",
    connection_string="postgresql://user:secret@prod.example.com:5432/mydb",
    database_type="postgresql"
)

# Retrieve and decrypt
connection = db.get_connection(conn_id)
print(connection['connection_string'])  # Decrypted automatically
```

### Manual Field Encryption

```python
from encryption.cipher import get_db

db = get_db()

# Encrypt any field
encrypted = db.encrypt_field("sensitive data")

# Decrypt any field
decrypted = db.decrypt_field(encrypted)
```

## Database Schema

```sql
-- Connections table (connection_string is encrypted)
CREATE TABLE connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    connection_string TEXT NOT NULL,  -- ENCRYPTED with Fernet
    database_type TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Other tables store data in plaintext for performance and searchability
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,           -- NOT ENCRYPTED (for search)
    sql_query TEXT,                  -- NOT ENCRYPTED (for display)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Migration from SQLCipher

If you previously used SQLCipher (with full database encryption), the new approach:

1. Uses standard SQLite (no special tools needed)
2. Encrypts only sensitive fields (connection strings)
3. Leaves messages/queries unencrypted for better performance
4. Works without Homebrew or system dependencies

**Trade-off:** Less comprehensive encryption, but:
- Much simpler to deploy
- Better performance
- Easier to debug
- Cross-platform compatible
- Sufficient for desktop security model

## Security Recommendations

### For Users
1. Use full disk encryption (FileVault on macOS, BitLocker on Windows)
2. Don't share database files
3. Keep your system updated
4. Use strong passwords for database connections

### For Developers
1. Never log decrypted connection strings
2. Clear sensitive data from memory when done
3. Use the provided `encrypt_field()` / `decrypt_field()` methods
4. Don't store encryption keys in code or config files

## Comparison: SQLCipher vs Fernet

| Feature | SQLCipher | Fernet (Current) |
|---------|-----------|------------------|
| Database encryption | Full database | Field-level only |
| External dependencies | Yes (brew install) | No |
| Cross-platform | Requires compilation | Pure Python |
| Performance | Slower (all encrypted) | Faster (selective) |
| Searchability | Limited | Full (unencrypted fields) |
| Complexity | High | Low |
| Security level | Very High | High (sufficient) |

## Future Considerations

If full database encryption is needed in the future:
1. **Option 1:** Add SQLCipher back as optional feature with fallback
2. **Option 2:** Use `sqlcipher3` Python package (pure Python, no Homebrew)
3. **Option 3:** Implement file-level encryption with OS APIs

For now, field-level encryption is the right balance of security and simplicity.

---

**Document Version:** 1.0
**Date:** 2025-12-08
**Encryption Library:** `cryptography` v41.0.7+
**Algorithm:** Fernet (AES-128-CBC + HMAC-SHA256)
