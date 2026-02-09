# התקנת pyodbc ל-SQL Server

## הבעיה
Python 3.13 עדיין לא נתמך במלואו ב-pyodbc.

## פתרונות

### אופציה 1: התקנה ידנית (מומלץ)

בטרמינל Backend:

```bash
# הפעל את ה-venv
source venv/bin/activate

# נסה להתקין
pip install pyodbc
```

אם זה נכשל, נסה:
```bash
pip install --upgrade pip setuptools wheel
pip install pyodbc
```

---

### אופציה 2: Python 3.12

אם pyodbc לא מתקין, השתמש ב-Python 3.12:

```bash
# התקן Python 3.12 מ-python.org
# https://www.python.org/downloads/

# מחק venv ישן
rm -rf venv

# צור venv חדש עם Python 3.12
python3.12 -m venv venv
source venv/bin/activate

# התקן הכל
pip install -r requirements.txt
pip install pyodbc
```

---

### אופציה 3: עבוד בלי SQL Server (זמני)

אם אתה לא צריך SQL Server **עכשיו**:
- PostgreSQL עובד ✅
- MySQL עובד ✅
- SQL Server לא יעבוד ⚠️

התקן pyodbc מאוחר יותר כשצריך.

---

## בדיקה

אחרי התקנה, הרץ:
```bash
python -c "import pyodbc; print('pyodbc works!')"
```

אם רואה "pyodbc works!" - זה עובד! ✅

---

## עזרה נוספת

אם עדיין לא עובד, תגיד לי ואני אעזור!

