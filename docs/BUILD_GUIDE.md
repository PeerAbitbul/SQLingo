# SQLingo Desktop - Build Guide

**Version:** 0.1.9
**Status:** ✅ Successfully Built for macOS

---

## 📦 Overview

This guide covers building SQLingo Desktop application installers for macOS, Windows, and Linux using Electron Builder.

---

## 🏗️ Build Architecture

```
Desktop Application (SQLingo)
├── Frontend (React + Vite + Electron)
│   ├── Build: TypeScript → JavaScript bundle
│   ├── Package: electron-builder → Platform installers
│   └── Output: DMG, ZIP (Mac) | NSIS, Portable (Windows) | AppImage, DEB (Linux)
│
└── Backend (Python + FastAPI)
    ├── Build: PyInstaller → Single executable
    ├── Auto-start: Electron spawns backend on launch
    └── Bundled: Included in app resources directory
```

---

## ⚙️ Prerequisites

- **Node.js**: v18+
- **npm**: v9+
- **Python**: v3.11+
- **electron-builder**: v26+

---

## 🎨 Icon Setup

The icons are located in `desktop/frontend/public/` and `desktop/frontend/build/`.
- **macOS**: `SQLingoICON.png`
- **Windows/Linux**: Automatically generated from PNG.

---

## 🚀 Build Commands

```bash
cd desktop/frontend

# Build All Platforms
npm run electron:build

# macOS only
npm run electron:build:mac

# Windows only
npm run electron:build:win

# Linux only
npm run electron:build:linux
```

---

## 📦 macOS Build Output

```
release/
├── SQLingo-0.1.9-arm64.dmg         # Apple Silicon installer
├── SQLingo-0.1.9-x64.dmg           # Intel Mac installer
```

---

## 📝 Build Checklist (SQLingo)

- [ ] Update version in `package.json`
- [ ] Test all features in dev mode (`npm run electron:dev`)
- [ ] Verify `SQLingoICON.png` is correctly set in `electron/main.js`
- [ ] Ensure backend `main.py` has no cloud references
- [ ] Run `npm run build` to verify the React bundle

---

**Distribute SQLingo as a standalone, private, and free tool.**
