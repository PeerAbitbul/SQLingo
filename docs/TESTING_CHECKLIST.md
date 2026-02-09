# Qognix Desktop - Testing Checklist

## הוראות שימוש
- סמן ✅ ליד כל פריט שבדקת ועובד
- סמן ❌ ליד פריטים שלא עובדים
- הוסף הערות/bugs מתחת לכל סעיף

---

## 1. AI Providers Integration 🤖

### OpenAI
- [ ] GPT-4o עובד
- [ ] GPT-4o-mini עובד
- [ ] החלפה בין models
- [ ] Token tracking מדויק
- [ ] חישוב עלויות נכון
- [ ] הודעות שגיאה אם API key לא תקין

**הערות:**
```

```

### Claude (Anthropic)
- [ ] Claude 3.5 Sonnet עובד
- [ ] Claude 3 Opus עובד
- [ ] Claude 3 Haiku עובד
- [ ] החלפה בין models
- [ ] Token tracking מדויק
- [ ] חישוב עלויות נכון

**הערות:**
```

```

### Google Gemini
- [ ] Gemini 2.5 Flash עובד
- [ ] Gemini 2.0 Flash עובד
- [ ] Gemini 1.5 Pro עובד
- [ ] החלפה בין models
- [ ] Token tracking מדויק
- [ ] חישוב עלויות נכון

**הערות:**
```

```

---

## 2. Database Connectivity 🗄️

### PostgreSQL
- [ ] חיבור בסיסי עובד
- [ ] Test connection button עובד
- [ ] Schema extraction מלא (Tables, Columns)
- [ ] Primary Keys זוהו
- [ ] Foreign Keys זוהו
- [ ] Indexes זוהו
- [ ] Views זוהו
- [ ] Enums זוהו (PostgreSQL specific)
- [ ] Query execution עובד
- [ ] Credentials שגויים מציגים שגיאה ברורה

**הערות:**
```

```

### MySQL
- [ ] חיבור בסיסי עובד
- [ ] Test connection button עובד
- [ ] Schema extraction מלא
- [ ] Primary Keys זוהו
- [ ] Foreign Keys זוהו
- [ ] Indexes זוהו
- [ ] Query execution עובד
- [ ] SHOW TABLES עובד
- [ ] DESCRIBE table עובד

**הערות:**
```

```

### SQL Server
- [ ] חיבור בסיסי עובד
- [ ] Test connection button עובד
- [ ] Schema extraction מלא
- [ ] Primary Keys זוהו
- [ ] Foreign Keys זוהו
- [ ] Indexes זוהו
- [ ] Query execution עובד

**הערות:**
```

```

---

## 3. Query Execution & Results 📊

### Basic Queries
- [ ] SELECT * FROM table עובד
- [ ] SELECT עם WHERE clause
- [ ] SELECT עם JOIN
- [ ] SELECT עם GROUP BY
- [ ] SELECT עם ORDER BY
- [ ] SELECT עם LIMIT
- [ ] Queries ארוכים (1000+ תווים)
- [ ] Queries עם תווים מיוחדים

**הערות:**
```

```

### Advanced Queries
- [ ] Multiple JOINs
- [ ] Subqueries
- [ ] CTEs (Common Table Expressions)
- [ ] UNION queries
- [ ] Window functions

**הערות:**
```

```

### Results Display
- [ ] טבלה מוצגת נכון
- [ ] Column headers מוצגים
- [ ] Data types מוצגים
- [ ] NULL values מוצגים נכון
- [ ] Scroll עובד עם תוצאות רבות
- [ ] 100 row limit נאכף

**הערות:**
```

```

### Export Functionality
- [ ] Export to CSV עובד
- [ ] Export to JSON עובד
- [ ] קבצים נשמרים במיקום נכון
- [ ] תוכן הקבצים תקין
- [ ] UTF-8 encoding נכון

**הערות:**
```

```

### SQL Syntax Highlighting
- [ ] SQL code מסומן בצבעים
- [ ] Keywords מודגשים
- [ ] Strings מסומנים
- [ ] Comments מסומנים
- [ ] קריא ונעים לעין

**הערות:**
```

```

---

## 4. Query Safety & Validation ⚠️

### Destructive Queries (צריכים להיחסם!)
- [ ] DELETE נחסם
- [ ] DROP TABLE נחסם
- [ ] DROP DATABASE נחסם
- [ ] TRUNCATE נחסם
- [ ] UPDATE נחסם
- [ ] INSERT נחסם
- [ ] ALTER נחסם
- [ ] CREATE נחסם
- [ ] הודעת שגיאה ברורה למשתמש

**הערות:**
```

```

### Read-Only Commands (צריכים לעבור!)
- [ ] SELECT עובד
- [ ] SHOW (MySQL) עובד
- [ ] DESCRIBE (MySQL) עובד
- [ ] EXPLAIN עובד
- [ ] sp_help (SQL Server) עובד

**הערות:**
```

```

---

## 5. Chat Management 💬

### Chat Creation & Deletion
- [ ] יצירת chat חדש
- [ ] מחיקת chat
- [ ] confirmation dialog למחיקה
- [ ] Chat נמחק מה-sidebar
- [ ] Chat נמחק מה-storage

**הערות:**
```

```

### Chat Naming
- [ ] כותרת אוטומטית נוצרת (AI-generated)
- [ ] Rename chat (right-click)
- [ ] Rename chat (inline editing)
- [ ] Enter שומר את השם החדש
- [ ] Escape מבטל עריכה
- [ ] שם השינוי נשמר

**הערות:**
```

```

### Chat Sidebar
- [ ] Sidebar נפתח/נסגר (animation חלק)
- [ ] רשימת chats מוצגת
- [ ] Selected chat מסומן
- [ ] Click על chat עובר אליו
- [ ] Right-click context menu עובד
- [ ] Scroll עובד עם הרבה chats

**הערות:**
```

```

### Chat History & Persistence
- [ ] הודעות נשמרות
- [ ] היסטוריה נטענת אחרי restart
- [ ] כל chat זוכר את ה-connection שלו
- [ ] Messages מוצגים בסדר נכון
- [ ] Timestamps מדויקים

**הערות:**
```

```

---

## 6. Connection Manager 🔌

### Adding Connections
- [ ] פתיחת Connection Manager modal
- [ ] מילוי כל השדות (host, port, database, username, password)
- [ ] Database type selection (PostgreSQL/MySQL/SQL Server)
- [ ] Test Connection עובד
- [ ] הודעת הצלחה/שגיאה
- [ ] Save connection
- [ ] Connection מופיע ברשימה

**הערות:**
```

```

### Editing Connections
- [ ] Edit connection קיים
- [ ] שדות נטענים נכון
- [ ] שינויים נשמרים
- [ ] Test connection עובד בעריכה

**הערות:**
```

```

### Deleting Connections
- [ ] Delete connection עובד
- [ ] Confirmation dialog
- [ ] Connection נמחק
- [ ] Chats שהשתמשו ב-connection מטופלים נכון

**הערות:**
```

```

### Connection Persistence
- [ ] Connections נשמרים אחרי restart
- [ ] Passwords מוצפנים
- [ ] Connections ניתנים לשחזור

**הערות:**
```

```

---

## 7. API Key Manager (BYOK Mode) 🔑

### Adding API Keys
- [ ] פתיחת API Key Manager
- [ ] הוספת OpenAI key
- [ ] הוספת Claude key
- [ ] הוספת Gemini key
- [ ] Visual indicator שה-key נשמר (checkmark/icon)

**הערות:**
```

```

### Validation
- [ ] API key format validation
- [ ] הודעת שגיאה אם key לא תקין
- [ ] Test key button (אם קיים)

**הערות:**
```

```

### Persistence
- [ ] Keys נשמרים אחרי restart
- [ ] Keys מוצפנים (localStorage)
- [ ] Keys לא נשלחים לשרת

**הערות:**
```

```

### Deleting Keys
- [ ] מחיקת key
- [ ] Confirmation dialog
- [ ] Key נמחק מ-storage

**הערות:**
```

```

---

## 8. Settings Panel ⚙️

### Theme
- [ ] Dark theme עובד
- [ ] Light theme עובד
- [ ] החלפה בין themes
- [ ] כל הקומפוננטות מתעדכנות
- [ ] Theme נשמר אחרי restart
- [ ] Smooth transition

**הערות:**
```

```

### Always on Top
- [ ] Toggle Always on Top
- [ ] חלון נשאר מעל אחרים
- [ ] הגדרה נשמרת אחרי restart

**הערות:**
```

```

### API Mode Selection
- [ ] BYOK mode selection
- [ ] Managed API mode selection (UI בלבד)
- [ ] הגדרה נשמרת

**הערות:**
```

```

### Account Management (Managed API - UI only)
- [ ] Sign In button קיים
- [ ] Sign Out button קיים
- [ ] Account info display (email, plan, usage)

**הערות:**
```

```

---

## 9. UI/UX Features 🎨

### Window Controls
- [ ] Minimize עובד
- [ ] Maximize עובד
- [ ] Close עובד
- [ ] Restore down עובד
- [ ] Window resize עובד
- [ ] Double-click titlebar ל-maximize

**הערות:**
```

```

### Custom Titlebar
- [ ] Titlebar מוצג נכון
- [ ] Buttons עובדים
- [ ] Drag window עובד
- [ ] צבעים נכונים (dark/light)

**הערות:**
```

```

### Chat Input
- [ ] Multi-line input עובד
- [ ] Enter שולח הודעה
- [ ] Shift+Enter מוסיף שורה חדשה
- [ ] Character counter (אם קיים)
- [ ] Disabled state בזמן loading
- [ ] Placeholder text

**הערות:**
```

```

### Loading States
- [ ] Spinner/loader בזמן query
- [ ] Disabled buttons בזמן loading
- [ ] Loading message ברור

**הערות:**
```

```

### Responsive Layout
- [ ] Resize window - layout מתאים
- [ ] Minimum window size נאכף
- [ ] Sidebar responsive
- [ ] Results table responsive

**הערות:**
```

```

### Scroll Behavior
- [ ] Chat scroll עובד
- [ ] Auto-scroll להודעה חדשה
- [ ] Results table scroll
- [ ] Sidebar scroll

**הערות:**
```

```

---

## 10. Error Handling ⚠️

### Connection Errors
- [ ] Wrong credentials - הודעת שגיאה ברורה
- [ ] Server not reachable - הודעה מתאימה
- [ ] Timeout - הודעה מתאימה
- [ ] SSL/TLS errors מטופלים

**הערות:**
```

```

### Query Errors
- [ ] SQL syntax error - הודעה ברורה
- [ ] Table doesn't exist
- [ ] Column doesn't exist
- [ ] Permission denied
- [ ] Query timeout

**הערות:**
```

```

### AI Provider Errors
- [ ] Invalid API key
- [ ] Rate limit exceeded
- [ ] API down/unavailable
- [ ] Token limit exceeded
- [ ] Network errors

**הערות:**
```

```

### Backend Errors
- [ ] Backend לא רץ - הודעה ברורה
- [ ] Backend crashed - recovery
- [ ] Port already in use
- [ ] Python errors מטופלים

**הערות:**
```

```

### UI Errors
- [ ] React errors לא קורסים את האפליקציה (צריך Error Boundary!)
- [ ] Invalid state מטופל
- [ ] Missing data מטופל

**הערות:**
```

```

---

## 11. Performance ⚡

### Database Performance
- [ ] Large database (100+ tables) - schema extraction מהיר
- [ ] Complex queries - execution time סביר
- [ ] Large result sets (100 rows) - display מהיר
- [ ] Multiple connections - לא איטי

**הערות:**
```

```

### Chat Performance
- [ ] Long chat (100+ messages) - scroll חלק
- [ ] Multiple chats (50+) - sidebar מהיר
- [ ] Message rendering מהיר

**הערות:**
```

```

### App Performance
- [ ] Startup time (cold start)
- [ ] Startup time (warm start)
- [ ] Memory usage סביר
- [ ] CPU usage סביר
- [ ] No memory leaks

**הערות:**
```

```

---

## 12. Build & Packaging 📦

### Development Build
- [ ] `npm run electron:dev` עובד
- [ ] Hot reload עובד
- [ ] Backend auto-reload עובד
- [ ] No console errors

**הערות:**
```

```

### Production Build - macOS
- [ ] `npm run electron:build:mac` עובד ללא שגיאות
- [ ] DMG file נוצר
- [ ] DMG נפתח
- [ ] App מתקין נכון
- [ ] App רץ אחרי התקנה
- [ ] Python backend מתארז נכון
- [ ] Icons מוצגים נכון
- [ ] Both architectures (x64 + arm64) עובדים

**הערות:**
```

```

### Production Build - Windows (אם אפשרי לבדוק)
- [ ] `npm run electron:build:win` עובד
- [ ] NSIS installer נוצר
- [ ] Portable version נוצר
- [ ] Installer עובד
- [ ] App רץ ב-Windows

**הערות:**
```

```

### Production Build - Linux (אם אפשרי לבדוק)
- [ ] `npm run electron:build:linux` עובד
- [ ] AppImage נוצר
- [ ] DEB package נוצר
- [ ] App רץ ב-Linux

**הערות:**
```

```

---

## 13. Security 🔐

### Local Storage
- [ ] API keys מוצפנים
- [ ] Database credentials מוצפנים
- [ ] Sensitive data לא ב-plain text

**הערות:**
```

```

### Network Security
- [ ] Backend רק על localhost
- [ ] No external requests (BYOK mode)
- [ ] HTTPS for future Managed API

**הערות:**
```

```

### Query Security
- [ ] SQL injection prevention
- [ ] Destructive queries חסומים
- [ ] File system access חסום

**הערות:**
```

```

---

## 14. Edge Cases 🔬

### Unusual Scenarios
- [ ] Empty database (no tables)
- [ ] Database עם שמות מוזרים (unicode, spaces, special chars)
- [ ] Very long table/column names
- [ ] NULL values בכל מקום
- [ ] Empty strings vs NULL
- [ ] Binary data בtable

**הערות:**
```

```

### Stress Testing
- [ ] 1000+ messages בchat אחד
- [ ] 100+ chats
- [ ] 10+ connections
- [ ] Query עם 1M characters
- [ ] Run app למספר שעות

**הערות:**
```

```

---

## 15. User Experience Polish ✨

### First Time User Experience
- [ ] אין errors בהפעלה ראשונה
- [ ] ברור מה לעשות קודם (add connection? add API key?)
- [ ] Onboarding/welcome message (אם קיים)

**הערות:**
```

```

### Keyboard Shortcuts
- [ ] Enter בchat input
- [ ] Shift+Enter בchat input
- [ ] Escape לסגירת modals
- [ ] Cmd/Ctrl+W לclose (אם מוגדר)

**הערות:**
```

```

### Visual Polish
- [ ] Icons מוצגים נכון
- [ ] Colors consistent
- [ ] Spacing consistent
- [ ] No visual glitches
- [ ] Animations smooth

**הערות:**
```

```

---

## סיכום Bugs שנמצאו 🐛

רשום כאן את כל הבעיות שמצאת:

### Critical (חייב לתקן!)
1.
2.
3.

### High Priority
1.
2.
3.

### Medium Priority
1.
2.
3.

### Low Priority / Nice to Have
1.
2.
3.

---

## הערות נוספות 📝

```


```

---

**תאריך סיום בדיקות:** ___/___/___
**אחוז השלמה:** ____%
**מוכן לrelease?** [ ] כן [ ] לא
