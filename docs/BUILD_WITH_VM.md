# Building Windows EXE on macOS with Virtual Machine

## Option 1: Using Parallels Desktop (Easiest)

### 1. Install Parallels Desktop
- Download: https://www.parallels.com/
- Cost: $99/year or one-time purchase
- Best performance on Apple Silicon and Intel Macs

### 2. Install Windows 11
```bash
# Parallels can download and install Windows automatically
# Just click "Install Windows" in Parallels Desktop
```

### 3. Share the Project Folder
- In Parallels: Settings → Options → Shared Folders
- Enable "Share Mac folders with Windows"
- Your Mac folders will appear in `\\Mac\Home\`

### 4. Build in Windows VM
```powershell
# Open PowerShell in Windows
cd \\Mac\Home\Documents\Work\Project\React\Qognix...

# Run the build script
desktop\build-windows.bat

# Files will be in: desktop\frontend\release\
# Copy them to Mac or access directly from \\Mac\
```

---

## Option 2: Using UTM (Free, Open Source)

### 1. Install UTM
```bash
brew install --cask utm
# Or download from: https://mac.getutm.app/
```

### 2. Download Windows 11 ARM ISO
- For Apple Silicon: https://uupdump.net/
- For Intel Mac: https://www.microsoft.com/software-download/windows11

### 3. Create Windows VM
1. Open UTM
2. Click "Create a New Virtual Machine"
3. Select "Virtualize" (Apple Silicon) or "Emulate" (Intel)
4. Choose Windows
5. Allocate: 4GB RAM, 64GB disk
6. Install Windows from ISO

### 4. Share Files
**Option A: Shared Folder**
- UTM → Settings → Sharing → Enable SPICE WebDAV
- Map network drive in Windows: `\\10.0.2.2\webdav`

**Option B: Zip and Transfer**
```bash
# On Mac: Create ZIP
cd "Qognix - Floating AI assistant for databases"
zip -r qognix-source.zip .

# Copy to VM's shared folder or use file transfer
# Unzip in Windows and build
```

---

## Option 3: Using VirtualBox (Free, Cross-Platform)

### 1. Install VirtualBox
```bash
brew install --cask virtualbox
```

### 2. Download Windows 10/11 ISO
- https://www.microsoft.com/software-download/windows10
- Or Windows 11: https://www.microsoft.com/software-download/windows11

### 3. Create VM
```bash
# Settings:
- Memory: 4096 MB
- Disk: 60 GB (dynamic)
- Processors: 2 cores
```

### 4. Install Guest Additions
```bash
# In Windows VM menu: Devices → Insert Guest Additions CD
# Run VBoxWindowsAdditions.exe
# Restart VM
```

### 5. Share Folder
```bash
# VirtualBox: Settings → Shared Folders
# Add folder: /Users/[you]/Documents/Work/Project/React/
# Auto-mount: Yes
# Access in Windows: \\VBOXSVR\[folder-name]
```

---

## Comparison

| Feature | Parallels | UTM | VirtualBox |
|---------|-----------|-----|------------|
| **Cost** | $99/year | Free | Free |
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Apple Silicon** | ✅ Native | ✅ Native | ❌ Intel only |
| **Shared Folders** | Excellent | Good | Good |
| **Ease of Use** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Windows License** | Not included | Not included | Not included |

---

## Build Process in VM

Once Windows is running:

### 1. Install Prerequisites (one-time)
```powershell
# Install Python 3.11+
# Download: https://www.python.org/downloads/
# ✅ Check "Add Python to PATH"

# Install Node.js 18+
# Download: https://nodejs.org/

# Verify installations
python --version
node --version
```

### 2. Navigate to Project
```powershell
# If using shared folder:
cd \\Mac\Home\Documents\Work\Project\React\Qognix...

# Or if copied to Windows:
cd C:\Users\YourName\Qognix...
```

### 3. Build
```powershell
# Double-click or run:
desktop\build-windows.bat

# Wait ~3 minutes

# Output:
desktop\frontend\release\Qognix-0.1.0-x64.exe
desktop\frontend\release\Qognix-0.1.0-x64-portable.exe
```

### 4. Copy to Mac
```powershell
# If using shared folder, files are already accessible on Mac
# Otherwise, copy to shared folder or use file transfer
```

---

## Tips

### Faster Builds
- Allocate more RAM to VM (8GB recommended)
- Use SSD for VM disk
- Close unnecessary apps on host Mac

### Windows License
- Windows 10/11 can run without activation
- Some features will be limited but building works fine
- Or purchase a license key

### Keep VM Small
```powershell
# After first build, you can:
1. Create snapshot of working VM
2. Delete old builds: desktop\frontend\release\
3. Only keep the VM for future builds
```

---

## Recommended: GitHub Actions Instead

**Honestly, VM is overkill for occasional builds.**

Use GitHub Actions instead:
1. Free for public repos
2. No VM setup needed
3. Builds all platforms automatically
4. See: `.github/workflows/build.yml`

```bash
git tag v0.1.0 && git push origin v0.1.0
# Wait 5 minutes
# Download from GitHub Actions artifacts
```

---

**Choose the option that fits your needs:**
- **Need it now?** → Find someone with Windows
- **Regular builds?** → GitHub Actions (recommended)
- **Want local control?** → Parallels (best performance)
- **Budget tight?** → UTM or VirtualBox (free)
