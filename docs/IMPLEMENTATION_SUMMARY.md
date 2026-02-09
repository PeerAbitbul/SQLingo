# Qognix Desktop-Only BYOK with Usage Limits - Implementation Summary

## Overview
המערכת עברה לארכיטקטורה של **Desktop-Only BYOK** עם מגבלות שימוש מבוססות tier שנאכפות ע"י השרת.

---

## Architecture

```
┌─────────────────────────────────────────┐
│         DESKTOP APP (Client)            │
│  - BYOK AI calls only                   │
│  - Local SQLite (encrypted)            │
│  - Must connect to cloud for validation │
└─────────────────────────────────────────┘
              ↕️
┌─────────────────────────────────────────┐
│      CLOUD PORTAL (Authority)           │
│  - Device registration                  │
│  - Usage validation                     │
│  - Tier management                      │
│  - No AI calls                          │
└─────────────────────────────────────────┘
```

---

## Tier System

| Tier | Login | Messages/Month | Connections | Execution Plan | Notes |
|------|-------|----------------|-------------|----------------|-------|
| **Anonymous** | ❌ | 5 (lifetime) | 1 | ❌ | Trial mode |
| **Free** | ✅ | 25 | 1 | ❌ | Free account |
| **Pro** | ✅ | 500 | ∞ | ✅ | Paid |
| **Enterprise** | ✅ | ∞ | ∞ | ✅ | Paid |

---

## Implementation Details

### Cloud Server (Portal)

#### 1. New Database Models (`server/backend/database/models.py`)

```python
# Added 3 new enums:
class TierType(str, enum.Enum):
    ANONYMOUS = "anonymous"
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"

class DeviceStatus(str, enum.Enum):
    ACTIVE = "active"
    BLOCKED = "blocked"
    SUSPENDED = "suspended"

# Added 3 new tables:
class Device:
    - device_uuid (primary key)
    - hardware_id (indexed) - permanent identifier
    - user_id (nullable)
    - device_name, os, app_version
    - status, blocked_reason
    - first_seen, last_seen
    - registration_ip, last_ip

class DeviceUsage:
    - usage_id (primary key)
    - device_uuid (foreign key)
    - user_id (nullable)
    - tier (enum)
    - messages_used, messages_limit
    - period_start, period_end (30 days)

class UsageLog:
    - log_id (primary key)
    - device_uuid (foreign key)
    - ai_provider, tier
    - success, error_message
    - timestamp
```

#### 2. Device Query Functions (`server/backend/database/device_queries.py`)

- `register_device()` - רישום מכשיר חדש או עדכון קיים
- `get_device_by_uuid()` / `get_device_by_hardware_id()` - שליפת מידע על מכשיר
- `get_current_usage()` - שליפת שימוש נוכחי
- `initialize_usage()` - אתחול תקופת שימוש חדשה
- `increment_usage()` - הגדלת מונה הודעות
- `check_usage_limit()` - בדיקת מגבלה
- `block_device()` - חסימת מכשיר
- `reset_expired_usage()` - איפוס תקופות שפג תוקפן

#### 3. API Endpoints (`server/backend/api/devices.py`)

```python
POST /api/devices/register
  - Register device on first launch
  - Returns: tier, messages_used, messages_limit

POST /api/devices/validate
  - CRITICAL: Called BEFORE every query
  - Validates if user can make query
  - Returns: allowed, tier, limits, execution_plan_allowed

POST /api/devices/increment
  - Called AFTER successful query
  - Increments usage counter

POST /api/devices/link-user
  - Link device to authenticated user
  - Called after login
```

#### 4. Registration in Main (`server/backend/main.py`)

```python
from api.devices import router as devices_router
app.include_router(devices_router, prefix="/api/devices", tags=["Device Management"])
```

---

### Desktop App (Client)

#### 1. Device ID Generation (`desktop/backend/device_id.py`)

```python
# Two identifiers:
- device_uuid: UUID stored in SQLite (can change if app deleted)
- hardware_id: SHA256 hash of MAC address (permanent)

get_mac_address() - Extracts MAC from network interface
get_hardware_id() - Hashes MAC for privacy
get_device_uuid() - Gets/creates UUID from SQLite
get_device_identifiers() - Returns both
```

#### 2. SQLite Schema Updates (`desktop/backend/encryption/cipher.py`)

Added 3 new tables to encrypted SQLite:

```sql
-- Device info (single row)
CREATE TABLE device_info (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    device_uuid TEXT UNIQUE NOT NULL,
    hardware_id TEXT NOT NULL,
    device_name TEXT,
    registered_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- User state (single row)
CREATE TABLE user_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    jwt_token TEXT,
    user_email TEXT,
    user_id TEXT,
    tier TEXT NOT NULL DEFAULT 'anonymous',
    messages_used INTEGER DEFAULT 0,
    messages_limit INTEGER DEFAULT 5,
    connections_limit INTEGER DEFAULT 1,
    execution_plan_allowed INTEGER DEFAULT 0,
    period_end TIMESTAMP,
    last_validated TIMESTAMP,
    last_synced TIMESTAMP,
    updated_at TIMESTAMP
);

-- Message log
CREATE TABLE message_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT,
    ai_provider TEXT,
    success INTEGER DEFAULT 1,
    synced INTEGER DEFAULT 0,
    timestamp TIMESTAMP
);

-- Indexes
CREATE INDEX idx_message_log_timestamp ON message_log(timestamp);
CREATE INDEX idx_message_log_synced ON message_log(synced);
```

#### 3. Cloud Client (`desktop/backend/cloud_client.py`)

```python
class CloudClient:
    base_url = "http://localhost:8001" (or CLOUD_API_URL env var)

    register_device() - Register on startup
    validate_usage() - Validate before query
    increment_usage() - Increment after query
    link_device_to_user() - Link after login
```

#### 4. Startup Registration (`desktop/backend/startup.py`)

```python
async def register_device_on_startup():
    1. Get device_uuid + hardware_id
    2. Register with cloud
    3. Store tier info in local SQLite
    4. Print status

init_on_startup() - Synchronous wrapper for main.py
```

#### 5. Backend Routes Updates (`desktop/backend/api/routes.py`)

```python
# Added helper functions:
async def validate_with_cloud(jwt_token):
    - Calls cloud /validate endpoint
    - Raises HTTPException 403 if limit reached
    - Raises HTTPException 503 if cloud unreachable

async def increment_usage_in_cloud(ai_provider, success, error, jwt_token):
    - Calls cloud /increment endpoint
    - Non-blocking, logs errors only

# Updated /chat/query endpoint:
@router.post("/chat/query")
async def generate_sql(request):
    # STEP 1: Validate with cloud (BLOCKING)
    validation = await validate_with_cloud()

    # ... existing SQL generation logic ...

    # STEP 2: Increment usage (AFTER success)
    await increment_usage_in_cloud(
        ai_provider=request.ai_provider,
        success=True
    )

    return ChatResponse(...)
```

#### 6. Main App Updates (`desktop/backend/main.py`)

```python
from startup import init_on_startup

if __name__ == "__main__":
    # Register device on startup
    print("[INFO] Registering device with Qognix cloud...")
    init_on_startup()

    # ... rest of startup ...
```

---

## Flow Diagrams

### First Launch Flow

```
1. User opens Desktop App
2. Desktop backend starts → startup.py runs
3. register_device_on_startup():
   - Generates device_uuid (new) + hardware_id (MAC hash)
   - Saves to local SQLite
   - Calls POST /api/devices/register
4. Cloud server:
   - Checks if hardware_id exists
   - If new: Creates Device + DeviceUsage (tier=anonymous, limit=5)
   - If exists: Returns existing usage
   - Returns: { tier, messages_used, messages_limit }
5. Desktop stores tier info in local SQLite
6. App ready - User has 5 trial messages
```

### Query Flow

```
1. User types question in chat
2. Frontend calls POST /api/chat/query
3. Backend route handler:
   ┌─────────────────────────────────────┐
   │ STEP 1: validate_with_cloud()      │
   │ - Get device_uuid + hardware_id     │
   │ - POST /api/devices/validate        │
   │ - Cloud checks: messages_used < limit? │
   │ - If NO: Raise HTTPException 403    │
   │ - If YES: Continue                  │
   └─────────────────────────────────────┘
4. Generate SQL (BYOK AI call)
5. Return SQL to user
   ┌─────────────────────────────────────┐
   │ STEP 2: increment_usage_in_cloud() │
   │ - POST /api/devices/increment       │
   │ - Cloud: messages_used += 1         │
   │ - Cloud: Log to UsageLog            │
   └─────────────────────────────────────┘
6. Frontend displays SQL
```

### Reinstall/Delete Flow

```
Scenario: User deletes app and reinstalls
1. App deleted → device_uuid lost from SQLite
2. But: hardware_id stays the same (MAC address)
3. On reinstall:
   - New device_uuid generated
   - Same hardware_id detected
4. Cloud server (in register_device):
   - Finds existing Device by hardware_id
   - Updates device_uuid to new one
   - Returns EXISTING usage data
   Result: User still has same usage limits!
```

---

## Security Features

### Device Identification
- **hardware_id**: SHA256 hash of MAC address (permanent, cannot delete)
- **device_uuid**: Random UUID (can change, but tracked by hardware_id)
- Cloud links both → prevents limit bypass by reinstalling

### Encryption
- Local SQLite encrypted with Fernet (machine-specific key)
- Connection strings encrypted
- Database file hidden in OS-specific location:
  - macOS: `~/Library/Application Support/Qognix/.qognix.db`
  - Windows: `%APPDATA%/Qognix/.qognix.db`
  - Linux: `~/.config/qognix/.qognix.db`

### Online Requirement
- **CRITICAL**: App REQUIRES internet connection
- No offline mode
- Every query validated by cloud before execution
- If cloud unreachable → HTTP 503, query blocked

---

## What's Still TODO (Frontend)

### 1. Pass JWT Token to Backend
Currently: `jwt_token=None` in validation calls

Need to:
- Get JWT from `authStore` in frontend
- Pass it in API calls to backend
- Backend includes it in cloud validation

### 2. Update ChatInput Component
File: `desktop/frontend/src/components/ChatInput.tsx`

Add:
```typescript
// Before sending query:
1. Check if user is logged in (has JWT)
2. If not logged in: Show "Login to upgrade" prompt
3. Pass JWT token in API call
```

### 3. Add Usage Display UI
Create component showing:
```
Messages: 3/5 remaining (Anonymous)
[Sign Up for 25 Messages/Month] button
```

Or for paid users:
```
Messages: 450/500 remaining (Pro)
Period resets: Jan 15, 2025
```

### 4. Block Execution Plan for Free Users
File: `desktop/frontend/src/components/ChatWindow.tsx` or wherever execution plan button is

Add:
```typescript
// Check tier from local state or API
const canUseExecutionPlan = tier === 'pro' || tier === 'enterprise';

// Disable button for anonymous/free
<Button
  disabled={!canUseExecutionPlan}
  title={!canUseExecutionPlan ? "Upgrade to Pro for Execution Plan" : ""}
>
  Analyze Plan
</Button>
```

### 5. Connection Limit Enforcement
File: `desktop/frontend/src/stores/connectionStore.ts`

Add:
```typescript
// Before allowing new connection:
const connections = useConnectionStore.getState().connections;
const userState = await fetchUserState(); // Call /api/devices/validate

if (userState.connections_limit !== -1 &&
    connections.length >= userState.connections_limit) {
  showToast.error(
    `Connection limit reached (${userState.connections_limit}).
    Upgrade to Pro for unlimited connections.`
  );
  return;
}
```

### 6. Handle Usage Limit Errors
Update API error handler:

```typescript
// In utils/api.ts or similar
if (error.response?.status === 403 &&
    error.response?.data?.error === 'usage_limit_reached') {
  const data = error.response.data;

  showModal({
    title: "Message Limit Reached",
    message: data.message,
    actions: [
      { label: "Upgrade", url: data.upgrade_url },
      { label: "Cancel" }
    ]
  });
}
```

---

## Environment Variables

### Desktop Backend
```bash
# .env file
CLOUD_API_URL=http://localhost:8001  # Development
# CLOUD_API_URL=https://api.qognix.com  # Production
```

### Cloud Server
```bash
# Existing vars stay the same
# No new vars needed
```

---

## Database Migrations

### Cloud Server (PostgreSQL)

Run migration to add new tables:

```bash
cd server/backend
# Using Alembic (if configured):
alembic revision --autogenerate -m "Add device tracking tables"
alembic upgrade head

# Or manually:
psql -U postgres -d qognix < migrations/add_device_tables.sql
```

### Desktop App (SQLite)

No migration needed - tables created automatically on first run via `_init_schema()` in `cipher.py`.

---

## Testing Checklist

### Backend Tests

- [ ] Device registration works
- [ ] hardware_id is generated correctly
- [ ] Validation blocks after limit reached
- [ ] Increment increases counter
- [ ] Cloud unreachable returns 503
- [ ] Reinstall restores usage

### Frontend Tests

- [ ] Anonymous user sees 5 message limit
- [ ] Logged-in Free user sees 25 limit
- [ ] Pro user sees 500 limit
- [ ] Enterprise sees unlimited
- [ ] Execution plan disabled for Free
- [ ] Connection limit enforced
- [ ] Upgrade prompts shown
- [ ] JWT passed correctly

### Integration Tests

- [ ] First launch registers device
- [ ] Query validation works
- [ ] Usage increments correctly
- [ ] Period reset works (30 days)
- [ ] Login links device to user
- [ ] Tier upgrade reflects immediately

---

## Deployment Notes

### Cloud Server
1. Run database migrations
2. Update `CLOUD_API_URL` in desktop `.env`
3. No code changes needed

### Desktop App
1. Build new version with updated backend
2. Users will auto-register on first launch
3. Existing users: hardware_id will match, usage preserved

---

## Summary of Changes

### Files Created (9 files):

**Server:**
1. `server/backend/database/device_queries.py` - Device/usage query functions
2. `server/backend/api/devices.py` - Device API endpoints

**Desktop:**
3. `desktop/backend/device_id.py` - Device ID generation
4. `desktop/backend/cloud_client.py` - Cloud API client
5. `desktop/backend/startup.py` - Startup registration
6. `desktop/backend/local_database.py` - Local DB helpers (optional, not used yet)

**Documentation:**
7. `IMPLEMENTATION_SUMMARY.md` - This file

### Files Modified (5 files):

**Server:**
1. `server/backend/database/models.py` - Added Device, DeviceUsage, UsageLog models
2. `server/backend/main.py` - Registered devices router

**Desktop:**
3. `desktop/backend/encryption/cipher.py` - Added device/usage tables to schema
4. `desktop/backend/api/routes.py` - Added cloud validation to /chat/query
5. `desktop/backend/main.py` - Added device registration on startup

---

## Next Steps

1. **Test backend** - Start both servers, test device registration
2. **Complete frontend** - Add JWT passing, usage UI, execution plan blocking
3. **Test end-to-end** - Anonymous → Free → Pro flow
4. **Deploy** - Run migrations, update env vars, build desktop app

---

**Status: Backend Complete ✅ | Frontend TODO ⏳**
