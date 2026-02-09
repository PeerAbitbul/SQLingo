# Frontend Build Instructions

## 📦 Building Tauri Application

### Prerequisites
- Node.js 18+
- Rust 1.70+
- Backend executable built (see backend/BUILD_INSTRUCTIONS.md)

### Step 1: Prepare Backend Binary

```bash
# Build backend first
cd ../backend
./build.sh  # or build.bat on Windows

# Create binaries directory
cd ../frontend
mkdir -p src-tauri/binaries

# Copy backend executable
# macOS/Linux:
cp ../backend/dist/db-chat-backend src-tauri/binaries/db-chat-backend-x86_64-apple-darwin
# or for Linux:
cp ../backend/dist/db-chat-backend src-tauri/binaries/db-chat-backend-x86_64-unknown-linux-gnu

# Windows:
copy ..\backend\dist\db-chat-backend.exe src-tauri\binaries\db-chat-backend-x86_64-pc-windows-msvc.exe
```

**Note:** Binary names must follow Tauri's naming convention:
- macOS: `{name}-x86_64-apple-darwin`
- Linux: `{name}-x86_64-unknown-linux-gnu`
- Windows: `{name}-x86_64-pc-windows-msvc.exe`

### Step 2: Build Tauri App

```bash
# Install dependencies
npm install

# Build for production
npm run tauri:build
```

### Output Locations

**macOS:**
- DMG: `src-tauri/target/release/bundle/dmg/`
- App: `src-tauri/target/release/bundle/macos/`

**Windows:**
- MSI: `src-tauri/target/release/bundle/msi/`
- EXE: `src-tauri/target/release/`

**Linux:**
- DEB: `src-tauri/target/release/bundle/deb/`
- AppImage: `src-tauri/target/release/bundle/appimage/`

---

## 🔧 Development Build

For development (without backend bundling):

```bash
# Start backend separately
cd ../backend
python main.py

# Start Tauri in dev mode
cd ../frontend
npm run tauri:dev
```

---

## 🎨 App Icons

Place icons in `src-tauri/icons/`:
- `32x32.png` - Small icon
- `128x128.png` - Medium icon
- `128x128@2x.png` - Retina icon
- `icon.icns` - macOS icon
- `icon.ico` - Windows icon
- `icon.png` - Source icon (1024x1024 recommended)

Generate icons automatically:
```bash
npm install -g @tauri-apps/cli
tauri icon path/to/icon.png
```

---

## 🚀 Distribution

### macOS
1. **DMG file** - Ready to distribute
2. **Code signing** (optional):
   ```bash
   codesign --force --deep --sign "Developer ID" DB\ Chat.app
   ```

### Windows
1. **MSI installer** - Ready to distribute
2. **Code signing** (optional):
   - Requires certificate
   - Configure in `tauri.conf.json`

### Linux
1. **DEB package** - For Debian/Ubuntu
2. **AppImage** - Universal Linux binary

---

## 📋 Build Configuration

Edit `src-tauri/tauri.conf.json`:

```json
{
  "package": {
    "productName": "DB Chat",
    "version": "0.1.0"
  },
  "bundle": {
    "identifier": "com.dbchat.app",
    "externalBin": [
      "binaries/db-chat-backend"
    ]
  }
}
```

---

## 🔍 Troubleshooting

### Issue: "Backend binary not found"
**Solution:** 
1. Build backend first
2. Copy to correct location with correct name
3. Make executable: `chmod +x src-tauri/binaries/*`

### Issue: "Failed to spawn backend"
**Solution:**
- Check binary permissions
- Test backend manually: `./src-tauri/binaries/db-chat-backend-*`
- Check logs in console

### Issue: "Large bundle size"
**Solution:**
- Backend is ~50-80 MB (includes Python runtime)
- Frontend is ~5-10 MB (Tauri)
- Total: ~60-90 MB (much smaller than Electron!)

### Issue: "Code signing required" (macOS)
**Solution:**
- For distribution: Get Apple Developer certificate
- For testing: Allow unsigned apps in Security settings

---

## 📝 Notes

- First build may take 10-15 minutes (Rust compilation)
- Subsequent builds are faster (incremental)
- Backend starts automatically with frontend
- Backend stops when frontend closes
- All data stored in user's home directory

---

## 🎯 Complete Build Process

```bash
# 1. Build backend
cd desktop/backend
./build.sh

# 2. Copy backend to frontend
cd ../frontend
mkdir -p src-tauri/binaries
cp ../backend/dist/db-chat-backend src-tauri/binaries/db-chat-backend-x86_64-apple-darwin
chmod +x src-tauri/binaries/*

# 3. Build Tauri
npm run tauri:build

# 4. Find installer
ls -la src-tauri/target/release/bundle/
```

---

## ✅ Testing the Build

1. **Install the app** from the bundle
2. **Launch DB Chat**
3. **Check backend** - should start automatically
4. **Test features**:
   - Add connection
   - Add API key
   - Create chat
   - Generate SQL
5. **Check logs** in console

---

**Ready to distribute!** 🚀

