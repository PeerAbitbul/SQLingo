# ⚡ בדיקה מהירה - 2 דקות

## הרץ ובדוק

### 1. Backend (טרמינל 1)
```bash
cd desktop/backend
source venv/bin/activate  # או venv\Scripts\activate ב-Windows
python main.py
```

**✅ צריך לראות:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### 2. Frontend (טרמינל 2)
```bash
cd desktop/frontend
npm run tauri:dev
```

**✅ צריך לראות:**
- חלון נפתח
- אין שגיאות אדומות

---

## בדיקה מהירה

1. **לחץ ⚙️** - Settings נפתח?
2. **לחץ 🔌** - Connections נפתח?
3. **לחץ 🔑** - API Keys נפתח?
4. **לחץ + New** - Chat נוצר?

**אם כל אלה עובדים → הכל תקין! ✅**

---

## אם יש בעיה

### Backend לא עולה?
```bash
pip install -r requirements.txt
```

### Frontend לא עולה?
```bash
npm install
```

### Port תפוס?
```bash
lsof -ti:8000 | xargs kill -9
```

---

**זהו! פשוט ככה. 🎉**

