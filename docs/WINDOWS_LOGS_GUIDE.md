# Windows Logs Guide - Qognix Desktop

מדריך לבדיקת לוגים ב-Windows כדי לאבחן בעיות באפליקציה.

---

## 📍 מיקום קבצי הלוגים

כל הלוגים של Qognix נמצאים בתיקייה נסתרת בתיקיית המשתמש:

```
C:\Users\<USERNAME>\.qognix\
```

### קבצי לוג זמינים:

1. **`electron-main.log`** - לוגים של Electron (חלון האפליקציה, העלאת backend)
2. **`backend_port.json`** - קובץ תצורה עם פרטי ה-backend
3. **לוגי Backend** - מודפסים לקונסול (ראה למטה)

---

## 🔍 איך לצפות בלוגים

### שיטה 1: דרך File Explorer (מומלץ)

1. **פתח את File Explorer** (לחץ `Windows + E`)

2. **נווט לתיקיית הלוגים:**
   - העתק את הנתיב הזה לשורת הכתובת:
     ```
     %USERPROFILE%\.qognix
     ```
   - לחץ Enter

3. **פתח את קובץ הלוג:**
   - לחיצה כפולה על `electron-main.log`
   - בחר Notepad או כל עורך טקסט

### שיטה 2: דרך Command Prompt

1. **פתח CMD** (לחץ `Windows + R`, הקלד `cmd`, לחץ Enter)

2. **צפה בלוג Electron:**
   ```cmd
   type "%USERPROFILE%\.qognix\electron-main.log"
   ```

3. **צפה בתצורת Backend:**
   ```cmd
   type "%USERPROFILE%\.qognix\backend_port.json"
   ```

4. **עקוב אחרי הלוג בזמן אמת** (מעודכן אוטומטית):
   ```cmd
   powershell Get-Content -Path "$env:USERPROFILE\.qognix\electron-main.log" -Wait -Tail 50
   ```

### שיטה 3: דרך PowerShell

1. **פתח PowerShell** (לחץ `Windows + X`, בחר "Windows PowerShell")

2. **צפה בלוג:**
   ```powershell
   Get-Content "$env:USERPROFILE\.qognix\electron-main.log"
   ```

3. **צפה ב-50 השורות האחרונות:**
   ```powershell
   Get-Content "$env:USERPROFILE\.qognix\electron-main.log" -Tail 50
   ```

4. **עקוב בזמן אמת:**
   ```powershell
   Get-Content "$env:USERPROFILE\.qognix\electron-main.log" -Wait -Tail 50
   ```

---

## 🎯 מה לחפש בלוגים

### לוג Electron (electron-main.log)

#### סטטוס תקין:
```
[2024-12-04T21:00:00.000Z] === Electron app started ===
[2024-12-04T21:00:00.100Z] Mode: Production
[2024-12-04T21:00:00.200Z] Platform: win32
[2024-12-04T21:00:00.300Z] === Starting backend server ===
[2024-12-04T21:00:00.400Z] ✓ Found backend at: C:\...\app.asar.unpacked\resources\db-chat-backend.exe
[2024-12-04T21:00:00.500Z] ✓ Set executable permissions
[2024-12-04T21:00:00.600Z] ✓ Backend process spawned with PID: 12345
[2024-12-04T21:00:00.700Z] ✓ Backend process started successfully
[2024-12-04T21:00:01.000Z] [Backend stdout]: INFO:     Started server process
[2024-12-04T21:00:01.100Z] [Backend stdout]: INFO:     Uvicorn running on http://127.0.0.1:8000
```

#### בעיות נפוצות:

**1. Backend לא נמצא:**
```
[ERROR] Backend executable not found in any path!
```
➜ **פתרון:** הקובץ `db-chat-backend.exe` חסר או במיקום שגוי

**2. Backend קורס:**
```
[Backend spawn error]: ENOENT
```
➜ **פתרון:** בדוק הרשאות או אנטי-וירוס חוסם

**3. Port תפוס:**
```
[Backend stderr]: OSError: [Errno 10048] error while attempting to bind
```
➜ **פתרון:** Port 8000 תפוס, Backend אמור למצוא port אחר אוטומטית

---

## 🛠️ כלים מתקדמים

### DebugView (מומלץ למפתחים)

**הורדה:** https://learn.microsoft.com/en-us/sysinternals/downloads/debugview

1. הורד והפעל את DebugView
2. הפעל את Qognix
3. DebugView יציג את כל ה-debug output בזמן אמת

### PowerShell Script לניטור

צור קובץ `watch-logs.ps1`:
```powershell
# Watch Qognix Logs
$logPath = "$env:USERPROFILE\.qognix\electron-main.log"

Write-Host "=== Watching Qognix Logs ===" -ForegroundColor Green
Write-Host "Log file: $logPath`n" -ForegroundColor Yellow

if (Test-Path $logPath) {
    Get-Content $logPath -Wait -Tail 50 | ForEach-Object {
        if ($_ -match "ERROR|error|Error") {
            Write-Host $_ -ForegroundColor Red
        } elseif ($_ -match "WARNING|warning|Warning") {
            Write-Host $_ -ForegroundColor Yellow
        } elseif ($_ -match "✓|SUCCESS|success") {
            Write-Host $_ -ForegroundColor Green
        } else {
            Write-Host $_
        }
    }
} else {
    Write-Host "Log file not found. Is Qognix running?" -ForegroundColor Red
}
```

**הרצה:**
```powershell
.\watch-logs.ps1
```

---

## 📊 איסוף מידע לדיווח באג

אם אתה נתקל בבעיה, אסוף את המידע הבא:

### 1. לוג Electron
```cmd
copy "%USERPROFILE%\.qognix\electron-main.log" "%USERPROFILE%\Desktop\qognix-electron.log"
```

### 2. תצורת Backend
```cmd
copy "%USERPROFILE%\.qognix\backend_port.json" "%USERPROFILE%\Desktop\qognix-config.json"
```

### 3. גרסת Windows
```cmd
winver
```

### 4. תהליכים פעילים
```cmd
tasklist | findstr "Qognix"
tasklist | findstr "db-chat-backend"
```

### 5. Ports פתוחים
```cmd
netstat -ano | findstr "8000"
```

---

## 🧹 ניקוי לוגים

אם הלוג גדול מדי או רוצה להתחיל מחדש:

### מחיקת כל הלוגים:
```cmd
del /Q "%USERPROFILE%\.qognix\*.log"
```

### מחיקת התיקייה כולה (איפוס מלא):
```cmd
rmdir /S /Q "%USERPROFILE%\.qognix"
```

⚠️ **אזהרה:** זה ימחק גם API keys שמורים וחיבורי database!

---

## 🔧 בעיות נפוצות ופתרונות

### האפליקציה לא נפתחת

1. **בדוק אם התהליך רץ:**
   ```cmd
   tasklist | findstr "Qognix"
   ```

2. **הרוג תהליכים תקועים:**
   ```cmd
   taskkill /F /IM Qognix.exe
   taskkill /F /IM db-chat-backend.exe
   ```

3. **בדוק את הלוג:**
   ```cmd
   type "%USERPROFILE%\.qognix\electron-main.log"
   ```

### Backend לא מתחבר

1. **בדוק את התצורה:**
   ```cmd
   type "%USERPROFILE%\.qognix\backend_port.json"
   ```

   אמור להראות:
   ```json
   {"port": 8000}
   ```

2. **בדוק אם Backend רץ:**
   ```cmd
   netstat -ano | findstr "8000"
   ```

3. **בדוק firewall:**
   - פתח Windows Defender Firewall
   - ודא ש-Qognix מותר

---

## 📝 דוגמאות לוג

### הצלחה - אפליקציה עובדת:
```
[2024-12-04T21:00:00.000Z] === Electron app started ===
[2024-12-04T21:00:00.100Z] Mode: Production
[2024-12-04T21:00:00.500Z] ✓ Found backend at: C:\Users\User\AppData\Local\Programs\Qognix\resources\app.asar.unpacked\resources\db-chat-backend.exe
[2024-12-04T21:00:00.600Z] ✓ Backend process spawned with PID: 12345
[2024-12-04T21:00:01.000Z] [Backend stdout]: INFO: Uvicorn running on http://127.0.0.1:8000
```

### כשלון - Backend חסר:
```
[2024-12-04T21:00:00.000Z] === Starting backend server ===
[2024-12-04T21:00:00.100Z] Checking possible backend paths:
[2024-12-04T21:00:00.200Z]   1. ✗ C:\...\app.asar.unpacked\resources\db-chat-backend.exe
[2024-12-04T21:00:00.300Z]   2. ✗ C:\...\app\resources\db-chat-backend.exe
[2024-12-04T21:00:00.400Z]   3. ✗ C:\...\resources\db-chat-backend.exe
[2024-12-04T21:00:00.500Z] ERROR: Backend executable not found in any path!
```

---

## 💡 טיפים

1. **שמור את הלוגים פתוחים** תוך כדי שימוש באפליקציה כדי לראות שגיאות בזמן אמת

2. **השתמש ב-PowerShell** עם צבעים כדי לזהות שגיאות בקלות

3. **בדוק לוגים לפני דיווח באג** - לעיתים הפתרון כבר נמצא שם

4. **גבה את הלוגים** לפני מחיקה או שדרוג

---

## 🆘 צריך עזרה?

אם אתה לא מצליח לפתור את הבעיה:

1. **אסוף את הלוגים** (ראה "איסוף מידע לדיווח באג")
2. **צלם screenshots** של השגיאות
3. **פתח issue** ב-GitHub עם כל המידע

---

**עדכון אחרון:** 4 דצמבר 2024
