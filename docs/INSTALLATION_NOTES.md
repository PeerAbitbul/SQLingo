# 📝 Installation Notes

## מה עובד עכשיו (Development Mode)

### ✅ מותקן ועובד:
- FastAPI + Uvicorn (Backend server)
- SQLAlchemy (Database abstraction)
- PostgreSQL support (psycopg2-binary)
- MySQL support (PyMySQL)
- AI providers (Claude, OpenAI, Gemini)
- Cryptography
- All other dependencies

### ⚠️ לא מותקן (אופציונלי):
- **pyodbc** - SQL Server support
  - דורש Python 3.10-3.12 (לא 3.13)
  - אפשר להתקין אם צריך SQL Server
  
- **pysqlcipher3** - Encrypted database
  - דורש SQLCipher מותקן במערכת
  - בינתיים משתמשים ב-SQLite רגיל (לא מוצפן)

---

## 🎯 מצב נוכחי

### Backend:
```
✅ Server עובד
✅ PostgreSQL תמיכה
✅ MySQL תמיכה
⚠️  SQL Server - לא זמין (צריך pyodbc)
⚠️  Encryption - מושבת (צריך SQLCipher)
```

### Frontend:
```
✅ Tauri מקומפל
✅ React עובד
✅ TypeScript תקין
✅ All components
```

---

## 🔧 איך להתקין את החסרים (אופציונלי)

### SQL Server Support (pyodbc):

**אופציה 1: Python 3.10-3.12**
```bash
# התקן Python 3.12 מ-python.org
# צור venv חדש:
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**אופציה 2: דלג על SQL Server**
- PostgreSQL ו-MySQL עובדים מצוין
- רוב המשתמשים לא צריכים SQL Server

### SQLCipher (Encryption):

**עם Homebrew:**
```bash
brew install sqlcipher
pip install pysqlcipher3
```

**בלי Homebrew:**
- בינתיים עובדים עם SQLite רגיל
- בפרודקשן נתקין SQLCipher
- הנתונים לא מוצפנים (רק לפיתוח!)

---

## ✅ מה לעשות עכשיו?

### להריץ ולבדוק:

**טרמינל 1 - Backend:**
```bash
cd desktop/backend
source venv/bin/activate
python main.py
```

**טרמינל 2 - Frontend:**
```bash
cd desktop/frontend
npm run tauri:dev
```

### בדוק:
- [x] חלון נפתח
- [x] UI עובד
- [x] Settings נפתח (⚙️)
- [x] Connections נפתח (🔌)
- [x] API Keys נפתח (🔑)
- [x] אין שגיאות אדומות

---

## 🚀 לאחר הבדיקה

אם הכל עובד:
1. ✅ המערכת תקינה לפיתוח
2. ✅ אפשר להמשיך לפתח
3. ⏳ לפני production - נתקין SQLCipher
4. ⏳ לפני production - נתקין pyodbc (אם צריך)

---

## 💡 המלצה

**לפיתוח:** המצב הנוכחי מצוין!
- PostgreSQL/MySQL עובדים
- כל ה-UI עובד
- AI integration עובד
- אפשר לפתח ולבדוק

**לפרודקשן:** נצטרך:
- Python 3.10-3.12 (לא 3.13)
- SQLCipher להצפנה
- pyodbc אם רוצים SQL Server

---

**סטטוס:** ✅ מוכן לפיתוח ובדיקות!

