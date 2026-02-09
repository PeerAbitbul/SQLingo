# SQLingo - Quick Start Guide

## 🚀 הרצת האפליקציה במצב פיתוח

האפליקציה מורכבת מ-2 חלקים בלבד:
1. **Backend** - FastAPI server (פורט 39847)
2. **Frontend** - Electron app

---

## אופציה 1: הרצה אוטומטית (מומלץ)

```bash
# מתיקיית הפרויקט הראשית
./scripts/start-dev.sh
```

הסקריפט יטפל בהכל:
- ✅ יצירת virtual environment (אם לא קיים)
- ✅ התקנת dependencies
- ✅ הרצת Backend
- ✅ הרצת Frontend

---

## אופציה 2: הרצה ידנית

### שלב 1: הרצת Backend

**טרמינל 1:**
```bash
cd desktop/backend

# יצירת virtual environment (פעם ראשונה בלבד)
python3 -m venv venv

# הפעלת virtual environment
source venv/bin/activate

# התקנת dependencies (פעם ראשונה בלבד)
pip install -r requirements.txt

# הרצת הserver
python main.py
```

**צפוי לראות:**
```
[OK] Using fixed port: 39847
[START] Starting backend server on http://127.0.0.1:39847
INFO:     Uvicorn running on http://127.0.0.1:39847
```

---

### שלב 2: הרצת Frontend

**טרמינל 2:**
```bash
cd desktop/frontend

# התקנת dependencies (פעם ראשונה בלבד)
npm install

# הרצת Electron app
npm run electron:dev
```

**צפוי לראות:**
- חלון Electron נפתח עם האפליקציה

---

## 🔧 דרישות מקדימות

### Python
```bash
python3 --version  # צריך להיות 3.8+
```

### Node.js
```bash
node --version     # צריך להיות 16+
npm --version
```

---

## 🛑 עצירת האפליקציה

- לחץ `Ctrl+C` בכל אחד מהטרמינלים
- או סגור את חלון האפליקציה

---

## 📝 הגדרות (אופציונלי)

### Backend (.env)
```bash
# desktop/backend/.env
DEV_MODE=true
DESKTOP_BACKEND_PORT=39847
```

### Frontend (.env)
```bash
# desktop/frontend/.env
VITE_BACKEND_URL=http://127.0.0.1:39847
```

---

## ❓ בעיות נפוצות

### הפורט תפוס
```bash
# מצא את התהליך שתופס את הפורט
lsof -i :39847

# הרוג את התהליך
kill -9 <PID>
```

### Backend לא עולה
```bash
# בדוק שה-venv מופעל
which python  # צריך להראות את הנתיב ל-venv

# התקן מחדש dependencies
pip install -r requirements.txt
```

### Frontend לא עולה
```bash
# נקה cache והתקן מחדש
rm -rf node_modules package-lock.json
npm install
```

---

## 🎯 מה הלאה?

1. **הוסף מפתחות API** - הגדרות → API Keys
2. **חבר מסד נתונים** - לחץ על "Select Connection"
3. **התחל לשאול שאלות!** 🚀

---

## 📚 מסמכים נוספים

- `docs/BUILD_GUIDE.md` - בניית האפליקציה לייצור
- `docs/API_KEY_TROUBLESHOOTING.md` - עזרה עם API keys
- `docs/CONNECTION_GUIDE.md` - חיבור למסדי נתונים
