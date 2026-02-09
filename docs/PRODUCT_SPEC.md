# DB Chat - אפיון מוצר מלא (Final)

> **IMPORTANT NOTE FOR DEVELOPERS:**
> This specification document uses emojis for readability in documentation.
> **DO NOT use emojis in actual code implementation!**
> Use SVG icons instead for all UI elements.

---

## Table of Contents

1. [Vision & Mission](#vision--mission)
2. [Target Audience](#target-audience)
3. [Product Overview](#product-overview)
4. [Business Model](#business-model)
5. [Architecture](#architecture)
6. [UI/UX Design](#uiux-design)
7. [Core Features](#core-features)
8. [Technical Specifications](#technical-specifications)
9. [AI Integration](#ai-integration)
10. [Security & Privacy](#security--privacy)
11. [Roadmap](#roadmap)
12. [Go-to-Market](#go-to-market)
13. [Budget & Economics](#budget--economics)
14. [Success Metrics](#success-metrics)

---

## 🎯 Vision & Mission

### Vision Statement
**"AI-powered database assistant that works everywhere - simple, fast, and always available"**

### The Problem

**DBAs and Data Engineers waste hours on:**
- Writing repetitive SQL queries
- Looking up table structures
- Remembering column names
- Crafting complex JOINs
- Debugging syntax errors
- Optimizing slow queries

**Current solutions:**
- DataGrip AI Assistant: Only works in DataGrip, no BYOK, requires subscription
- ChatGPT/Claude web: Need to copy-paste schema, context switching, not integrated
- GitHub Copilot: Code-focused, not database-specific
- Built-in DB tools: No AI capabilities

### The Solution

**DB Chat:**
```
🪟 Floating chat window
   → Always on top of any DB tool
   → SSMS, pgAdmin, MySQL Workbench, DataGrip, or Terminal

🤖 AI-powered
   → Understands your database schema
   → Generates SQL instantly
   → Explains queries
   → Executes queries (SELECT only)

🔐 Two options:
   → BYOK (Free) - bring your own API key
   → Managed (Paid) - we handle everything

💨 Fast & Simple
   → No context switching
   → No copy-paste
   → Just ask, get SQL, run, done
```

---

## 👥 Target Audience

### Primary Users

**Database Administrators (DBAs)**
- Age: 25-55
- Experience: Junior to Senior
- Working with: SQL Server, PostgreSQL, MySQL, Oracle
- Pain: Repetitive queries, documentation lookup
- Willingness to pay: High (tool = productivity)

**Data Engineers**
- Age: 25-40
- Experience: Mid to Senior
- Working with: Multiple databases, data pipelines
- Pain: Context switching, complex queries
- Willingness to pay: High (saves hours)

**Backend Developers**
- Age: 22-45
- Experience: Junior to Senior
- Working with: Application databases
- Pain: SQL not their strength, need quick answers
- Willingness to pay: Medium to High

**Data Analysts**
- Age: 23-40
- Experience: Junior to Mid
- Working with: Reporting databases, analytics
- Pain: Complex JOINs, aggregations
- Willingness to pay: Medium

---

## 📦 Product Overview

### What is DB Chat?

**DB Chat is a lightweight desktop application that provides an AI-powered chat interface for database work.**

**Key Characteristics:**
- **Floating Window:** Always on top, doesn't block other apps
- **Context-Aware:** Reads your current database connection
- **Schema-Aware:** Understands your tables, columns, relationships
- **AI-Powered:** Uses Claude/GPT/Gemini to generate SQL
- **Query Execution:** Run SELECT queries directly from chat
- **Flexible:** BYOK (free) or Managed API (paid)
- **Secure:** Encrypted local storage (Fernet field-level encryption)

### Core Value Proposition

**For DBAs/Developers:**
```
"Stop googling SQL syntax.
 Stop switching tabs.
 Just ask, get SQL, run, done."
```

**Key Benefits:**
1. **Save Time:** 2-3 hours per day (average)
2. **Always Available:** Floating window, one click away
3. **Context-Aware:** Knows your database schema
4. **Flexible Pricing:** Free (BYOK) or Paid (managed)
5. **Privacy-First:** Everything runs locally, schema never leaves your machine (BYOK)
6. **Secure:** Encrypted storage, cannot be opened with standard tools

---

## 💰 Business Model

### Pricing Strategy

#### **Free Tier: BYOK (Bring Your Own Key)**

**What:**
- User brings their own API key from:
  - OpenAI (GPT-4)
  - Anthropic (Claude)
  - Google (Gemini)
- User pays API provider directly
- We charge ₪0

**Why This Works:**
- Removes barrier to entry
- Builds user base quickly
- Developers love BYOK
- No API costs for us
- Trust & transparency
- Viral growth potential

**Conversion Funnel:**
```
Free BYOK user
→ Uses it daily
→ Loves it
→ "This is tedious to manage API key"
→ Upgrades to Managed for convenience
```

---

#### **Paid Tier: Managed API** ← **Recommended**

```
₪99/month - Professional
  - Unlimited queries
  - All AI providers (Claude, GPT-4, Gemini)
  - Priority support
  - Schema caching
  - Query history (30 days)
  - Cloud sync (coming soon)

₪299/month - Team (5 users)
  - Everything in Professional
  - 5 user licenses
  - Centralized billing
  - Admin dashboard
  - Query history (90 days)
  - SSO (coming soon)
```

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────┐
│     User's Machine                  │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  DB Tool (SSMS, pgAdmin, etc) │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Floating Chat Window         │ │
│  │  (Tauri App)                  │ │
│  │  - UI/UX                      │ │
│  │  - User input                 │ │
│  │  - Display results            │ │
│  │  - Multiple chat tabs         │ │
│  └───────────────────────────────┘ │
│              ↕                      │
│  ┌───────────────────────────────┐ │
│  │  Local Backend                │ │
│  │  (Python - runs locally)      │ │
│  │  - Read DB connections        │ │
│  │  - Extract schema             │ │
│  │  - Format for AI              │ │
│  │  - Call AI API                │ │
│  │  - Execute queries (SELECT)   │ │
│  │  - Parse results              │ │
│  │  - Fernet encryption (fields) │ │
│  └───────────────────────────────┘ │
│              ↕                      │
│  ┌───────────────────────────────┐ │
│  │  User's Database              │ │
│  │  (SQL Server, PostgreSQL, etc)│ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
              ↕ HTTPS
     ┌────────┴─────────┐
     ↓                  ↓
┌──────────┐    ┌────────────────┐
│ User's   │    │ DB Chat        │
│ API Key  │    │ API Server     │
│ (BYOK)   │    │ (Managed)      │
│          │    │                │
│ OpenAI   │    │ - User auth    │
│ Anthropic│    │ - API proxy    │
│ Google   │    │ - Usage track  │
└──────────┘    │ - Billing      │
                │ - PostgreSQL   │
                └────────────────┘
```

### Components

#### **1. Desktop App (Tauri + React)**

**Responsibilities:**
- Display floating chat window
- Handle user input
- Show SQL results
- Manage multiple chat tabs
- Chat history
- Settings panel
- Communicate with local backend

**Tech Stack:**
- **Tauri 1.5+** (cross-platform desktop - Rust-based)
- React 18+ (UI)
- TypeScript
- Styled Components (styling)
- Zustand (state management)

**Why Tauri over Electron:**
- **Bundle Size:** 5-10 MB vs 150-200 MB (20x smaller!)
- **Performance:** 50-100 MB RAM vs 200-500 MB
- **Security:** Rust-based, sandboxed, smaller attack surface
- **Native:** Uses system WebView (no bundled Chromium)
- **Modern:** Actively maintained, growing ecosystem

**Build & Distribution:**
- tauri-build (packaging)
- Auto-update (tauri-plugin-updater)
- Code signing (Windows, Mac)
- **PyInstaller** packages Python backend as standalone .exe (no Python installation required!)

---

#### **2. Local Backend (Python + FastAPI)**

**Responsibilities:**
- Detect database connections
- Extract schema information
- Format schema for AI
- Call AI APIs (user's key or ours)
- Execute SELECT queries
- Parse AI responses
- Return SQL + results to frontend
- Manage encrypted local storage (Fernet field-level encryption)

**Tech Stack:**
- Python 3.10+
- FastAPI (local API server)
- SQLAlchemy (database abstraction)
- pyodbc (SQL Server)
- psycopg2 (PostgreSQL)
- PyMySQL (MySQL)
- **cryptography** (field-level encryption with Fernet)
- **PyInstaller** (bundle as standalone .exe)

**AI SDKs:**
- anthropic (Claude)
- openai (GPT-4)
- google-generativeai (Gemini)

**Local Storage (SQLite + Fernet Encryption):**
- Standard SQLite database (`db_chat.db`)
- Field-level encryption with Fernet (AES-128-CBC + HMAC-SHA256)
- Encryption key derived from machine-specific ID using PBKDF2
- Connection strings encrypted, messages/queries in plaintext for searchability
- Cannot decrypt database on another machine
- No external dependencies - uses Python's cryptography library

**Database Schema:**
```sql
-- settings
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- connections (encrypted)
CREATE TABLE connections (
    id INTEGER PRIMARY KEY,
    name TEXT,
    connection_string TEXT,  -- doubly encrypted!
    database_type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- chats
CREATE TABLE chats (
    id INTEGER PRIMARY KEY,
    connection_id INTEGER,
    title TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (connection_id) REFERENCES connections(id)
);

-- messages (max 1000 per chat)
CREATE TABLE messages (
    id INTEGER PRIMARY KEY,
    chat_id INTEGER,
    role TEXT,  -- 'user' or 'assistant'
    content TEXT,
    sql_query TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(id)
);

-- schema_cache (24 hours TTL)
CREATE TABLE schema_cache (
    connection_id INTEGER PRIMARY KEY,
    schema_json TEXT,
    last_updated TIMESTAMP,
    FOREIGN KEY (connection_id) REFERENCES connections(id)
);
```

**Auto Cleanup:**
- Chats older than 90 days deleted
- Max 1000 messages per chat
- Schema cache refreshed every 24 hours
- VACUUM daily to reduce file size

**Why Local Backend?**
- Privacy: Schema never leaves user's machine (BYOK mode)
- Database access: Direct connection to local/network DBs
- Cross-DB support: One codebase for all databases
- Performance: Fast schema reading
- **No Python installation required** - bundled as .exe
- **Encrypted storage** - secure local data

---

#### **3. Cloud API Server (Python + FastAPI - Managed tier only)**

**Responsibilities:**
- User authentication (JWT)
- API key management (our keys)
- Proxy AI requests
- Usage tracking & billing
- Rate limiting
- Analytics

**Tech Stack:**
- **Python 3.10+ + FastAPI** (same as local backend!)
- **PostgreSQL 15+** (production database - from day 1!)
- Redis (caching, rate limiting)
- Stripe (payments)
- Docker + AWS/GCP

**PostgreSQL Schema:**
```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  stripe_customer_id VARCHAR(255),
  subscription_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE api_usage (
  usage_id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 4),
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subscriptions (
  subscription_id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  plan VARCHAR(50),
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(50),
  current_period_end TIMESTAMP
);
```

**Why Python for Server:**
- ✅ Same language as local backend
- ✅ Same AI SDKs (code reuse)
- ✅ FastAPI excellent for APIs
- ✅ Easy deployment

**Why PostgreSQL (not SQLite):**
- ✅ Multi-user (hundreds/thousands concurrent)
- ✅ Concurrent writes
- ✅ ACID transactions (billing critical!)
- ✅ Scalability
- ✅ Backups & reliability
- ✅ Production-ready from day 1

---

### Data Flow

#### **BYOK Mode (Free):**

```
1. User types: "show me all users"

2. Frontend (Tauri) → Local Backend (Python):
   { question: "...", connection: "sql-server-1" }

3. Local Backend:
   - Reads encrypted connection string from SQLite
   - Decrypts connection string (Fernet)
   - Connects to database
   - Extracts schema

4. Local Backend → AI API (user's key):
   Claude/GPT/Gemini with schema + question

5. AI → Local Backend:
   SQL response

6. Local Backend → Frontend:
   { sql: "SELECT * FROM Users WHERE IsActive = 1" }

7. User clicks [Run Query] (optional)

8. Local Backend executes SELECT
   → Returns results (max 100 rows)

9. Frontend displays results in table

10. Local Backend saves to SQLite:
    - Chat message (plaintext)
    - SQL query (plaintext)
    - Timestamp
```

**Privacy: Maximum 🔒** - Everything stays on user's machine, encrypted.

---

#### **Managed API Mode (Paid):**

```
1. User types question

2. Frontend → Local Backend:
   { question: "...", auth_token: "jwt" }

3. Local Backend:
   - Reads schema from cache (SQLite) or DB

4. Local Backend → Our Server (Python):
   { schema: "...", question: "...", token: "..." }

5. Our Server (PostgreSQL):
   - Validates JWT
   - Checks subscription status
   - Calls AI with OUR key
   - Logs usage to PostgreSQL

6. AI → Our Server → Local Backend → Frontend

7. User gets SQL + optional execution

8. Saves to local SQLite (connection strings encrypted)
```

**Privacy: High** - Schema sent encrypted (HTTPS), not stored permanently.

---

## 🎨 UI/UX Design

### Floating Window with Tabs

```
┌──────────────────────────────────────┐
│ ≡  DB Chat              [_] [□] [×] │
├──────────────────────────────────────┤
│ [SQL Server] [PostgreSQL] [+ New]   │ ← Tabs for chats
├──────────────────────────────────────┤
│                                      │
│  🟢 SQL Server (local)               │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  Chat history                  │ │
│  │                                │ │
│  │  You: show me all users        │ │
│  │                                │ │
│  │  AI: SELECT * FROM Users...    │ │
│  │  [Copy SQL] [Run Query]        │ │
│  │                                │ │
│  │  ┌──────────────────────────┐ │ │
│  │  │ Results (10 rows)        │ │ │
│  │  │ UserId | UserName | ...  │ │ │
│  │  │ 1      | John     | ...  │ │ │
│  │  └──────────────────────────┘ │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ Type your question...      [→] │ │
│  └────────────────────────────────┘ │
│                                      │
│  [Provider: Claude ▼]  [⚙️] [History]│
└──────────────────────────────────────┘
```

### Key Features:

#### **Tabs:**
- Each tab = separate chat with different DB
- Switch between multiple databases
- New chat = new tab
- Chat history saved per tab (encrypted)

#### **Chat Area:**
- SQL with syntax highlighting
- [Copy SQL] button
- [Run Query] button → executes SELECT
- Results displayed in table (max 100 rows)
- [Export CSV/JSON] (v1.5)

#### **History:**
- Click "History" → list of past chats (from SQLite)
- Click chat → opens in new tab
- **When opening old chat:** Schema refreshed automatically
- Max 90 days retention (auto-cleanup)

#### **Settings:**
- BYOK vs Managed
- API keys (OS keychain)
- Connection strings (encrypted with Fernet in SQLite)
- Theme (dark/light)
- Always on top
- Cleanup settings (retention days)

---

## 🎯 Core Features

### MVP Features (v1.0)

#### **1. Floating Chat Window (Tauri)**
- Always on top
- Draggable
- Resizable
- Minimize to tray
- Dark/light mode
- **Multiple tabs** for different databases

#### **2. Database Connection**
- Manual connection string input
- Support: SQL Server, PostgreSQL, MySQL
- Test connection button
- Save multiple connections (encrypted)

#### **3. Schema Extraction**
- Read tables, columns, types
- Primary keys, foreign keys
- Indexes
- **Auto-refresh** when opening old chat
- Cache in SQLite (24 hours)

#### **4. AI Integration (BYOK)**
- OpenAI (GPT-4)
- Anthropic (Claude 3.5 Sonnet)
- Google (Gemini Pro)
- API keys in OS keychain
- Test connection

#### **5. SQL Generation**
- Natural language → SQL
- Context-aware (knows schema)
- Syntax highlighting
- Copy to clipboard

#### **6. Query Execution** ⭐
- Execute SELECT queries
- Display results in table (max 100 rows)
- **READ-ONLY mode** (no INSERT/UPDATE/DELETE)
- Timeout (5 seconds)
- Export results (CSV/JSON)

#### **7. Chat Management**
- **Tabs** for multiple chats
- **Chat history** - save and reopen (SQLite with encrypted connections)
- Clear history
- Auto-cleanup (90 days, 1000 messages)
- Search in history (v1.5)

#### **8. Security**
- **SQLite with Fernet encryption** - field-level encrypted database
- **Connection strings encrypted** with AES-128
- **Machine-specific encryption**
- Encryption key derived from machine ID + PBKDF2
- API keys in OS keychain

#### **9. Basic Features**
- Settings panel
- System tray icon
- Auto-updates
- SQL formatter (v1.5)

---

### Post-MVP Features (v1.5+)

#### **10. Managed API (Paid Tier)**
- User accounts
- Stripe integration
- Usage tracking (PostgreSQL)
- 14-day free trial

#### **11. Advanced Features**
- SQL formatter
- Explain query plans
- Cloud sync (chat history)
- Team collaboration

---

## 🔧 Technical Specifications

### Desktop App (Tauri)

**Framework:**
- Tauri 1.5+
- React 18+
- TypeScript

**UI Libraries:**
- Styled Components
- Syntax highlighter (Prism.js)
- React Query (API calls)

**State Management:**
- Zustand

**Platforms:**
- Windows 10/11
- macOS 11+ (Intel + Apple Silicon)
- Linux (Ubuntu, Debian, Fedora)

---

### Local Backend (Python)

**Framework:**
- Python 3.10+
- FastAPI
- Uvicorn

**Database Drivers:**
- pyodbc (SQL Server)
- psycopg2 (PostgreSQL)
- PyMySQL (MySQL)

**Local Storage:**
- **sqlite3** (standard SQLite)
- **cryptography** (Fernet - field-level encryption)

**AI SDKs:**
- anthropic
- openai
- google-generativeai

**Packaging:**
- **PyInstaller** → standalone .exe (50-80 MB)
- Standard SQLite (built-in to Python)
- No Python installation required!

**Dependencies:**
```txt
fastapi==0.104.0
uvicorn==0.24.0
sqlalchemy==2.0.23
pyodbc==5.0.1
psycopg2==2.9.9
PyMySQL==1.1.0
cryptography==41.0.0
anthropic==0.7.0
openai==1.3.0
google-generativeai==0.3.0
```

---

### Cloud API Server (Python)

**Backend:**
- Python 3.10+ + FastAPI

**Database:**
- **PostgreSQL 15+** (production from day 1!)

**Caching:**
- Redis

**Payments:**
- Stripe

**Hosting:**
- Docker + AWS/GCP

**Dependencies:**
```txt
fastapi==0.104.0
uvicorn==0.24.0
sqlalchemy==2.0.23
psycopg2==2.9.9
redis==5.0.1
stripe==7.0.0
pyjwt==2.8.0
anthropic==0.7.0
openai==1.3.0
google-generativeai==0.3.0
```

---

## 🤖 AI Integration

### System Prompt

```
You are an expert SQL assistant.

DATABASE: {database_type}
SCHEMA: {schema}

RULES:
1. Generate syntactically correct SQL
2. Use proper formatting
3. Warn about dangerous operations (DELETE, DROP)
4. If ambiguous, ask questions
5. Provide explanations

OUTPUT:
- SQL in ```sql blocks
- Brief explanation
- Optimization tips if applicable
```

### AI Providers

**Default:** Claude 3.5 Sonnet
**Alternatives:** GPT-4, Gemini Pro

User chooses based on preference.

---

## 🔐 Security & Privacy

### Client-Side Security (Local)

**SQLite with Field-Level Encryption:**
- Standard SQLite database with Fernet encryption for sensitive fields
- Connection strings encrypted with AES-128 (Fernet)
- Encryption key derived from machine-specific ID using PBKDF2 (100,000 iterations)
- Database file useless if copied to another machine (cannot decrypt)
- Messages/queries stored in plaintext for searchability

**Field-Level Encryption:**
- Connection strings encrypted with Fernet (AES-128-CBC + HMAC-SHA256)
- API keys stored in OS keychain (not in database):
  - Windows: Credential Manager
  - macOS: Keychain
  - Linux: Secret Service API

**Auto Cleanup:**
- Chats older than 90 days deleted
- Messages limited to 1000 per chat
- Schema cache expired after 24 hours
- Daily VACUUM to reduce file size

**Protection:**
- ✅ Connection strings encrypted (cannot read with standard tools)
- ✅ Cannot decrypt DB on another machine
- ✅ Machine-specific encryption key
- ✅ Zero plaintext storage
- ✅ Machine-specific encryption key

---

### Server-Side Security (Managed Tier)

**BYOK Mode:**
- ✅ Schema never touches our servers
- ✅ All processing local
- ✅ Zero data retention on our side

**Managed Mode:**
- ⚠️ Schema sent encrypted (HTTPS/TLS 1.3)
- ⚠️ Not stored permanently (only in memory during request)
- ✅ Usage logged (metadata only - no actual data)
- ✅ JWT authentication (1 hour expiry)
- ✅ PostgreSQL encrypted at rest
- ✅ Rate limiting (100 req/min per user)

**Compliance:**
- GDPR ready (data export, deletion)
- SOC 2 Type II (future)
- ISO 27001 (future)

---

## 🗓️ Roadmap

### Phase 0: POC (Weeks 1-2)
- Basic Tauri window
- Connect to SQL Server
- Read schema
- Call Claude API
- Display SQL

### Phase 1: MVP (Weeks 3-6)
- Floating window
- Tabs + chat history
- **SQLite + Fernet** encrypted storage
- BYOK support
- Query execution (SELECT)
- Settings panel
- **PyInstaller** packaging
- Installer (Windows, Mac)

### Phase 2: Public Launch (Weeks 7-10)
- Add MySQL support
- SQL formatter
- Dark mode
- Analytics
- Landing page
- Launch (Reddit, HN, Product Hunt)

### Phase 3: Managed API (Weeks 11-16)
- Python server (FastAPI)
- **PostgreSQL** setup
- User accounts
- Stripe integration
- Usage tracking
- Portal (frontend)

---

## 💵 Budget & Economics

### Bundle Size:
- **Electron app:** 80-120 MB
- **Python backend (PyInstaller):** 50-80 MB
- **SQLite:** Built-in (no extra DLL needed)
- **Total installer:** 130-200 MB

### Infrastructure Costs:

**BYOK (Free):**
- Cost to you: ₪0
- Users pay their own API keys
- Minimal hosting: ₪1,000/year

**Managed (Paid):**
- API costs: ₪20-25/user/month (Claude/GPT)
- Infrastructure: ₪1-2/user/month
- PostgreSQL hosting: ₪2,000/year (base)
- Stripe: ₪5/user/month (3.5% + fees)
- **Total cost:** ₪27-35/user/month
- **Revenue:** ₪99/month
- **Margin:** ~65%

---

## 📊 Success Metrics

### Year 1 Goals:

**Month 3 (MVP):**
- 50 downloads
- 30 active users

**Month 6 (Paid Launch):**
- 300 downloads
- 200 active users
- 20 paying users
- ₪2,000 MRR

**Month 12:**
- 2,000 downloads
- 1,200 active users
- 100 paying users
- ₪10,000 MRR

---

## 🎉 Summary

### Tech Stack (Final):

```
Frontend:  Electron + React + TypeScript
Backend:   Python + FastAPI (local + server)
Local DB:  SQLite with Fernet encryption
Server DB: PostgreSQL (production)
AI:        Claude / GPT-4 / Gemini / Bedrock
Packaging: PyInstaller (Python → .exe)
Payment:   Stripe
```

### Key Decisions:
- ✅ **Electron** (migrated from Tauri for better macOS compatibility)
- ✅ **Python everywhere** - local + server
- ✅ **SQLite + Fernet** - field-level encrypted storage
- ✅ **PostgreSQL** - server database (from day 1)
- ✅ **PyInstaller** - no Python installation needed
- ✅ **Query execution** - run SELECT directly
- ✅ **Tabs + history** - multiple chats
- ✅ **Schema refresh** - when opening old chat
- ✅ **Auto cleanup** - 90 days, 1000 messages
- ✅ **Machine-specific encryption** - cannot decrypt on another machine
- ❌ **No templates/macros** - work with real data only
- ❌ **No dummy data generators**

### Security Layers:
1. **Fernet encryption** - AES-128 for connection strings
2. **Machine-specific key** - derived from machine ID via PBKDF2
3. **Field-level encryption** - only sensitive fields encrypted
4. **OS keychain** - API keys in system secure storage
5. **Auto cleanup** - old data deleted automatically

---

## 🚀 Next Steps

1. ✅ Setup Electron + React project
2. ✅ Setup Python + FastAPI backend
3. ✅ Implement SQLite + Fernet encrypted storage
4. ✅ Connect to SQL Server, PostgreSQL, MySQL
5. ✅ Schema extraction
6. ✅ Claude/OpenAI/Gemini/Bedrock API integration
7. ✅ Query execution
8. ✅ Tabs + chat history
9. ✅ Auto cleanup logic
10. ✅ Package with PyInstaller (SQLite built-in)
11. 🔄 Build installer
12. 🔄 Launch!

---

**Version:** 3.0 (Final)
**Date:** 2025-11-29
**Status:** Ready to Build

---

**Let's build this! 🚀**
