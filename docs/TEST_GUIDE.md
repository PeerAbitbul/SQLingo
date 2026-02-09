# 🧪 מדריך בדיקה - DB Chat

## למה לבדוק לפני Build?

אתה צודק! חייבים לבדוק שהכל עובד **בפרויקט עצמו** לפני שבונים installer.

---

## ✅ בדיקה מהירה - שלב אחר שלב

### שלב 1: הכנה (פעם אחת)

```bash
# Backend
cd desktop/backend
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# או: venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

---

### שלב 2: הרצה והבדיקה

#### טרמינל 1 - Backend:
```bash
cd desktop/backend
source venv/bin/activate
python main.py
```

**✅ בדוק שרואה:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

#### טרמינל 2 - Frontend:
```bash
cd desktop/frontend
npm run tauri:dev
```

**✅ בדוק שרואה:**
- חלון האפליקציה נפתח
- אין שגיאות ב-console

---

### שלב 3: בדיקות פונקציונליות

#### 1. בדיקת Backend (דפדפן)
פתח: http://localhost:8000

**צריך לראות:**
```json
{
  "message": "DB Chat Local Backend",
  "version": "0.1.0",
  "status": "running"
}
```

#### 2. בדיקת Health
פתח: http://localhost:8000/health

**צריך לראות:**
```json
{
  "status": "healthy"
}
```

---

### שלב 4: בדיקה באפליקציה

#### ✅ Checklist:

**UI Basics:**
- [ ] חלון נפתח
- [ ] אפשר לגרור את החלון
- [ ] אפשר לשנות גודל
- [ ] כפתורים עובדים (minimize, maximize, close)

**Settings (⚙️):**
- [ ] פאנל Settings נפתח
- [ ] אפשר להחליף theme (dark/light)
- [ ] אפשר לשנות הגדרות
- [ ] שינויים נשמרים

**Connections (🔌):**
- [ ] פאנל Connections נפתח
- [ ] אפשר להוסיף connection
- [ ] אפשר למחוק connection
- [ ] אפשר לבחור connection

**API Keys (🔑):**
- [ ] פאנל API Keys נפתח
- [ ] אפשר להוסיף מפתחות
- [ ] מפתחות נשמרים
- [ ] אינדיקטורים עובדים (✓/○)

**Chat:**
- [ ] אפשר ליצור chat חדש (+ New)
- [ ] אפשר להקליד הודעה
- [ ] כפתור Send עובד

---

### שלב 5: בדיקה עם Database אמיתי (אופציונלי)

אם יש לך מסד נתונים זמין:

1. **הוסף Connection:**
   - לחץ 🔌
   - הוסף connection string
   - לחץ Test
   - צריך לראות "Connection successful! ✅"

2. **הוסף API Key:**
   - לחץ 🔑
   - הוסף מפתח (Claude/OpenAI/Gemini)
   - Save

3. **נסה שאילתה:**
   - צור chat חדש
   - שאל: "show me all tables"
   - צריך לקבל SQL

---

## 🐛 בדיקת שגיאות נפוצות

### Backend לא עולה

**בדיקה:**
```bash
cd desktop/backend
source venv/bin/activate
python main.py
```

**שגיאות אפשריות:**

1. **"ModuleNotFoundError"**
   ```bash
   pip install -r requirements.txt
   ```

2. **"Port 8000 already in use"**
   ```bash
   lsof -ti:8000 | xargs kill -9
   ```

3. **"pysqlcipher3 not found"**
   ```bash
   # macOS:
   brew install sqlcipher
   pip install pysqlcipher3
   
   # Linux:
   sudo apt-get install libsqlcipher-dev
   pip install pysqlcipher3
   ```

---

### Frontend לא עולה

**בדיקה:**
```bash
cd desktop/frontend
npm run tauri:dev
```

**שגיאות אפשריות:**

1. **"Rust not found"**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **"node_modules not found"**
   ```bash
   npm install
   ```

3. **"Port 1420 already in use"**
   - סגור חלונות אחרים של האפליקציה

---

### שגיאות באפליקציה

**בדוק Console (F12 / Cmd+Option+I):**

1. **"Failed to fetch"**
   - Backend לא רץ
   - הרץ את Backend בטרמינל נפרד

2. **"Connection refused"**
   - Backend לא הגיב
   - בדוק http://localhost:8000/health

3. **TypeScript errors**
   - זה בסדר בפיתוח
   - לא משפיע על פונקציונליות

---

## 📝 Checklist מלא לפני Build

### Backend:
- [ ] Backend עולה ללא שגיאות
- [ ] Health endpoint עובד
- [ ] SQLCipher עובד (db_chat.db נוצר)
- [ ] אין שגיאות ב-console

### Frontend:
- [ ] חלון נפתח
- [ ] כל הפאנלים נפתחים
- [ ] אין שגיאות קריטיות ב-console
- [ ] UI נראה תקין

### Integration:
- [ ] Frontend מתחבר ל-Backend
- [ ] API calls עובדים
- [ ] נתונים נשמרים
- [ ] Theme switching עובד

### Optional (עם DB):
- [ ] Connection test עובד
- [ ] Schema extraction עובד
- [ ] SQL generation עובד
- [ ] Query execution עובד

---

## 🎯 מתי מוכן ל-Build?

**כשכל אלה עובדים:**
1. ✅ Backend עולה
2. ✅ Frontend עולה
3. ✅ אין שגיאות קריטיות
4. ✅ UI עובד
5. ✅ נתונים נשמרים

**אז אפשר לבנות:**
```bash
./build-all.sh
```

---

## 💡 טיפים

### בדיקה מהירה:
```bash
# Terminal 1
cd desktop/backend && source venv/bin/activate && python main.py

# Terminal 2
cd desktop/frontend && npm run tauri:dev
```

### איפוש שגיאות:
- Backend: בדוק טרמינל
- Frontend: בדוק Console (F12)
- Network: בדוק Network tab (F12)

### נתונים נשמרים ב:
- SQLCipher: `desktop/backend/db_chat.db` (מוצפן)
- LocalStorage: דפדפן של Tauri
- Settings: `~/.config/db-chat/` או `AppData\Roaming\db-chat\`

---

## 🚀 תהליך מומלץ

```
1. הרץ Backend → בדוק שעובד
2. הרץ Frontend → בדוק שעובד
3. בדוק UI → כל הפאנלים
4. בדוק Integration → Backend ↔ Frontend
5. תקן שגיאות → אם יש
6. חזור על 1-5 → עד שהכל תקין
7. Build → רק אחרי שהכל עובד!
```

---

## ❓ שאלות נפוצות

**ש: צריך .env file?**
ת: לא! רק אם רוצה לבדוק עם API keys hardcoded. בדרך כלל לא צריך.

**ש: איך יודע שזה עובד?**
ת: אם האפליקציה נפתחת ואין שגיאות אדומות ב-console.

**ש: מה אם יש שגיאות?**
ת: תעתיק את השגיאה ואני אעזור לתקן!

**ש: צריך database אמיתי?**
ת: לא! אפשר לבדוק את כל ה-UI בלי DB. רק אם רוצה לבדוק SQL generation.

---

**מוכן? הרץ את שני הטרמינלים ונבדוק שהכל עובד! 🚀**

