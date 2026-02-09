# SQLingo - Free AI-Powered Database Assistant

> 🚀 **Free Desktop Application** - Natural language queries for your databases using your own AI API keys.

A completely free desktop application that lets you interact with your databases using natural language. All AI calls are made directly from your machine using your own API keys (BYOK - Bring Your Own Keys). **No subscriptions, no limits, no cloud dependencies.**

![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 How It Works

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         YOUR MACHINE (100% LOCAL)                        │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    DESKTOP APPLICATION (SQLingo)                   │  │
│  │                                                                    │  │
│  │   ┌─────────────────────┐      ┌─────────────────────────────┐    │  │
│  │   │   Electron + React  │      │    Python Backend (Local)   │    │  │
│  │   │   ----------------  │ IPC  │    -----------------------   │    │  │
│  │   │   • Chat UI         │◄────►│    • FastAPI Server         │    │  │
│  │   │   • Settings        │      │    • Database Connectors    │    │  │
│  │   │   • Connection Mgr  │      │    • Schema Extractor       │    │  │
│  │   └─────────────────────┘      │    • AI Client (BYOK)       │    │  │
│  │                                └──────────────┬──────────────┘    │  │
│  └───────────────────────────────────────────────│───────────────────┘  │
│                                                  │                       │
│                                      Direct AI API Calls                 │
│                                      (Your Own API Keys)                 │
│                                                  │                       │
│                                                  ▼                       │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                      AI PROVIDERS (EXTERNAL)                       │  │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────────┐  │  │
│  │   │ OpenAI  │  │ Claude  │  │ Gemini  │  │ AWS Bedrock         │  │  │
│  │   │ GPT-4o  │  │ Sonnet  │  │ Flash   │  │ (Direct Access)     │  │  │
│  │   └─────────┘  └─────────┘  └─────────┘  └─────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                  │                       │
│                                                  ▼                       │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                      YOUR DATABASES                                │  │
│  │   ┌──────────────┐  ┌───────────┐  ┌────────────────────────┐    │  │
│  │   │ PostgreSQL   │  │ MySQL     │  │ SQL Server             │    │  │
│  │   └──────────────┘  └───────────┘  └────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Key Architecture Points:
- **🔐 100% Local** - Everything runs on your machine.
- **🆓 Completely Free** - No subscriptions, no usage limits, no trials.
- **🔑 BYOK (Bring Your Own Keys)** - Use your own AI provider keys.
- **🛡️ Privacy First** - Your database data and AI queries never pass through "our" servers.
- **💾 Local Persistence** - History and settings are stored in local SQLite files.

---

## ✨ Features

### 🤖 AI Providers (BYOK)
- **OpenAI**: GPT-4o, GPT-4o-mini
- **Anthropic**: Claude 3.5 Sonnet
- **Google**: Gemini 2.0 Flash
- **AWS Bedrock**: Claude models via direct AWS integration

### 🗄️ Database Support
- **PostgreSQL**, **MySQL**, **SQL Server**
- Schema awareness (Tables, Views, PKs, FKs, Indexes, Enums)

### 🎨 Desktop Experience
- **Natural Language to SQL**: Talk to your data.
- **Floating Window**: Always-on-top mode for quick access.
- **Execution Plan Analysis**: Analyze query performance visually.
- **Modern UI**: Dark/Light mode support.

---

## 📁 Project Structure

```
sqlingo/
├── desktop/                      # 🖥️ DESKTOP APPLICATION
│   ├── frontend/                 # Electron + React
│   │   ├── electron/             # Main process & preload
│   │   ├── src/                  # UI (Chat, Settings, Connections)
│   │   └── package.json
│   │
│   └── backend/                  # Python FastAPI (LOCAL)
│       ├── ai/                   # AI provider integrations
│       ├── database/             # Connectors & Schema extraction
│       ├── api/                  # Local endpoints
│       └── main.py               # Local server entry
│
├── docs/                         # Documentation
└── scripts/                      # Build & utility scripts
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **Python** 3.10+

### Setup

1. **Install Dependencies:**
   ```bash
   # Backend
   cd desktop/backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt

   # Frontend
   cd ../frontend
   npm install
   ```

2. **Run in Development:**
   ```bash
   # Start the app
   cd desktop/frontend
   npm run electron:dev
   ```

---

## 📦 Building Distributions

```bash
cd desktop/frontend

# macOS
npm run electron:build:mac

# Windows  
npm run electron:build:win

# Linux
npm run electron:build:linux
```

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [docs/QUICK_START.md](docs/QUICK_START.md) | Getting started guide |
| [docs/EXECUTION_PLAN_FEATURE.md](docs/EXECUTION_PLAN_FEATURE.md) | Query performance analysis |
| [docs/BUILD_GUIDE.md](docs/BUILD_GUIDE.md) | Packaging instructions |

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Made for developers who want a powerful, private, and free database assistant.**
