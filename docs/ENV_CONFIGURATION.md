# Environment Configuration Guide

This document explains the environment variable structure across all four components of Qognix.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Desktop Application                     │
├──────────────────────┬──────────────────────────────────────┤
│ Desktop Frontend     │ Desktop Backend                      │
│ Port: 5173 (dev)     │ Port: 8000                           │
│ Electron IPC ────────┼────> Local API                       │
│                      │        │                              │
│ VITE_PORTAL_URL ─────┼────────┼─────> Opens browser for auth│
│ (port 3000)          │        │                              │
│                      │        │ SERVER_URL                   │
│                      │        │ (port 8001)                  │
│                      │        ↓                              │
└──────────────────────┴────────┼──────────────────────────────┘
                                │
                                │
                                ↓
┌─────────────────────────────────────────────────────────────┐
│                      Cloud Services                          │
├──────────────────────┬──────────────────────────────────────┤
│ Server Frontend      │ Server Backend                       │
│ Port: 3000           │ Port: 8001                           │
│ (Portal/Website)     │ (API Server)                         │
│                      │                                       │
│ VITE_API_URL ────────┼────> Cloud API                       │
│ (port 8001)          │                                       │
│                      │ DATABASE_URL                          │
│                      │ JWT_SECRET_KEY                        │
│                      │ STRIPE_*                              │
│                      │ AWS_BEDROCK_*                         │
│                      ↓                                       │
│                  PostgreSQL Database                         │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
project/
├── desktop/
│   ├── backend/          # Python backend (port 8000)
│   │   └── .env          # SERVER_URL, PORT, AI keys for testing
│   └── frontend/         # React + Electron
│       └── .env          # VITE_PORTAL_URL only
├── server/
│   ├── backend/          # Python API server (port 8001)
│   │   └── .env          # DATABASE_URL, JWT_SECRET, Stripe, etc.
│   └── frontend/         # React portal (port 3000)
│       └── .env.local    # VITE_API_URL
```

---

## 1. Desktop Backend (.env)

**Location:** `desktop/backend/.env`

**Purpose:** Configure desktop Python backend that runs locally and communicates with cloud services.

```bash
# ===========================================
# Server Settings
# ===========================================
HOST=127.0.0.1
PORT=8000
RELOAD=True

# Cloud Backend API URL
# Development: http://127.0.0.1:8001
# Production: https://api.qognix.com
SERVER_URL=http://127.0.0.1:8001

# ===========================================
# API Keys (for testing only)
# ===========================================
# In production, API keys come from the frontend UI
# These are only for backend testing without frontend
CLAUDE_API_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=

# ===========================================
# Database Connection (for testing)
# ===========================================
# Example connection strings for testing
# TEST_DB_CONNECTION_STRING=postgresql://username:password@localhost:5432/database
# TEST_DB_TYPE=postgresql
```

**Key Variables:**
- `SERVER_URL` - Where to find cloud backend API (port 8001)
- `PORT` - Desktop backend runs on this port (8000)
- API keys are OPTIONAL, only for testing without UI

---

## 2. Desktop Frontend (.env)

**Location:** `desktop/frontend/.env`

**Purpose:** Configure React frontend that runs inside Electron.

```bash
# Desktop Frontend - Environment Variables

# Cloud Portal URL (for authentication & account management)
# Development: Local server frontend (port 3000)
# Production: Live website
# Note: Desktop frontend talks to desktop backend (port 8000) via Electron IPC
# Desktop backend then talks to cloud backend (port 8001)
VITE_PORTAL_URL=http://localhost:3000
```

**Key Variables:**
- `VITE_PORTAL_URL` - Where to redirect user for authentication (port 3000)

**IMPORTANT:**
- Desktop frontend does NOT need `VITE_SERVER_URL`
- It communicates with desktop backend via Electron IPC (not HTTP)
- Desktop backend (port 8000) handles all HTTP communication

---

## 3. Server Backend (.env)

**Location:** `server/backend/.env`

**Purpose:** Configure cloud Python API server.

```bash
# ===========================================
# Database
# ===========================================
DATABASE_URL=postgresql://user:pass@localhost:5432/qognix_cloud

# ===========================================
# JWT Authentication
# ===========================================
JWT_SECRET_KEY=dev-secret-key-change-in-production-507f1f77bcf86cd799439011
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

# ===========================================
# Redis
# ===========================================
REDIS_URL=redis://localhost:6379/0

# ===========================================
# Stripe (Payment Processing)
# ===========================================
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# ===========================================
# AI Provider API Keys (for Managed mode)
# ===========================================
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_API_KEY=
AWS_BEDROCK_ACCESS_KEY=
AWS_BEDROCK_SECRET_KEY=
AWS_BEDROCK_REGION=us-east-1

# ===========================================
# Email Configuration (optional)
# ===========================================
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=noreply@qognix.com
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com

# ===========================================
# App Configuration
# ===========================================
APP_NAME=Qognix Cloud
ENVIRONMENT=development
DEBUG=true

# ===========================================
# CORS Origins (comma-separated)
# ===========================================
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173,http://localhost:5174

# ===========================================
# Rate Limiting
# ===========================================
RATE_LIMIT_PER_MINUTE=100
```

**Key Variables:**
- `DATABASE_URL` - PostgreSQL connection for user/subscription data
- `JWT_SECRET_KEY` - Secret for signing authentication tokens
- `STRIPE_*` - Payment processing configuration
- `CORS_ORIGINS` - Allowed origins (includes both portal and desktop dev ports)

---

## 4. Server Frontend (.env.local)

**Location:** `server/frontend/.env.local`

**Purpose:** Configure React portal/website.

```bash
# Cloud Portal Frontend - Local Development

# Cloud Backend API URL
# Development: http://127.0.0.1:8001
# Production: https://api.qognix.com (set in production build)
VITE_API_URL=http://127.0.0.1:8001
```

**Key Variables:**
- `VITE_API_URL` - Where portal makes API calls (port 8001)

**Note:** The Vite config also includes a proxy:
```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8001',
      changeOrigin: true,
    },
  },
}
```

---

## Port Reference

| Service | Port | Access |
|---------|------|--------|
| Desktop Frontend | 5173 | http://localhost:5173 (dev only) |
| Desktop Backend | 8000 | http://localhost:8000/api |
| Server Frontend (Portal) | 3000 | http://localhost:3000 |
| Server Backend (API) | 8001 | http://localhost:8001/api |

---

## Communication Flow

### Desktop App Query Flow
```
1. User enters query in Desktop Frontend (port 5173)
   ↓
2. Frontend calls desktop backend via Electron IPC
   ↓
3. Desktop Backend (port 8000) validates with Cloud Backend (port 8001)
   ↓
4. If valid, Desktop Backend executes query using user's BYOK API keys
   ↓
5. Result returned to Desktop Frontend
```

### Authentication Flow
```
1. User clicks "Sign In" in Desktop Frontend
   ↓
2. Desktop opens browser to VITE_PORTAL_URL (http://localhost:3000/auth/desktop)
   ↓
3. User logs in at Portal (port 3000)
   ↓
4. Portal calls Server Backend API (port 8001) to validate credentials
   ↓
5. JWT token sent back to Desktop via qognix:// protocol
   ↓
6. Desktop Backend validates token with Server Backend
```

---

## Common Issues

### Issue: "Portal redirects to wrong port (3001 instead of 3000)"
**Fix:** Update `VITE_PORTAL_URL` in `desktop/frontend/.env` to `http://localhost:3000`

### Issue: "Desktop frontend can't connect to cloud"
**Fix:** Desktop frontend should NOT connect directly to cloud. It should use Electron IPC to talk to desktop backend. Remove any `VITE_SERVER_URL` from desktop frontend .env files.

### Issue: "401 Unauthorized on queries"
**Expected:** This is correct behavior when not logged in! Users must authenticate to use the service.

### Issue: "CORS errors from desktop app"
**Fix:** Add desktop dev ports (5173, 5174) to `CORS_ORIGINS` in `server/backend/.env`

---

## Development Checklist

When starting development, verify:

- [ ] `server/backend/.env` exists with DATABASE_URL and JWT_SECRET_KEY
- [ ] `server/frontend/.env.local` exists with VITE_API_URL=http://127.0.0.1:8001
- [ ] `desktop/backend/.env` exists with SERVER_URL=http://127.0.0.1:8001
- [ ] `desktop/frontend/.env` exists with VITE_PORTAL_URL=http://localhost:3000
- [ ] Desktop frontend .env does NOT have VITE_SERVER_URL
- [ ] PostgreSQL is running and accessible
- [ ] All four services start without errors

---

## Production Deployment

### Desktop App
- Desktop backend SERVER_URL → `https://api.qognix.com`
- Desktop frontend VITE_PORTAL_URL → `https://qognix.com`

### Cloud Services
- Server backend DATABASE_URL → Production PostgreSQL
- Server backend JWT_SECRET_KEY → Secure random key (64+ chars)
- Server backend STRIPE_* → Live keys (not test keys)
- Server frontend VITE_API_URL → `https://api.qognix.com`

---

## Summary

**Desktop Frontend** needs only:
- `VITE_PORTAL_URL` (where to redirect for auth)

**Desktop Backend** needs:
- `SERVER_URL` (where to find cloud API)
- `PORT` (what port to run on)

**Server Frontend** needs:
- `VITE_API_URL` (where to make API calls)

**Server Backend** needs:
- `DATABASE_URL` (PostgreSQL)
- `JWT_SECRET_KEY` (auth)
- `STRIPE_*` (payments)
- All other service configurations
