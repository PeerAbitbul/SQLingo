# SQLingo - Free AI-Powered Database Assistant

> 🚀 **Free Desktop Application** - Natural language queries for your databases using your own AI API keys

A completely free desktop application that lets you interact with your databases using natural language. All AI calls are made directly from your machine using your own API keys (BYOK - Bring Your Own Keys). No subscriptions, no limits, no cloud dependencies.

![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 How It Works

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         YOUR MACHINE (100% LOCAL)                        │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    DESKTOP APPLICATION                             │  │
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
│                                      Direct API Calls                    │
│                                      (Your API Keys)                     │
│                                                  │                       │
│                                                  ▼                       │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                      AI PROVIDERS (EXTERNAL)                       │  │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────────┐  │  │
│  │   │ OpenAI  │  │ Claude  │  │ Gemini  │  │ AWS Bedrock         │  │  │
│  │   │ GPT-4o  │  │ Sonnet  │  │ Flash   │  │ (Your AWS Creds)    │  │  │
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
- **🔐 100% Local** - Everything runs on your machine
- **🆓 Completely Free** - No subscriptions, no usage limits
- **🔑 BYOK (Bring Your Own Keys)** - Use your own AI API keys
- **🛡️ Your Data Stays Local** - Database connections and queries never leave your machine
- **💾 Local Storage** - All chat history and settings stored locally with SQLite

---

## ✨ Features

### 🤖 AI Providers (BYOK - Your Own Keys)
| Provider | Models | Required |
|----------|--------|----------|
| **OpenAI** | GPT-4o, GPT-4o-mini | API Key |
| **Claude** | Claude 3.5 Sonnet | API Key |
| **Gemini** | Gemini 2.0 Flash | API Key |
| **AWS Bedrock** | Claude via AWS | AWS Credentials |

### 🗄️ Database Support
- **PostgreSQL** - Full support with connection pooling
- **MySQL** - Complete compatibility  
- **SQL Server** - Native support via pymssql

### 🎨 Desktop Features
- **Natural Language Queries** - Ask in plain English, get SQL
- **Chat Sidebar** - Manage multiple conversations
- **Schema Awareness** - Full understanding of PKs, FKs, Indexes, Views, Enums
- **Execution Plan Analysis** - Drag & drop `.sqlplan` files (Pro tier)
- **Floating Window** - Always-on-top mode
- **Dark/Light Theme** - Modern UI
- **Query Safety** - Prevents destructive operations

### � Security
- **Local API Keys** - Encrypted with Fernet AES
- **No Data Upload** - Your database data never leaves your machine
- **JWT Authentication** - Secure session management

---

## �📁 Project Structure

```
qognix-desktop-only/
├── desktop/                      # 🖥️ DESKTOP APPLICATION
│   ├── frontend/                 # Electron + React
│   │   ├── electron/             # Main process & preload
│   │   ├── src/                  # React components
│   │   │   ├── components/       # UI components
│   │   │   ├── stores/           # Zustand state (auth, chat, etc.)
│   │   │   └── utils/            # Helpers
│   │   └── package.json
│   │
│   └── backend/                  # Python FastAPI (LOCAL)
│       ├── ai/                   # AI providers (OpenAI, Claude, Gemini, Bedrock)
│       │   ├── client.py         # Unified AI client
│       │   ├── openai_provider.py
│       │   ├── claude_provider.py
│       │   ├── gemini_provider.py
│       │   └── bedrock_provider.py
│       ├── database/             # Database connectors
│       │   ├── connection.py     # Connection handler
│       │   └── schema_extractor.py
│       ├── api/                  # API routes
│       │   └── routes.py         # /chat, /schema, /execute
│       ├── cloud_client.py       # Client for auth/usage validation
│       ├── main.py               # FastAPI entry
│       └── requirements.txt
│
├── server/                       # ☁️ CLOUD SERVER (Auth & Subscriptions only)
│   ├── frontend/                 # React portal (Vite)
│   │   └── src/                  # Login, billing, dashboard pages
│   └── backend/                  # FastAPI
│       ├── api/
│       │   ├── auth.py           # Register, login, JWT
│       │   ├── subscriptions.py  # Tier management, Stripe
│       │   └── usage.py          # Usage tracking/validation
│       └── database/             # PostgreSQL (cloud DB)
│
├── docs/                         # Documentation
└── scripts/                      # Build & utility scripts
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **Python** 3.10+

### Desktop App Setup

**1. Backend:**
```bash
cd desktop/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp env.example .env
# Edit .env - add your API keys (OPENAI_API_KEY, etc.)
```

**2. Frontend:**
```bash
cd desktop/frontend
npm install
```

**3. Run:**
```bash
# Terminal 1 - Backend
cd desktop/backend && source venv/bin/activate && python main.py

# Terminal 2 - Frontend
cd desktop/frontend && npm run electron:dev
```

---

## 🛠️ Technology Stack

### Desktop App
| Component | Technology |
|-----------|------------|
| **Desktop Framework** | Electron |
| **UI Library** | React 18 + TypeScript |
| **Styling** | Styled Components |
| **State Management** | Zustand |
| **Build Tool** | Vite |
| **Backend Runtime** | Python 3.10+ |
| **API Framework** | FastAPI |
| **AI SDKs** | anthropic, openai, google-generativeai, boto3 |
| **Database Drivers** | psycopg2, PyMySQL, pymssql |

### Cloud Server
| Component | Technology |
|-----------|------------|
| **API Framework** | FastAPI |
| **Database** | PostgreSQL |
| **Payments** | Stripe |
| **Portal** | React + Vite |

---

## 💰 Subscription Tiers

All tiers use **BYOK (Bring Your Own Keys)** - you provide your own AI API keys.

| Feature | Free | Pro | Enterprise |
|---------|------|-----|-----------|
| Messages/Month | 25 | 500 | Unlimited |
| Database Connections | 1 | Unlimited | Unlimited |
| Execution Plan Analysis | ❌ | ✅ | ✅ |
| Price | $0 | $29/mo | Contact Us |

---

## 📦 Building for Production

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
| [docs/AUTH_IMPLEMENTATION.md](docs/AUTH_IMPLEMENTATION.md) | Authentication flow |
| [docs/EXECUTION_PLAN_FEATURE.md](docs/EXECUTION_PLAN_FEATURE.md) | SQL execution plan analysis |
| [docs/BUILD_GUIDE.md](docs/BUILD_GUIDE.md) | Building installers |

---

## 📝 License

Proprietary - All rights reserved.

---

**Made with ❤️ for developers who love databases**
