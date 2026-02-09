# 🚀 Qognix - Complete Setup Guide (Electron Edition)

Complete guide to set up and run Qognix desktop application.

> **API Modes:**
> - **BYOK (Free)** - Bring Your Own API Keys - No account needed
> - **Managed API (Paid)** - We provide API keys - Requires Qognix account (OAuth login)

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Running the App](#running-the-app)
5. [Building for Production](#building-for-production)
6. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

### Required Software

**Node.js & npm:**
- Version: 18.0.0 or higher
- Download: https://nodejs.org/

**Python:**
- Version: 3.10, 3.11, 3.12, or 3.13
- Download: https://www.python.org/downloads/

**Git:**
- Download: https://git-scm.com/downloads

### Optional (for specific databases)

**SQL Server:**
- Microsoft ODBC Driver (for SQL Server connections)
- mssql-python (installed automatically)

**PostgreSQL:**
- psycopg2 (installed automatically)

**MySQL:**
- PyMySQL (installed automatically)

---

## 2. Installation

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd "Qognix - Floating AI assistant for databases"
```

### Step 2: Install Frontend Dependencies

```bash
cd desktop/frontend
npm install
```

**Expected output:**
```
added 492 packages in 20s
```

### Step 3: Install Backend Dependencies

```bash
cd ../backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

**Expected output:**
```
Successfully installed fastapi-0.104.0 uvicorn-0.24.0 ...
```

### Step 4: Install SQL Server Driver (Optional)

If you need SQL Server support:

```bash
# Still in backend directory with venv activated
pip install mssql-python
```

**Test installation:**
```bash
python -c "import mssql_python; print('✅ SQL Server driver installed!')"
```

---

## 3. Configuration

### Backend Configuration

**1. Create environment file:**

```bash
cd desktop/backend
cp env.example .env
```

**2. Edit `.env` file:**

```env
# API Keys (for BYOK mode - optional if using Managed API)
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
GOOGLE_API_KEY=xxxxx

# Server Configuration
HOST=127.0.0.1
PORT=8000
DEBUG=true

# Managed API Server (for paid tier)
SERVER_URL=https://api.qognix.com

# Database (SQLite for local storage)
DATABASE_URL=sqlite:///./db_chat.db
```

> **Note:** API keys in `.env` are only for testing. In production, users provide keys via the UI (BYOK mode) or use Managed API mode.

**3. Choose Your API Mode:**

### Option A: BYOK Mode (Free)

Get your own API keys:

**Anthropic Claude:**
1. Go to https://console.anthropic.com/
2. Sign up / Log in
3. Go to API Keys
4. Create new key
5. Add in app Settings → API Keys

**OpenAI:**
1. Go to https://platform.openai.com/
2. Sign up / Log in
3. Go to API Keys
4. Create new key
5. Add in app Settings → API Keys

**Google Gemini:**
1. Go to https://makersuite.google.com/app/apikey
2. Create API key
3. Add in app Settings → API Keys

### Option B: Managed API Mode (Paid)

1. Open the app
2. Go to Settings → Account
3. Click "Sign In"
4. Create/Login to your Qognix account
5. Choose a plan (when server is ready)
6. We handle the API keys for you!

---

## 4. Running the App

### Development Mode

You need **2 terminals**:

**Terminal 1 - Backend:**
```bash
cd desktop/backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python main.py
```

**Expected output:**
```
✅ Using mssql-python driver for SQL Server
⚠️  WARNING: Using non-encrypted SQLite for development
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

**Terminal 2 - Frontend (Electron):**
```bash
cd desktop/frontend
npm run electron:dev
```

**Expected output:**
```
VITE v5.4.21  ready in 94 ms
➜  Local:   http://localhost:5173/

🚀 Electron app started!
📍 Mode: Development
```

**The Electron window will open automatically!** 🎉

---

## 5. Building for Production

### Prepare for Build

**1. Build backend (optional - for bundled version):**
```bash
cd desktop/backend
./build.sh  # macOS/Linux
# or
build.bat   # Windows
```

**2. Build Electron app:**

**For macOS:**
```bash
cd desktop/frontend
npm run electron:build:mac
```

Output: `desktop/frontend/release/Qognix-{version}.dmg`

**For Windows:**
```bash
cd desktop/frontend
npm run electron:build:win
```

Output: `desktop/frontend/release/Qognix Setup {version}.exe`

**For Linux:**
```bash
cd desktop/frontend
npm run electron:build:linux
```

Output: `desktop/frontend/release/Qognix-{version}.AppImage`

### Installation

**macOS:**
1. Double-click the `.dmg` file
2. Drag "Qognix" to Applications
3. Open from Applications

**Windows:**
1. Run the `.exe` installer
2. Follow installation wizard
3. Launch from Start Menu

**Linux:**
1. Make AppImage executable: `chmod +x DB-Chat-*.AppImage`
2. Run: `./DB-Chat-*.AppImage`

---

## 6. Troubleshooting

### Backend Issues

**Problem: `ModuleNotFoundError: No module named 'fastapi'`**

Solution:
```bash
cd desktop/backend
source venv/bin/activate
pip install -r requirements.txt
```

**Problem: `pyodbc not available` or `mssql-python not found`**

Solution:
```bash
pip install mssql-python
```

**Problem: Backend won't start**

Solution:
```bash
# Check if port 8000 is in use
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process or use different port in .env
```

### Frontend Issues

**Problem: Electron won't start**

Solution:
```bash
cd desktop/frontend
rm -rf node_modules
npm install
npm run electron:dev
```

**Problem: `Cannot find module 'electron'`**

Solution:
```bash
npm install --save-dev electron electron-builder electron-is-dev
```

**Problem: White screen / blank window**

Solution:
1. Check if Vite is running (http://localhost:5173)
2. Check browser console (View → Toggle Developer Tools)
3. Restart both backend and frontend

### Connection Issues

**Problem: Cannot connect to database**

Solution:
1. Check database credentials
2. Verify database server is running
3. Check firewall settings
4. Test connection with database client first

**Problem: API calls failing**

Solution:
1. Verify backend is running (http://localhost:8000/health)
2. Check API keys in `.env`
3. Check network/firewall
4. Look at backend logs

### Build Issues

**Problem: Build fails with "Cannot find module"**

Solution:
```bash
npm install
npm run build
```

**Problem: macOS build fails with code signing error**

Solution:
Add to `electron-builder.json`:
```json
{
  "mac": {
    "identity": null
  }
}
```

**Problem: Windows build fails**

Solution:
Install Windows Build Tools:
```bash
npm install --global windows-build-tools
```

---

## 🎯 Quick Reference

### Common Commands

```bash
# Development
npm run electron:dev          # Start Electron app
python main.py                # Start backend

# Building
npm run electron:build        # Build for current platform
npm run electron:build:mac    # Build for macOS
npm run electron:build:win    # Build for Windows
npm run electron:build:linux  # Build for Linux

# Testing
curl http://localhost:8000/health  # Test backend
npm run dev                        # Test Vite only
```

### File Locations

```
Configuration:     desktop/backend/.env
Backend logs:      desktop/backend/logs/
Frontend build:    desktop/frontend/dist/
Electron build:    desktop/frontend/release/
Database:          desktop/backend/db_chat.db
```

### Ports

- **Backend:** http://localhost:8000
- **Frontend (dev):** http://localhost:5173
- **Electron:** Native window (no port)

---

## 📚 Additional Resources

- [Desktop README](desktop/README.md) - Architecture & features
- [Build Instructions](desktop/backend/BUILD_INSTRUCTIONS.md) - Detailed build guide
- [Installation Notes](INSTALLATION_NOTES.md) - Platform-specific notes

---

## 🆘 Need Help?

1. Check [Troubleshooting](#troubleshooting) section
2. Look at backend logs
3. Check browser console (F12)
4. Open an issue on GitHub

---

**Happy coding! 🚀**
