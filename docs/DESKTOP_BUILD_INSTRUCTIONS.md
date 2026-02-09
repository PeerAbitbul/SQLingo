# Backend Build Instructions

## 📦 Building Standalone Executable

### Prerequisites
- Python 3.10+
- Virtual environment activated
- All dependencies installed

### Quick Build

**macOS/Linux:**
```bash
./build.sh
```

**Windows:**
```bash
build.bat
```

### Manual Build

```bash
# Install PyInstaller
pip install pyinstaller

# Run build script
python build.py

# Or use spec file directly
pyinstaller build.spec
```

### Output

The executable will be created in:
- **macOS/Linux:** `dist/db-chat-backend`
- **Windows:** `dist\db-chat-backend.exe`

### Testing the Build

```bash
cd dist
./db-chat-backend  # or db-chat-backend.exe on Windows
```

The server should start on `http://localhost:8000`

---

## 🔧 Troubleshooting

### Issue: "Module not found"
**Solution:** Add the module to `hiddenimports` in `build.spec`

### Issue: "SQLite not found"
**Solution:**
- SQLite is built into Python - no external installation needed
- The `sqlite3` module is automatically included in the build

### Issue: "ODBC Driver not found"
**Solution:** Install ODBC drivers separately on target machine

### Issue: Large executable size
**Solution:** 
- Use `--exclude-module` for unused packages
- Enable UPX compression (already enabled)

---

## 📋 Build Configuration

### Included Modules
- FastAPI + Uvicorn
- SQLAlchemy + Database drivers
- AI SDKs (Claude, OpenAI, Gemini, Bedrock)
- Cryptography (Fernet encryption)
- All custom modules (api, database, ai, encryption)

### Excluded Modules
- tkinter
- matplotlib
- numpy
- pandas

### Build Options
- **--onefile:** Single executable
- **--console:** Keep console window (for debugging)
- **--optimize=2:** Python optimization level
- **--clean:** Clean build directory

---

## 🎯 Next Steps

After building the backend:

1. **Test locally:**
   ```bash
   cd dist
   ./db-chat-backend
   ```

2. **Copy to Tauri resources:**
   ```bash
   cp dist/db-chat-backend ../frontend/src-tauri/binaries/
   ```

3. **Build Tauri app:**
   ```bash
   cd ../frontend
   npm run tauri:build
   ```

---

## 📝 Notes

- The executable is **platform-specific** (build on target OS)
- Size: ~50-80 MB (includes Python runtime + all dependencies)
- No Python installation required on target machine
- SQLite with Fernet encryption works out of the box
- First run may be slower (unpacking)

---

## 🚀 Distribution

The built executable can be distributed:
- Standalone (just the .exe)
- With Tauri app (bundled in installer)
- Via package manager (future)

**Recommended:** Bundle with Tauri for complete installation experience.

