# SYSTEM_REFERENCE.md
> Last Updated: 2026-02-03
> Tag this file in every conversation for full system context.

---

## Quick Summary

**Qognix Desktop** = Floating AI assistant for databases (BYOK mode only)
- Desktop app makes ALL AI calls locally using user's own API keys
- Cloud server handles ONLY: authentication, billing, usage tracking
- No user data or queries leave their machine

---

## Tier System (CURRENT)

| Tier | Messages/Month | DB Connections | Execution Plan | Price |
|------|---------------|----------------|----------------|-------|
| **Free** | 25 | 1 | ❌ | $0 |
| **Pro** | 500 | 50 | ✅ | **$15/month** |
| **Enterprise** | Unlimited | Unlimited | ✅ | Contact Sales |

> Source: `server/backend/api/usage.py` (TIER_LIMITS)

---

## Stripe Setup

### Environment Variables Required

```env
STRIPE_SECRET_KEY=sk_live_xxx          # or sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx     # or pk_test_xxx
STRIPE_PRICE_ID=price_xxx              # Pro tier price ID
STRIPE_WEBHOOK_SECRET=whsec_xxx        # Webhook signing secret
```

### Products to Create in Stripe

| Product | Price | Billing | Notes |
|---------|-------|---------|-------|
| **Qognix Pro** | $29/month | Recurring | Use this Price ID for `STRIPE_PRICE_ID` |

### Webhook Events to Enable

Point webhook to: `https://api.qognix.com/webhooks/stripe`

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER'S COMPUTER                          │
│  ┌─────────────────┐    ┌─────────────────────────────┐    │
│  │ Electron App    │───▶│ Local Python Backend        │    │
│  │ (React Frontend)│    │ (FastAPI on dynamic port)   │    │
│  └─────────────────┘    └──────────────┬──────────────┘    │
│                                        │                    │
│                         ┌──────────────▼──────────────┐    │
│                         │ AI Providers (User's Keys)  │    │
│                         │ Claude/OpenAI/Gemini/Bedrock│    │
│                         └─────────────────────────────┘    │
└────────────────────────────────┬────────────────────────────┘
                                 │ HTTPS (auth/billing only)
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    QOGNIX CLOUD                             │
│  ┌─────────────────┐    ┌─────────────────────────────┐    │
│  │ Portal Frontend │    │ FastAPI Backend             │    │
│  │ (React)         │    │ - Auth (JWT + OAuth)        │    │
│  └─────────────────┘    │ - Stripe Integration        │    │
│                         │ - Usage Tracking            │    │
│                         └──────────────┬──────────────┘    │
│                                        │                    │
│                         ┌──────────────▼──────────────┐    │
│                         │ PostgreSQL + Redis          │    │
│                         └─────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Files

### Server Backend
| File | Purpose |
|------|---------|
| `server/backend/api/usage.py` | **TIER_LIMITS** - actual tier enforcement |
| `server/backend/api/subscriptions.py` | Stripe checkout, cancel, reactivate |
| `server/backend/stripe_manager.py` | Stripe API wrapper |
| `server/backend/api/webhooks.py` | Stripe webhook handlers |
| `server/backend/auth/jwt_handler.py` | JWT token creation/validation |
| `server/backend/api/oauth.py` | Google/GitHub OAuth |
| `server/backend/database/models.py` | SQLAlchemy models |
| `server/backend/database/queries.py` | Database operations |
| `server/backend/config.py` | All environment variables |

### Desktop App
| File | Purpose |
|------|---------|
| `desktop/frontend/src/stores/tierStore.ts` | Tier state management |
| `desktop/frontend/src/stores/authStore.ts` | Auth state, SSO flow |
| `desktop/backend/api/routes.py` | Local API endpoints |
| `desktop/backend/cloud_client.py` | Cloud server communication |
| `desktop/backend/ai_client.py` | AI provider integrations |

---

## Authentication Flow

### Desktop SSO
1. User clicks "Sign In" in Settings
2. Opens `portal.qognix.com/auth/desktop`
3. User authenticates (email/password or OAuth)
4. Portal redirects to `qognix://auth?token=xxx`
5. Electron catches protocol, passes to React
6. Token stored in localStorage via Zustand

### JWT Tokens
- Access Token: 60 minutes
- Refresh Token: 7 days
- Algorithm: HS256

---

## AI Providers (BYOK)

```typescript
type AIProvider = 'claude' | 'openai' | 'gemini' | 'bedrock';
```

All require user's own API keys. Desktop stores keys encrypted locally.

---

## Database Support

- PostgreSQL
- MySQL
- SQL Server

---

## API Endpoints Summary

### Cloud Server (`api.qognix.com`)
```
POST /api/auth/login           - Login
POST /api/auth/register        - Register
GET  /api/auth/me              - Get user + tier info
POST /api/oauth/google         - Google OAuth
POST /api/oauth/github         - GitHub OAuth
GET  /api/subscriptions/current - Current subscription
POST /api/subscriptions/create-checkout-session - Stripe checkout
POST /api/subscriptions/cancel - Cancel subscription
POST /api/usage/validate       - Check if user can make request
POST /api/usage/increment      - Track usage after query
POST /webhooks/stripe          - Stripe webhooks
```

### Desktop Backend (localhost)
```
POST /api/chat                 - Generate SQL
POST /api/schema               - Extract DB schema
POST /api/execute              - Execute query
POST /api/validate-connection  - Test DB connection
GET  /api/health               - Health check
```

---

## Important Notes

1. **BYOK Only** - All AI calls from desktop using user's API keys
2. **Server = Auth + Billing + Usage** - No AI code on server
3. **One Stripe Price** - System uses single `STRIPE_PRICE_ID` (Pro only)
4. **Monthly Reset** - Usage resets on 1st of each calendar month
5. **Custom Limits** - Subscription table supports per-user overrides

---

## Cleaned Up (2026-02-03)

Moved to `OldVersions_2026-02-03/server_managed_mode/`:
- `server/backend/ai/` - Managed mode AI providers (not used)
- `server/backend/api/chat.py` - Managed mode chat endpoints
- `server/backend/api/desktop.py` - Managed mode desktop integration

---

## What Needs Stripe Products

For current implementation, create **ONE product** in Stripe:

| Product | Monthly Price | What to copy |
|---------|--------------|--------------|
| Qognix Pro | $29 | Copy the **Price ID** (starts with `price_`) |

Enterprise tier is handled manually (contact sales).
