# Contributing to SQLingo

Thanks for your interest in contributing! Here's everything you need to get started.

## Getting Started

1. Fork the repo and clone your fork
2. Follow the [Quick Start](README.md#-quick-start) to run the app locally
3. Create a branch: `git checkout -b feat/your-feature` or `fix/your-bug`

## Project Layout

```
desktop/
├── frontend/   Electron + React (TypeScript, styled-components, Zustand)
└── backend/    Python FastAPI (local server, AI providers, DB connectors)
```

Key frontend entry points: `src/components/ChatWindow.tsx`, `src/stores/`  
Key backend entry points: `api/routes.py`, `ai/client.py`, `database/connection.py`

## Making Changes

**Frontend**
```bash
cd desktop/frontend && npm install
npm run electron:dev
```

**Backend** (auto-reloads on save in dev mode)
```bash
cd desktop/backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp env.example .env
python main.py
```

## Adding an AI Provider

1. Create `desktop/backend/ai/<name>_provider.py` implementing `AIProviderBase`
2. Add the enum value in `ai/providers.py`
3. Register it in `ai/client.py`
4. Add the route branch in `api/routes.py` (`/chat/query` and `/chat/generate-title`)
5. Add the frontend type in `src/types/aiProvider.ts` and a button in `ChatInput.tsx`
6. Add the key/model fields in `src/stores/apiKeyStore.ts` and `APIKeyManager.tsx`

## Pull Requests

- Keep PRs focused — one feature or fix per PR
- Include a short description of *why*, not just *what*
- Test your changes against at least one DB type (PostgreSQL/MySQL/SQL Server)
- TypeScript must compile without errors: `cd desktop/frontend && npx tsc --noEmit`

## Reporting Bugs

Open a [GitHub Issue](https://github.com/PeerAbitbul/SQLingo/issues) with:
- OS and version
- Steps to reproduce
- Expected vs actual behaviour
- Backend logs if relevant (`~/.sqlingo/` directory)
