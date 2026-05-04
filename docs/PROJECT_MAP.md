# PROJECT_MAP.md

Quick reference for AI assistants to navigate the SQLingo codebase efficiently.

---

## High-Level Architecture

```
root/
├── desktop/          # Electron Desktop App (Local-Only, BYOK)
├── docs/             # Documentation
└── scripts/          # Build & utility scripts
```

**Note:** This is a **desktop-only** application. There is no server component. All functionality runs locally on the user's machine.

---

## Desktop App (`desktop/`)

### Frontend (`desktop/frontend/src/`)

| Path | Purpose |
|------|---------|
| `components/` | UI Components (ChatWindow, ChatHeader, Settings, etc.) |
| `stores/` | Zustand State Stores (chatStore, connectionStore, apiKeyStore, etc.) |
| `hooks/` | Custom React Hooks |
| `styles/` | Global CSS Styles |
| `types/` | TypeScript Types |
| `utils/` | Utility Functions (API client, error logger, port config) |
| `App.tsx` | Main App Entry |

### Backend (`desktop/backend/`)

| Path | Purpose |
|------|---------|
| `api/routes.py` | Local API Endpoints (chat, query, schema, connections) |
| `api/models_routes.py` | AI Model Routes (list available models) |
| `ai/` | AI Providers (OpenAI, Claude, Gemini, Bedrock) |
| `ai/client.py` | Main AI Client (BYOK only) |
| `database/` | Database Connection Handlers (SQL Server, PostgreSQL, MySQL) |
| `encryption/` | API Key Encryption (local storage) |
| `execution_plan/` | SQL Execution Plan Analysis |
| `local_database.py` | Local SQLite DB Operations (chats, connections, settings) |
| `main.py` | FastAPI Backend Entry Point |
| `startup.py` | Startup Logic |
| `device_id.py` | Device ID Generation |

### Electron (`desktop/frontend/electron/`)

| Path | Purpose |
|------|---------|
| `main.js` | Electron Main Process (window management, backend lifecycle) |
| `preload.js` | Electron Preload Script (IPC bridge) |

---

## Documentation (`docs/`)

Key docs: 
- `BUILD_GUIDE.md` - How to build the desktop app
- `EXECUTION_PLAN_FEATURE.md` - Execution plan analysis feature
- `ENV_CONFIGURATION.md` - Environment variables
- `API_KEY_TROUBLESHOOTING.md` - API key setup help
- `CONNECTION_GUIDE.md` - Database connection setup

---

## AI Rules

- ✅ Only open files directly related to the task
- ❌ Never scan the full repository
- ❌ Never read: `node_modules`, `dist`, `build`, `.venv`, `__pycache__`, `logs`, `.git`
- ❌ Do not explore unrelated folders
- ❌ Do not explore `OldObject*` directories (deprecated code)
- ❌ **There is NO `server/` directory** - this is a desktop-only app

---

## Task → Files Mapping

| Task Type | Files to Open |
|-----------|---------------|
| **Desktop UI** | `desktop/frontend/src/components/` + `stores/` |
| **Desktop API** | `desktop/backend/api/routes.py` |
| **Desktop AI** | `desktop/backend/ai/` (specific provider file) |
| **Desktop DB** | `desktop/backend/database/` + `local_database.py` |
| **Database Connections** | `desktop/backend/database/` (connection handlers) |
| **AI Providers** | `desktop/backend/ai/providers.py` + specific provider files |
| **Execution Plans** | `desktop/backend/execution_plan/` |
| **API Keys** | `desktop/backend/encryption/` + `desktop/frontend/src/stores/apiKeyStore.ts` |
| **Chat Management** | `desktop/frontend/src/stores/chatStore.ts` + `desktop/backend/local_database.py` |
| **Settings** | `desktop/frontend/src/components/Settings.tsx` + `desktop/frontend/src/stores/settingsStore.ts` |
| **Electron** | `desktop/frontend/electron/main.js` + `preload.js` |
| **Config/Env** | `.env` files in `desktop/backend/` and `desktop/frontend/` |

---

## Architecture Notes

- **Local-Only:** All data stays on the user's machine (SQLite database)
- **BYOK (Bring Your Own Key):** Users provide their own API keys for AI services
- **No Authentication:** No login required, no cloud sync
- **No Usage Limits:** All features are free and unrestricted
- **Supported Databases:** SQL Server, PostgreSQL, MySQL
- **Supported AI Providers:** OpenAI, Anthropic (Claude), Google (Gemini), AWS Bedrock

---

*Keep this file updated as the project evolves.*
