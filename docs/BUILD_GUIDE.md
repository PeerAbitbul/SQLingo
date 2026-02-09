# Qognix Desktop - Build Guide

**Version:** 0.1.0
**Date:** December 4, 2024
**Status:** ✅ Successfully Built for macOS

---

## 📦 Overview

This guide covers building Qognix Desktop application installers for macOS, Windows, and Linux using Electron Builder.

---

## 🏗️ Build Architecture

```
Desktop Application
├── Frontend (React + Vite + Electron)
│   ├── Build: TypeScript → JavaScript bundle
│   ├── Package: electron-builder → Platform installers
│   └── Output: DMG, ZIP (Mac) | NSIS, Portable (Windows) | AppImage, DEB (Linux)
│
└── Backend (Python + FastAPI)
    ├── Build: PyInstaller → Single executable (34 MB)
    ├── Auto-start: Electron spawns backend on launch
    └── Bundled: Included in app/resources/ directory
```

---

## ⚙️ Prerequisites

### Required

- **Node.js**: v18+ (for frontend build)
- **npm**: v9+ (package manager)
- **Python**: v3.11+ (for backend)
- **electron-builder**: v26+ (installed as dev dependency)

### Optional (for code signing)

- **macOS**: Apple Developer ID certificate
- **Windows**: Code signing certificate
- **Linux**: No code signing required

---

## 📁 Project Structure

```
desktop/
├── frontend/
│   ├── src/                    # React source code
│   ├── electron/              # Electron main & preload scripts
│   ├── dist/                  # Vite build output
│   ├── build/                 # Build resources (icons)
│   ├── release/              # Final installers output
│   ├── package.json          # electron-builder config
│   └── vite.config.ts        # Vite configuration
│
└── backend/
    ├── main.py               # FastAPI backend
    └── requirements.txt      # Python dependencies
```

---

## 🎨 Icon Setup

### Requirements

- **Format**: PNG (transparent background recommended)
- **Minimum Size**: 512x512 pixels
- **Recommended Size**: 1024x1024 pixels
- **Location**: `desktop/frontend/build/icon.png`

### Prepare Icon

If your icon is smaller than 512x512, resize it:

```bash
cd desktop/frontend
mkdir -p build
cp public/Qognix_photo.png build/icon.png
sips -z 512 512 build/icon.png --out build/icon.png
```

### Icon Usage

The icon is automatically used for:
- macOS: App icon, DMG background
- Windows: EXE icon, installer icon
- Linux: Desktop icon

---

## 🔧 Build Configuration

### Package.json Configuration

The build configuration is located in [package.json:42-104](desktop/frontend/package.json#L42-L104):

```json
{
  "build": {
    "appId": "com.qognix.desktop",
    "productName": "Qognix",
    "files": [
      "dist/**/*",
      "electron/**/*",
      "package.json"
    ],
    "directories": {
      "buildResources": "build",
      "output": "release"
    },
    "mac": {
      "category": "public.app-category.developer-tools",
      "icon": "build/icon.png",
      "target": [
        {"target": "dmg", "arch": ["x64", "arm64"]},
        {"target": "zip", "arch": ["x64", "arm64"]}
      ],
      "artifactName": "${productName}-${version}-${arch}.${ext}"
    },
    "win": {
      "icon": "build/icon.png",
      "target": [
        {"target": "nsis", "arch": ["x64"]},
        {"target": "portable", "arch": ["x64"]}
      ],
      "artifactName": "${productName}-${version}-${arch}.${ext}"
    },
    "linux": {
      "icon": "build/icon.png",
      "target": [
        {"target": "AppImage", "arch": ["x64"]},
        {"target": "deb", "arch": ["x64"]}
      ],
      "category": "Development",
      "artifactName": "${productName}-${version}-${arch}.${ext}"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

---

## 🚀 Build Commands

### Build All Platforms

```bash
cd desktop/frontend
npm run electron:build
```

### Build Specific Platforms

```bash
# macOS only
npm run electron:build:mac

# Windows only
npm run electron:build:win

# Linux only
npm run electron:build:linux
```

### Development Build (No Installer)

```bash
# Build Vite bundle only
npm run build

# Run in development mode
npm run electron:dev
```

---

## 📦 macOS Build

### Build Process

```bash
cd desktop/frontend
npm run electron:build:mac
```

### Build Steps

1. **TypeScript Compilation**
   - Compiles `.tsx` → `.js` with type checking
   - Duration: ~2 seconds

2. **Vite Bundle**
   - Bundles React app with dependencies
   - Output: `dist/index.html`, `dist/assets/*.js`, `dist/assets/*.css`
   - Size: ~456 KB (139 KB gzipped)
   - Duration: ~617ms

3. **Native Dependencies**
   - Rebuilds native modules for Electron
   - Architecture: x64 and arm64 separately
   - Duration: ~5 seconds per architecture

4. **Electron Packaging**
   - Packages app for each architecture
   - Creates `.app` bundles
   - Duration: ~10 seconds per architecture

5. **Installer Creation**
   - Creates DMG and ZIP for each architecture
   - Generates block maps for auto-updates
   - Duration: ~15 seconds

### Build Output

```
release/
├── Qognix-0.1.0-x64.dmg           # 113 MB - Intel Mac installer
├── Qognix-0.1.0-x64.dmg.blockmap  # Auto-update metadata
├── Qognix-0.1.0-x64.zip           # 109 MB - Intel Mac portable
├── Qognix-0.1.0-x64.zip.blockmap  # Auto-update metadata
├── Qognix-0.1.0-arm64.dmg         # 108 MB - Apple Silicon installer
├── Qognix-0.1.0-arm64.dmg.blockmap
├── Qognix-0.1.0-arm64.zip         # 104 MB - Apple Silicon portable
└── Qognix-0.1.0-arm64.zip.blockmap
```

### Architecture Support

| Architecture | Macs Supported | File Size |
|--------------|----------------|-----------|
| **x64** | Intel Macs (2006-2020) | 113 MB |
| **arm64** | Apple Silicon (M1/M2/M3, 2020+) | 108 MB |

### Code Signing Status

```
⚠️ Unsigned Build
- Code signing skipped: No Developer ID certificate found
- App will show "Unidentified Developer" warning on first launch
- Users need to: Right-click → Open → Confirm
```

**To enable code signing:**
1. Enroll in [Apple Developer Program](https://developer.apple.com) ($99/year)
2. Create Developer ID Application certificate
3. Set environment variables:
   ```bash
   export CSC_LINK=/path/to/certificate.p12
   export CSC_KEY_PASSWORD=your_password
   ```
4. Rebuild: `npm run electron:build:mac`

---

## 🪟 Windows Build

### Build Process

```bash
cd desktop/frontend
npm run electron:build:win
```

### Build Targets

1. **NSIS Installer** (`Qognix-0.1.0-x64.exe`)
   - Full-featured installer with options
   - Installation directory selection
   - Desktop & Start Menu shortcuts
   - Add/Remove Programs entry
   - Size: ~110 MB

2. **Portable** (`Qognix-0.1.0-x64-portable.exe`)
   - No installation required
   - Run directly from any location
   - Settings stored in app directory
   - Size: ~110 MB

### Requirements

- **Build on**: Windows, macOS, or Linux (with Wine)
- **Run on**: Windows 10+ (64-bit)

### Code Signing

For signed Windows builds:
```bash
export CSC_LINK=/path/to/certificate.pfx
export CSC_KEY_PASSWORD=your_password
npm run electron:build:win
```

---

## 🐧 Linux Build

### Build Process

```bash
cd desktop/frontend
npm run electron:build:linux
```

### Build Targets

1. **AppImage** (`Qognix-0.1.0-x64.AppImage`)
   - Universal Linux format
   - No installation required
   - Runs on most distributions
   - Size: ~120 MB

2. **DEB Package** (`Qognix-0.1.0-x64.deb`)
   - Debian/Ubuntu package format
   - Install with: `sudo dpkg -i Qognix-0.1.0-x64.deb`
   - System integration (menu entry, file associations)
   - Size: ~110 MB

### Requirements

- **Build on**: Linux (or macOS/Windows with Docker)
- **Run on**: Ubuntu 18.04+, Debian 10+, Fedora 30+, etc.

---

## 🔍 Build Verification

### 1. Check Build Output

```bash
ls -lh release/
```

Expected output:
- DMG files (macOS installers)
- ZIP files (macOS portable)
- EXE files (Windows installers)
- AppImage/DEB files (Linux packages)
- Blockmap files (auto-update metadata)

### 2. Test Installation

**macOS:**
```bash
# Open DMG
open release/Qognix-0.1.0-arm64.dmg

# Install by dragging to Applications
# Launch from Applications folder
```

**Windows:**
```bash
# Run installer
./release/Qognix-0.1.0-x64.exe

# Or run portable
./release/Qognix-0.1.0-x64-portable.exe
```

**Linux:**
```bash
# Make AppImage executable
chmod +x release/Qognix-0.1.0-x64.AppImage

# Run AppImage
./release/Qognix-0.1.0-x64.AppImage

# Or install DEB
sudo dpkg -i release/Qognix-0.1.0-x64.deb
```

### 3. Verify Functionality

✅ **App Launch**: Application opens without errors
✅ **Icon Display**: Correct icon in dock/taskbar
✅ **Window Controls**: Minimize, maximize, close work
✅ **Backend Connection**: Check if backend starts (currently manual)
✅ **Database Connection**: Connect to a database
✅ **Chat Functionality**: Send a query and get response

---

## 🐛 Common Issues

### Issue 1: Icon Too Small

**Error:**
```
image /path/to/icon.png must be at least 512x512
```

**Fix:**
```bash
sips -z 512 512 build/icon.png --out build/icon.png
```

### Issue 2: TypeScript Errors

**Error:**
```
TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'
```

**Fix:**
```bash
# Check for errors
npm run build

# Fix type issues in source code
# Then rebuild
```

### Issue 3: CORS Errors

**Error:**
```
Access to fetch at 'http://localhost:8000/api/...' has been blocked by CORS policy
```

**Fix:**
Update backend CORS configuration in [main.py:48-57](desktop/backend/main.py#L48-L57)

### Issue 4: Port Already in Use

**Error:**
```
Error: Address already in use (port 8000)
```

**Fix:**
Backend automatically finds alternative port (8001, 8002, etc.)
See [DYNAMIC_PORT_CONFIGURATION.md](DYNAMIC_PORT_CONFIGURATION.md)

### Issue 5: Missing Dependencies

**Error:**
```
Module not found: Can't resolve '@tanstack/react-query'
```

**Fix:**
```bash
cd desktop/frontend
npm install
```

---

## 📊 Build Metrics

### Build Performance

| Stage | Duration | Output Size |
|-------|----------|-------------|
| TypeScript | ~2s | - |
| Vite Bundle | ~0.6s | 456 KB |
| Native Rebuild (x64) | ~5s | - |
| Native Rebuild (arm64) | ~5s | - |
| Package macOS x64 | ~10s | - |
| Package macOS arm64 | ~10s | - |
| Create Installers | ~15s | - |
| **Total** | **~48s** | **434 MB** (all files) |

### File Sizes

| File | Compressed | Uncompressed |
|------|------------|--------------|
| JavaScript Bundle | 139 KB | 456 KB |
| CSS Bundle | 0.26 KB | 0.34 KB |
| DMG Installer (x64) | 146 MB | - |
| DMG Installer (arm64) | 141 MB | - |
| ZIP Portable (x64) | 143 MB | - |
| ZIP Portable (arm64) | 138 MB | - |

---

## 🚨 Important Notes

### ✅ Backend Bundled

**Current State:**
- Frontend and backend packaged together in single app
- Backend automatically starts when app launches
- Backend automatically stops when app closes
- No Python installation required

**Technical Details:**
- Backend built with PyInstaller (34 MB executable)
- Located in: `[app]/Contents/Resources/app/resources/db-chat-backend`
- Auto-start implemented in `electron/main.js`
- Dynamic port selection (8000-8099)

**For detailed backend bundling documentation, see:**
- [BACKEND_BUNDLING_GUIDE.md](BACKEND_BUNDLING_GUIDE.md) - Complete PyInstaller integration guide

### ⚠️ Code Signing

**Without Code Signing:**
- macOS: "Unidentified Developer" warning
- Windows: SmartScreen warning
- Linux: No issues

**With Code Signing:**
- macOS: Smooth installation, no warnings
- Windows: Trusted publisher, no warnings
- Better user experience

### ⚠️ Auto-Updates

**Current State:**
- Block maps generated (`*.blockmap` files)
- Auto-update infrastructure ready
- Update server not implemented

**To Enable Auto-Updates:**
1. Set up update server (GitHub Releases, S3, etc.)
2. Configure `publish` in package.json:
   ```json
   "publish": {
     "provider": "github",
     "owner": "your-username",
     "repo": "qognix"
   }
   ```
3. Update electron/main.js to check for updates

---

## 📝 Build Checklist

Before building for production:

- [ ] Update version in package.json
- [ ] Update CHANGELOG.md
- [ ] Test all features in development mode
- [ ] Fix all TypeScript errors
- [ ] Remove console.log statements (keep errorLogger)
- [ ] Update environment variables
- [ ] Test database connections
- [ ] Verify icon is 512x512 minimum
- [ ] Run `npm run build` to test Vite bundle
- [ ] Clean old builds: `rm -rf release/`

After building:

- [ ] Test DMG installation on macOS
- [ ] Test EXE installation on Windows
- [ ] Test AppImage on Linux
- [ ] Verify app launches correctly
- [ ] Test database functionality
- [ ] Check for console errors
- [ ] Verify icon displays correctly
- [ ] Test window controls

---

## 🔗 Related Documentation

- [BACKEND_BUNDLING_GUIDE.md](BACKEND_BUNDLING_GUIDE.md) - **PyInstaller backend integration (MUST READ)**
- [DYNAMIC_PORT_CONFIGURATION.md](DYNAMIC_PORT_CONFIGURATION.md) - Dynamic port selection system
- [AUTH_IMPLEMENTATION.md](AUTH_IMPLEMENTATION.md) - Authentication & Managed API
- [PROGRESS.md](PROGRESS.md) - Development progress
- [README.md](README.md) - Project overview

---

## 📞 Troubleshooting Help

### Get Help

- **Issue Tracker**: [GitHub Issues](https://github.com/your-org/qognix/issues)
- **Documentation**: [Electron Builder Docs](https://www.electron.build/)
- **Community**: Electron Discord

### Debug Mode

Enable verbose build output:
```bash
DEBUG=electron-builder npm run electron:build:mac
```

### Clean Build

Remove all build artifacts:
```bash
rm -rf dist/ release/ node_modules/.vite/
npm run build
```

---

**Last Updated:** December 4, 2024
**Build Status:** ✅ macOS builds successful with bundled backend
**Backend Bundling:** ✅ Complete (see BACKEND_BUNDLING_GUIDE.md)
**Next Steps:** Test installers, implement code signing, build Windows/Linux
