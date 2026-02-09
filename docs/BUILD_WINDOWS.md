# Building Qognix for Windows

**For someone with a Windows machine to build the installers**

---

## 📋 Prerequisites

Before running the build, install these:

### 1. Python 3.11+
Download from: https://www.python.org/downloads/
- ✅ Check "Add Python to PATH" during installation
- Verify: Open PowerShell and run `python --version`

### 2. Node.js 18+
Download from: https://nodejs.org/
- Install the LTS version
- Verify: Open PowerShell and run `node --version`

### 3. Git
Download from: https://git-scm.com/download/win
- Use default settings

---

## 🚀 Quick Build (5 Minutes)

### Option 1: Using the Batch File (Easiest)

1. **Clone or download the project**
2. **Double-click**: `desktop/build-windows.bat`
3. **Wait**: Takes ~2-3 minutes
4. **Done!**: Installers will be in `desktop/frontend/release/`

### Option 2: Manual Commands

Open **PowerShell** in the project root:

```powershell
# 1. Navigate to backend
cd desktop\backend

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Build backend executable
python -m PyInstaller build.spec --clean

# 4. Copy backend to frontend
Copy-Item dist\db-chat-backend.exe ..\frontend\resources\

# 5. Navigate to frontend
cd ..\frontend

# 6. Install Node dependencies (first time only)
npm install

# 7. Build Windows installers
npm run electron:build:win
```

---

## 📦 What You'll Get

After the build completes, check `desktop/frontend/release/`:

```
release/
├── Qognix-0.1.0-x64.exe           # NSIS Installer (~110 MB)
├── Qognix-0.1.0-x64-portable.exe  # Portable version (~110 MB)
└── *.blockmap files               # Auto-update metadata
```

### Installer Types:

**NSIS Installer** (`Qognix-0.1.0-x64.exe`)
- Full installation with Start Menu shortcuts
- Uninstaller included
- Best for distribution to users

**Portable** (`Qognix-0.1.0-x64-portable.exe`)
- No installation needed
- Run from USB/any folder
- Good for testing

---

## 🧪 Testing the Build

### Test the Installer:
```powershell
# Run the installer
.\desktop\frontend\release\Qognix-0.1.0-x64.exe
```

### Test the Portable Version:
```powershell
# Just run it directly
.\desktop\frontend\release\Qognix-0.1.0-x64-portable.exe
```

### Check Backend is Working:
1. Launch the app
2. Check: `C:\Users\<YourName>\.qognix\electron-main.log`
3. Should see: "Backend process spawned with PID"

---

## ⚠️ Common Issues

### Issue 1: "python: command not found"
**Fix**: Install Python and make sure "Add to PATH" was checked

### Issue 2: "npm: command not found"
**Fix**: Install Node.js and restart PowerShell

### Issue 3: "pip: command not found"
**Fix**: Reinstall Python with "Add to PATH" checked

### Issue 4: Build fails with "permission denied"
**Fix**: Run PowerShell as Administrator

### Issue 5: PyInstaller not found
**Fix**: Run `pip install pyinstaller`

---

## 📤 Sharing the Installers

After building, compress and share:

```powershell
# Compress installers
Compress-Archive -Path desktop\frontend\release\*.exe -DestinationPath Qognix-Windows-Installers.zip
```

Then upload `Qognix-Windows-Installers.zip` to:
- Google Drive / Dropbox / OneDrive
- GitHub Releases
- Email (if under 25MB)

---

## 🔧 Advanced: Clean Build

If something goes wrong, clean everything and rebuild:

```powershell
# Clean backend
Remove-Item -Recurse -Force desktop\backend\dist, desktop\backend\build

# Clean frontend
Remove-Item -Recurse -Force desktop\frontend\release, desktop\frontend\dist

# Rebuild
cd desktop\backend
python -m PyInstaller build.spec --clean
Copy-Item dist\db-chat-backend.exe ..\frontend\resources\
cd ..\frontend
npm run electron:build:win
```

---

## 📊 Build Time Expectations

| Step | Time |
|------|------|
| Installing Python packages | ~30 seconds |
| Building backend with PyInstaller | ~20 seconds |
| Installing npm packages (first time) | ~1-2 minutes |
| Building frontend with Electron | ~30-40 seconds |
| **Total (first time)** | **~3-4 minutes** |
| **Total (subsequent builds)** | **~1 minute** |

---

## 📝 File Sizes

| File | Size |
|------|------|
| Backend executable | ~34 MB |
| NSIS Installer | ~110 MB |
| Portable EXE | ~110 MB |
| Compressed ZIP | ~100 MB |

---

## ✅ Verification Checklist

Before sharing the installers:

- [ ] Both EXE files are in `release/` folder
- [ ] Files are around 110 MB each
- [ ] Test installer on a clean Windows machine
- [ ] App launches without errors
- [ ] Backend connects (check logs at `%USERPROFILE%\.qognix\electron-main.log`)
- [ ] Can connect to a database
- [ ] Can send a query and get response

---

## 🆘 Need Help?

If you encounter issues:

1. **Check the log file**: `%USERPROFILE%\.qognix\electron-main.log`
2. **Share error messages** from PowerShell
3. **Verify prerequisites** are installed correctly

---

**Last Updated**: December 4, 2024
**Windows Version Tested**: Windows 10/11 (64-bit)
**Build Status**: ✅ Ready to build
