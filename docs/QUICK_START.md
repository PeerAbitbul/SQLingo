# Qognix - Complete System Startup Guide

## 🚀 Quick Start - All Components

The system has **4 components** that need to run:

| Component | Port | Purpose |
|-----------|------|---------|
| Server Backend | 8001 | Cloud API (auth, subscriptions, usage) |
| Portal Frontend | 3000 | Web portal (billing, dashboard) |
| Desktop Backend | 39847 | Local API (AI, connections) |
| Desktop Frontend | - | Electron app |

---

## Step 1: Start Server Backend (Cloud API)

**Terminal 1:**
```bash
cd server/backend
source venv/bin/activate
python main.py
```

**Expected:**
```
INFO:     Uvicorn running on http://127.0.0.1:8001
```

---

## Step 2: Start Portal Frontend (Web Dashboard)

**Terminal 2:**
```bash
cd server/frontend
npm run dev
```

**Expected:**
```
VITE ready in xxx ms
➜  Local:   http://localhost:3000/
```

---

## Step 3: Start Desktop Backend (Local AI API)

**Terminal 3:**
```bash
cd desktop/backend
source venv/bin/activate
python main.py
```

**Expected:**
```
[OK] Using fixed port: 39847
[START] Starting backend server on http://127.0.0.1:39847
```

---

## Step 4: Start Desktop App (Electron)

**Terminal 4:**
```bash
cd desktop/frontend
npm run electron:dev
```

**Expected:** Qognix desktop app opens

---

## 🔗 URLs When Running

| Service | URL |
|---------|-----|
| Portal | http://localhost:3000 |
| Server API | http://127.0.0.1:8001/api |
| Desktop API | http://127.0.0.1:39847/api |
| API Docs | http://127.0.0.1:8001/docs |

---

## 📋 Startup Order (Important!)

1. **Server Backend** - Must start first (provides auth)
2. **Portal Frontend** - Optional (only if you need web dashboard)
3. **Desktop Backend** - Before desktop app
4. **Desktop App** - Last

---

## 🛑 Common Issues

### Port Already in Use
```bash
# Find and kill process on port
lsof -i :39847  # or :8001
kill -9 <PID>
```

### PostgreSQL Not Running
```bash
# Check if Docker Postgres is running
docker ps | grep postgres
# If not running:
docker start postgres16
```

---

## 💡 Development Tips

### Run Only Desktop (BYOK mode - no server needed)
If you only want to use BYOK mode without authentication:
```bash
# Terminal 1
cd desktop/backend && source venv/bin/activate && python main.py

# Terminal 2
cd desktop/frontend && npm run electron:dev
```

### Run Full System (with portal)
Run all 4 terminals as described above.

---

## 🔐 Environment Variables

Make sure these are set:

**server/backend/.env:**
```
DATABASE_URL=postgresql://peer@localhost/qognix_cloud
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_xxx
```

**desktop/backend/.env:**
```
DEV_MODE=true
CLOUD_API_URL=http://127.0.0.1:8001
```
