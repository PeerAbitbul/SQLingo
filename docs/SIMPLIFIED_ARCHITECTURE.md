# Simplified Qognix Architecture - Auth-Only Model

## 🎯 Core Concept

**NO DEMO MODE** - Users MUST log in to use the app.

Simple and clean:
- No device tracking
- No hardware fingerprinting
- No complicated reinstall detection
- Just: User logs in → Check their tier → Allow/Block query

---

## 📊 Tier System

### Free Tier (Default after signup)
- **25 messages/month**
- 1 database connection
- No execution plan analysis
- Resets monthly

### Pro Tier ($X/month)
- **500 messages/month**
- Up to 50 database connections
- Execution plan analysis included
- Resets monthly

### Enterprise Tier (Contact sales)
- **Unlimited messages**
- Unlimited connections
- All features
- Coming soon

---

## 🔄 Flow

### 1. App Startup
```
Desktop starts → No registration needed → Shows login prompt
```

### 2. User Sends Query
```
User types query
  ↓
Check: Is user logged in? (JWT token exists?)
  ↓ NO → Show error: "Please log in"
  ↓ YES
Cloud: Validate user tier and usage
  ↓
Tier limits not exceeded?
  ↓ YES → Execute query with user's API keys (BYOK)
  ↓ NO → Show error: "Upgrade to continue"
  ↓
Update usage counter in cloud
```

---

## 🏗️ Architecture

### Desktop Backend (`desktop/backend/`)

**Simplified Files:**

- `startup.py` - Just prints welcome message (no registration)
- `cloud_client.py` - Simple JWT-based validation:
  - `validate_user_usage(jwt_token)` - Check if user can query
  - `increment_user_usage(jwt_token)` - Update usage counter
- `api/routes.py` - Query validation:
  - Checks JWT token exists
  - Calls cloud to validate
  - Returns 401 if not logged in
  - Returns 403 if limit reached

### Cloud Backend (`server/backend/`)

**New Simple API (`api/usage.py`):**

- `POST /api/usage/validate` - Check user's tier and limits
  - Requires: `Authorization: Bearer <jwt>`
  - Returns: `{ allowed, tier, messages_used, messages_limit, ... }`

- `POST /api/usage/increment` - Increment usage counter
  - Requires: `Authorization: Bearer <jwt>`
  - Body: `{ ai_provider, success, error_message }`
  - Returns: `{ success, messages_used, messages_remaining, ... }`

**No Device Tables Needed** - Just users and subscriptions!

---

## 🚀 Benefits

1. **Simple** - No complex device tracking logic
2. **Reliable** - No foreign key errors or edge cases
3. **Fair** - Can't game the system by reinstalling
4. **Scalable** - Track by user_id (standard pattern)
5. **Maintainable** - Less code = fewer bugs

---

## 🧪 Testing

```bash
# 1. Start Cloud server
cd server/backend
python main.py

# 2. Start Desktop backend
cd desktop/backend
DEV_MODE=true python3 main.py

# 3. Try to query WITHOUT login → Should show "Please log in"
# 4. Log in via frontend → Should work!
```

---

## 📝 TODO

- [ ] Update frontend to handle 401 errors and show login prompt
- [ ] Implement actual usage tracking in database (currently mocked)
- [ ] Add monthly reset cron job
- [ ] Test with real users

---

## 🎉 Result

Clean, simple, works! No more device tracking headaches.
