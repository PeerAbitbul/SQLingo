# Quick Rebuild Guide

**For full documentation, see [BACKEND_BUNDLING_GUIDE.md](BACKEND_BUNDLING_GUIDE.md)**

---

## 🚀 Quick Commands

### Full Rebuild (Backend + Frontend)

```bash
# 1. Rebuild backend
cd desktop/backend
python3 -m PyInstaller build.spec --clean

# 2. Copy to frontend
cp dist/db-chat-backend ../frontend/resources/

# 3. Rebuild frontend
cd ../frontend
npm run electron:build:mac

# Done! Check release/ directory
ls -lh release/
```

**Time:** ~2 minutes
**Output:** 4 installers (x64 + arm64, DMG + ZIP)

---

### Frontend Only Rebuild

If you only changed frontend code (React, CSS, etc.):

```bash
cd desktop/frontend
npm run electron:build:mac
```

**Time:** ~50 seconds
**Note:** Backend already bundled from previous build

---

### Backend Only Rebuild

If you only changed backend code (Python):

```bash
# 1. Rebuild backend
cd desktop/backend
python3 -m PyInstaller build.spec --clean

# 2. Copy to frontend
cp dist/db-chat-backend ../frontend/resources/

# 3. Rebuild frontend (needed to package new backend)
cd ../frontend
npm run electron:build:mac
```

**Time:** ~1 minute

---

## 📋 Pre-Build Checklist

- [ ] Test backend: `cd desktop/backend && python3 main.py`
- [ ] Test frontend: `cd desktop/frontend && npm run dev`
- [ ] Clean old builds: `rm -rf desktop/backend/dist desktop/backend/build desktop/frontend/release`
- [ ] Update version in `desktop/frontend/package.json` (if releasing)

---

## 🔍 Verify Build

```bash
# Check installers created
ls -lh desktop/frontend/release/

# Expected files:
# - Qognix-0.1.0-arm64.dmg (141 MB)
# - Qognix-0.1.0-x64.dmg (146 MB)
# - Qognix-0.1.0-arm64.zip (138 MB)
# - Qognix-0.1.0-x64.zip (143 MB)
# - *.blockmap files (for auto-updates)
```

---

## 🐛 If Build Fails

### Backend Build Failed

```bash
# Check Python version
python3 --version  # Should be 3.11+

# Reinstall PyInstaller
pip3 install --upgrade pyinstaller

# Check spec file
cat desktop/backend/build.spec

# Try verbose build
cd desktop/backend
python3 -m PyInstaller build.spec --clean --log-level DEBUG
```

### Frontend Build Failed

```bash
# Check Node version
node --version  # Should be 18+

# Reinstall dependencies
cd desktop/frontend
rm -rf node_modules package-lock.json
npm install

# Check TypeScript
npm run build

# Try verbose build
DEBUG=electron-builder npm run electron:build:mac
```

### Backend Not in App

```bash
# Verify backend copied
ls -lh desktop/frontend/resources/db-chat-backend

# If missing, copy manually
cp desktop/backend/dist/db-chat-backend desktop/frontend/resources/

# Verify package.json includes resources
grep -A 10 '"files"' desktop/frontend/package.json
# Should show: "resources/**/*"

# Rebuild
cd desktop/frontend
npm run electron:build:mac
```

---

## 📝 Common Changes

### Update Python Dependencies

```bash
# 1. Update requirements.txt
cd desktop/backend
pip3 install new-package
pip3 freeze > requirements.txt

# 2. Update spec file if needed
# Add to hiddenimports in build.spec

# 3. Rebuild backend
python3 -m PyInstaller build.spec --clean
cp dist/db-chat-backend ../frontend/resources/

# 4. Rebuild app
cd ../frontend
npm run electron:build:mac
```

### Update Electron Dependencies

```bash
cd desktop/frontend
npm install new-package
npm run electron:build:mac
```

### Update Icon

```bash
# 1. Resize icon (must be 512x512+)
sips -z 512 512 new-icon.png --out desktop/frontend/build/icon.png

# 2. Rebuild
cd desktop/frontend
npm run electron:build:mac
```

### Update Version

```bash
# 1. Edit version
nano desktop/frontend/package.json
# Change "version": "0.1.0" to "0.1.1"

# 2. Rebuild
npm run electron:build:mac

# 3. Verify new version
ls desktop/frontend/release/
# Should see: Qognix-0.1.1-*.dmg
```

---

## 🎯 Build for Different Platforms

### macOS (Current)

```bash
cd desktop/frontend
npm run electron:build:mac
```

**Output:** DMG + ZIP for x64 and arm64

### Windows (Not Tested)

```bash
cd desktop/frontend
npm run electron:build:win
```

**Output:** NSIS installer + Portable EXE for x64

**Note:** Backend needs to be rebuilt on Windows with PyInstaller

### Linux (Not Tested)

```bash
cd desktop/frontend
npm run electron:build:linux
```

**Output:** AppImage + DEB for x64

**Note:** Backend needs to be rebuilt on Linux with PyInstaller

---

## 📊 Expected File Sizes

### Backend

- Executable: 34 MB
- With dependencies: 34 MB (all included)

### Frontend

- Vite bundle: 456 KB
- With Electron: ~110 MB (base)

### Full App

- With backend: ~140-145 MB (per architecture)
- Compressed (DMG): ~140-145 MB
- Compressed (ZIP): ~135-140 MB

---

## 🔗 Full Documentation

For complete details, troubleshooting, and technical deep-dive:

- [BACKEND_BUNDLING_GUIDE.md](BACKEND_BUNDLING_GUIDE.md) - Complete backend integration guide
- [BUILD_GUIDE.md](BUILD_GUIDE.md) - Complete build instructions
- [DYNAMIC_PORT_CONFIGURATION.md](DYNAMIC_PORT_CONFIGURATION.md) - Port discovery system

---

**Quick Reference Commands**

```bash
# Full rebuild
cd desktop/backend && python3 -m PyInstaller build.spec --clean && \
cp dist/db-chat-backend ../frontend/resources/ && \
cd ../frontend && npm run electron:build:mac

# Test built app
open desktop/frontend/release/Qognix-0.1.0-arm64.dmg

# Clean everything
rm -rf desktop/backend/{dist,build} desktop/frontend/release

# Check backend is bundled
ls -lh /Applications/Qognix.app/Contents/Resources/app/resources/
```

---

**Last Updated:** December 4, 2024
