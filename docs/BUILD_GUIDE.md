# SQLingo Desktop - Build Guide

---

## Build Architecture

```
Desktop Application (SQLingo)
├── Frontend (React + Vite + Electron)
│   ├── Build: TypeScript → JavaScript bundle
│   ├── Package: electron-builder → Platform installers
│   └── Output: DMG, ZIP (Mac) | NSIS, Portable (Windows) | AppImage, DEB (Linux)
│
└── Backend (Python + FastAPI)
    ├── Build: PyInstaller → Single executable
    ├── Place: desktop/frontend/resources/db-chat-backend
    └── Auto-start: Electron spawns backend on launch
```

**Important:** You must build the Python backend with PyInstaller BEFORE running `electron:build`. Otherwise the app will launch without a backend.

---

## Prerequisites

- Node.js 18+
- Python 3.10+
- Virtual environment set up (`desktop/backend/venv/`)

---

## Step 1 — Build the Python backend

```bash
cd desktop/backend
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install pyinstaller
pyinstaller db-chat-backend.spec
```

Output: `desktop/backend/dist/db-chat-backend`

---

## Step 2 — Copy executable to frontend resources

```bash
mkdir -p ../frontend/resources
cp dist/db-chat-backend ../frontend/resources/db-chat-backend
```

Windows:
```bash
copy dist\db-chat-backend.exe ..\frontend\resources\db-chat-backend.exe
```

---

## Step 3 — Build the Electron app

```bash
cd ../frontend

npm run electron:build:mac      # → release/SQLingo-x.x.x-arm64.dmg + x64.dmg
npm run electron:build:win      # → release/SQLingo-x.x.x-x64.exe
npm run electron:build:linux    # → release/SQLingo-x.x.x-x64.AppImage
```

---

## Build Checklist

- [ ] `venv` is set up and dependencies installed
- [ ] PyInstaller build succeeded (`dist/db-chat-backend` exists)
- [ ] Executable copied to `frontend/resources/`
- [ ] Tested in dev mode first (`npm run electron:dev`)
- [ ] Version bumped in `desktop/frontend/package.json`
