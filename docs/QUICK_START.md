# SQLingo - Quick Start Guide

This guide will help you set up and run the SQLingo desktop application for development.

## 🚀 Development Setup

The system consists of **two parts** that run on your machine:
1. **Desktop Backend** (Python/FastAPI) - Handles AI logic and database connections.
2. **Desktop Frontend** (Electron/React) - The user interface.

### Prerequisites
- **Node.js** 18+
- **Python** 3.10+

---

## Step 1: Start Desktop Backend

The backend is responsible for all AI interactions and database queries. It uses a local server on port `39847`.

**Terminal 1:**
```bash
cd desktop/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

**Expected Output:**
```
[INFO] SQLingo Desktop starting...
[START] Starting backend server on http://127.0.0.1:39847
```

---

## Step 2: Start Desktop App (Frontend)

The frontend is the Electron shell that provides the UI.

**Terminal 2:**
```bash
cd desktop/frontend
npm install
npm run electron:dev
```

**Expected:** The SQLingo desktop application opens.

---

## 🔑 AI Provider Configuration

SQLingo is **BYOK (Bring Your Own Key)**. You need to provide your own API keys for the AI providers you want to use.

1. Open the **Settings** menu in the app.
2. Enter your API keys for:
   - OpenAI (GPT-4)
   - Anthropic (Claude)
   - Google (Gemini)
   - AWS Bedrock (Credentials)

All keys are stored **locally and encrypted** on your machine.

---

## 🛑 Common Issues

### Port Already in Use
If port `39847` or `5173` is occupied:
```bash
# Find and kill process on port (macOS/Linux)
lsof -i :39847
kill -9 <PID>
```

### Database Drivers
Ensure you have the necessary drivers installed for your database type (e.g., `pymssql` for SQL Server).

---

## 💡 Development Tips

### Run Both Concurrently (macOS/Linux)
You can use the provided startup script:
```bash
./scripts/start-dev.sh
```

---

**Happy Querying!**
