# Schema Extraction Upgrade

## הבעיה
הסכמה שנמשכה הייתה בסיסית מדי - רק טבלאות ועמודות, בלי:
- Primary Keys
- Foreign Keys  
- Indexes
- Constraints (CHECK, UNIQUE)
- Views
- Enums
- Default values

## הפתרון
שילבתי את קבצי הסכמה המקצועיים מהפרויקט השני שלך!

## מה השתנה

### 1. הוספתי תיקיית schemas/
```
desktop/backend/database/schemas/
├── __init__.py
├── postgres.py    # שאילתות מקיפות ל-PostgreSQL
├── mysql.py       # שאילתות מקיפות ל-MySQL
└── mssql.py       # שאילתות מקיפות ל-MSSQL
```

### 2. עדכנתי את SchemaExtractor
**לפני:**
```python
def get_schema(self):
    # רק טבלאות ועמודות
    tables = self.db.get_tables()
    for table in tables:
        columns = self.db.get_columns(table)
```

**אחרי:**
```python
def get_full_schema_text(self):
    # סכמה מלאה עם כל הפרטים!
    if self.db_type == 'postgresql':
        query = POSTGRES_SCHEMA_QUERIES['full_schema']
    elif self.db_type == 'mysql':
        query = MYSQL_SCHEMA_QUERIES['full_schema']
    elif self.db_type == 'mssql':
        query = MSSQL_SCHEMA_QUERIES['full_schema']
    
    result = self.db.execute_query(query)
    return result[0]['FullSchemaText']
```

### 3. עדכנתי את AI Client
```python
# עכשיו מקבל טקסט סכמה מלא במקום list
def generate_sql(self, question: str, schema: str, database_type: str):
    prompt = self._create_prompt(question, schema, database_type)
```

## מה ה-AI מקבל עכשיו

### לפני:
```
Table: users
  - id: int NOT NULL
  - name: varchar(255) NULL
```

### אחרי:
```
Table: users
  Column: id int NOT NULL
  Column: name varchar(255) NULL
  Column: email varchar(255) NULL
  Column: status enum('active','inactive') NOT NULL
Primary Key: users.id
Foreign Key: orders.user_id -> users.id
Index: users.email (UNIQUE)
Constraint: users.email_check (CHECK: email LIKE '%@%')
```

## היתרונות

1. ✅ **ה-AI מבין יחסים** - יודע איך טבלאות מחוברות
2. ✅ **ה-AI מבין אילוצים** - יודע מה מותר ומה לא
3. ✅ **ה-AI מבין Enums** - יודע אילו ערכים תקינים
4. ✅ **ה-AI מבין Indexes** - יכול לייעץ על ביצועים
5. ✅ **שאילתות מדויקות יותר** - פחות טעויות

## דוגמאות

### דוגמה 1: Foreign Keys
**User:** "show me users with their orders"
**AI (לפני):** `SELECT * FROM users, orders` ❌ (Cartesian product!)
**AI (אחרי):** `SELECT * FROM users JOIN orders ON users.id = orders.user_id` ✅

### דוגמה 2: Enums
**User:** "show active users"
**AI (לפני):** `SELECT * FROM users WHERE status = 'Active'` ❌ (case sensitive!)
**AI (אחרי):** `SELECT * FROM users WHERE status = 'active'` ✅ (יודע את הערכים המדויקים)

### דוגמה 3: Constraints
**User:** "add a user"
**AI (לפני):** `INSERT INTO users (name) VALUES ('John')` ❌ (חסר email)
**AI (אחרי):** `INSERT INTO users (name, email) VALUES ('John', 'john@example.com')` ✅ (יודע שemail חובה)

## תאימות לאחור

אם יש בעיה עם הסכמה המלאה, יש fallback אוטומטי לסכמה הבסיסית:

```python
try:
    schema_text = extractor.get_full_schema_text()
except:
    schema_text = extractor._get_basic_schema()  # Fallback
```

## איך לבדוק

1. התחבר לבסיס נתונים
2. שאל את ה-AI: "what's the relationship between users and orders?"
3. הוא אמור לדעת על ה-Foreign Keys!

---

**Status**: ✅ Complete
**Date**: November 29, 2024

