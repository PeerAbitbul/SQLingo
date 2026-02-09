# 🚀 Quick Start - DB Chat

## הרצה מהירה (עברית)

### שלב 1: התקנת תלויות Backend

```bash
cd desktop/backend
python3 -m venv venv
source venv/bin/activate  # במקינטוש/לינוקס
# או: venv\Scripts\activate  # בווינדוס
pip install -r requirements.txt
```

### שלב 2: התקנת תלויות Frontend

```bash
cd ../frontend
npm install
```

### שלב 3: הרצת המערכת

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

---

## Quick Run (English)

### Step 1: Install Backend Dependencies

```bash
cd desktop/backend
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# or: venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### Step 2: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Step 3: Run the Application

**Terminal 1 - Backend:**
```bash
cd desktop/backend
source venv/bin/activate
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd desktop/frontend
npm run tauri:dev
```

---

## ✅ What You Should See

### Backend Terminal:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Frontend Terminal:
```
VITE ready in XXX ms
Running BeforeDevCommand
```

### Application Window:
A floating window titled "DB Chat" should appear!

---

## 🎯 First Steps in the App

1. **Click "+ New"** to create a new chat
2. **Add database connection** (in settings - coming soon, or via API)
3. **Type a question** like: "show me all tables"
4. **Enter your AI API key** (Claude/OpenAI/Gemini)
5. **Click Send** and see the magic! ✨

---

## 🆘 Common Issues

### "Port 8000 already in use"
```bash
lsof -ti:8000 | xargs kill -9
```

### "Module not found"
```bash
cd desktop/backend
source venv/bin/activate
pip install -r requirements.txt
```

### "Rust not found"
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

---

## 📚 More Info

- **Full Setup Guide:** [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Documentation:** [README.md](README.md)
- **Product Spec:** [DB_Chat_Product_Spec (1).md](DB_Chat_Product_Spec%20(1).md)

---

**Happy Coding! 🎉**

