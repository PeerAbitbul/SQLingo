# SQLingo Desktop Application

Electron + React + Python desktop app for AI-powered database queries.

> **All AI calls are made locally using your own API keys (BYOK)**

---

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+

### Setup

**1. Backend:**
```bash
cd desktop/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp env.example .env
# Edit .env and add your API keys
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

## Architecture

```
desktop/
├── frontend/              # Electron + React
│   ├── electron/          # Main process
│   │   ├── main.js        # Electron entry
│   │   └── preload.js     # IPC bridge
│   └── src/               # React app
│       ├── components/    # UI components
│       ├── stores/        # Zustand state
│       └── utils/         # Helpers
│
└── backend/               # Python FastAPI (LOCAL)
    ├── ai/                # AI providers (BYOK)
    │   ├── client.py      # Unified AI client
    │   ├── openai_provider.py
    │   ├── claude_provider.py
    │   ├── gemini_provider.py
    │   └── bedrock_provider.py
    ├── database/          # DB connectors
    ├── api/               # FastAPI routes
    └── main.py            # Entry point
```

---

## Building

```bash
cd desktop/frontend

npm run electron:build:mac    # macOS
npm run electron:build:win    # Windows
npm run electron:build:linux  # Linux
```

**Output:** `desktop/frontend/release/`

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Desktop | Electron |
| UI | React 18 + TypeScript |
| State | Zustand |
| Styling | Styled Components |
| Build | Vite |
| Backend | Python 3.10+ / FastAPI |
| AI SDKs | anthropic, openai, google-generativeai, boto3 |
| DB Drivers | psycopg2, PyMySQL, pymssql |

---

## AI Providers (BYOK)

| Provider | Required |
|----------|----------|
| OpenAI | API Key |
| Claude | API Key |
| Gemini | API Key |
| AWS Bedrock | AWS Credentials |

All AI calls go directly from your machine to the provider APIs.
