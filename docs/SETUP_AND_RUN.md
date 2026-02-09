# Qognix - Setup and Run Guide

Complete guide for setting up and running the entire Qognix system with Stripe integration.

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **PostgreSQL** 15+
- **Redis** (optional, for rate limiting)
- **Stripe CLI** (for webhook testing)

---

## Quick Setup Script

Use this script to set up everything automatically:

```bash
./setup.sh
```

Or follow the manual steps below.

---

## Manual Setup

### 1. Clone Repository

```bash
git clone https://github.com/PeerAbitbul/qognix-desktop_without_server.git
cd qognix-desktop_without_server
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb qognix_cloud

# Or using psql
psql -U postgres -c "CREATE DATABASE qognix_cloud;"
```

### 3. Backend Setup

```bash
cd server/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
nano .env  # Edit with your settings

# Run database migration
python run_migration.py

# Start backend
python main.py
```

**Backend runs on**: http://127.0.0.1:8001

### 4. Frontend Portal Setup

```bash
cd server/frontend

# Install dependencies
npm install

# Configure environment
echo "VITE_API_URL=http://127.0.0.1:8001" > .env.local

# Start portal
npm run dev
```

**Portal runs on**: http://localhost:3001

### 5. Desktop App Setup

```bash
cd desktop/frontend

# Install dependencies
npm install

# Configure environment
echo "VITE_SERVER_URL=http://127.0.0.1:8001" > .env.local
echo "VITE_PORTAL_URL=http://localhost:3001" >> .env.local

# Start desktop frontend
npm run dev
```

**Desktop runs on**: http://localhost:5173 (or next available port)

### 6. Desktop Backend (Optional - for BYOK mode)

```bash
cd desktop/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start desktop backend
python main.py
```

**Desktop Backend runs on**: http://127.0.0.1:8000

---

## Stripe Setup

### 1. Get Stripe Keys

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy **Publishable key** (starts with `pk_test_...`)
3. Copy **Secret key** (starts with `sk_test_...`)

### 2. Create Product

1. Go to: https://dashboard.stripe.com/test/products
2. Click **"Add product"**
3. Fill in:
   - Name: `Qognix Managed API`
   - Price: `$29`
   - Billing: `Monthly (Recurring)`
4. Copy the **Price ID** (starts with `price_...`)

### 3. Configure Backend

Edit `server/backend/.env`:

```bash
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
STRIPE_PRICE_ID=price_YOUR_PRICE_ID
```

### 4. Setup Webhooks (Development)

Install Stripe CLI:

```bash
brew install stripe/stripe-cli/stripe
```

Login to Stripe:

```bash
stripe login
```

Start webhook listener:

```bash
stripe listen --forward-to http://127.0.0.1:8001/webhooks/stripe
```

Copy the webhook secret (starts with `whsec_...`) and add to `.env`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

---

## Running Everything

### Option 1: Run All (Recommended for Testing)

Open 4 terminal windows:

**Terminal 1 - Backend:**
```bash
cd server/backend
source venv/bin/activate
python main.py
```

**Terminal 2 - Portal:**
```bash
cd server/frontend
npm run dev
```

**Terminal 3 - Desktop:**
```bash
cd desktop/frontend
npm run dev
```

**Terminal 4 - Stripe Webhooks:**
```bash
stripe listen --forward-to http://127.0.0.1:8001/webhooks/stripe
```

### Option 2: Run Backend + Portal Only

If you only want to test the cloud portal:

**Terminal 1 - Backend:**
```bash
cd server/backend
source venv/bin/activate
python main.py
```

**Terminal 2 - Portal:**
```bash
cd server/frontend
npm run dev
```

**Terminal 3 - Stripe Webhooks:**
```bash
stripe listen --forward-to http://127.0.0.1:8001/webhooks/stripe
```

---

## Testing Stripe Integration

### 1. Create Account

1. Go to: http://localhost:3001
2. Click **"Sign Up"**
3. Create an account

### 2. Upgrade to Managed API

1. Go to: http://localhost:3001/billing
2. Click **"Upgrade"** on Managed API card
3. You'll be redirected to Stripe Checkout

### 3. Test Payment

Use these test card details:

- **Card Number**: `4242 4242 4242 4242`
- **Expiry**: Any future date (e.g., `12/34`)
- **CVC**: Any 3 digits (e.g., `123`)

### 4. Complete Payment

After successful payment:
- You'll be redirected back to billing page
- See success message
- "Cancel Subscription" button appears

### 5. Test Cancellation

1. Click **"Cancel Subscription"**
2. Confirm cancellation
3. Subscription status changes to "Canceling"
4. Access remains until end of period

### 6. Test Reactivation

1. While in canceling state, click **"Reactivate"**
2. Subscription becomes active again

---

## Troubleshooting

### Backend Won't Start

```bash
# Check if port 8001 is in use
lsof -ti:8001 | xargs kill -9

# Check database connection
psql -U peer -d qognix_cloud -c "SELECT 1;"

# Check Python version
python --version  # Should be 3.10+
```

### Portal Won't Start

```bash
# Check if port 3001 is in use
lsof -ti:3001 | xargs kill -9

# Reinstall dependencies
cd server/frontend
rm -rf node_modules package-lock.json
npm install
```

### Stripe Webhooks Not Working

```bash
# Make sure backend is running
curl http://127.0.0.1:8001/api/health

# Make sure Stripe CLI is running
stripe listen --forward-to http://127.0.0.1:8001/webhooks/stripe

# Check webhook secret is correct in .env
grep STRIPE_WEBHOOK_SECRET server/backend/.env
```

### Database Migration Failed

```bash
cd server/backend
source venv/bin/activate

# Try running migration manually
python run_migration.py

# If still fails, check database exists
psql -l | grep qognix_cloud
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        User's Machine                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   Desktop    │      │Cloud Portal  │      │  Stripe   │ │
│  │   Frontend   │      │  (React)     │◄────►│  Checkout │ │
│  │  (Electron)  │      │ :3001        │      └───────────┘ │
│  │  :5173       │      └──────┬───────┘                     │
│  └──────┬───────┘             │                             │
│         │                     │                             │
│         │                     │                             │
│  ┌──────▼───────┐      ┌─────▼────────┐                    │
│  │   Desktop    │      │   Backend    │◄───────────────┐   │
│  │   Backend    │      │  (FastAPI)   │                │   │
│  │   :8000      │      │  :8001       │    Webhooks    │   │
│  └──────────────┘      └──────┬───────┘                │   │
│                               │                         │   │
│                        ┌──────▼────────┐               │   │
│                        │  PostgreSQL   │               │   │
│                        │  qognix_cloud │               │   │
│                        └───────────────┘               │   │
│                                                         │   │
│  ┌──────────────────────────────────────────────────┐  │   │
│  │         Stripe CLI (Development Only)            │  │   │
│  │  stripe listen --forward-to localhost:8001      ├──┘   │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Environment Variables Reference

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://peer:123456789@localhost:5432/qognix_cloud

# JWT
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

# Stripe (Get from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# Optional: AI Provider Keys (for Managed Mode)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_API_KEY=
```

### Frontend Portal (.env.local)

```bash
VITE_API_URL=http://127.0.0.1:8001
```

### Desktop Frontend (.env.local)

```bash
VITE_SERVER_URL=http://127.0.0.1:8001
VITE_PORTAL_URL=http://localhost:3001
```

---

## What's Next?

After setup, you can:

1. **Test the full subscription flow** (signup → upgrade → payment → cancel → reactivate)
2. **Integrate Desktop app** with cloud authentication
3. **Add payment history** display
4. **Set up production environment** with real Stripe webhooks
5. **Deploy to production** (Vercel, Railway, etc.)

---

## Support

If you encounter issues:

1. Check this guide's **Troubleshooting** section
2. Review logs in terminal windows
3. Check `server/backend/README.md` for backend details
4. Check `QUICKSTART.md` for quick reference

---

**Happy Testing!** 🚀
