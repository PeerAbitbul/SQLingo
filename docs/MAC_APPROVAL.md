# איך לאשר את Qognix במק (macOS)

## הבעיה

כשמנסים לפתוח את Qognix לראשונה, macOS מציג את ההודעה:

> **"Qognix" is damaged and can't be opened. You should move it to the Trash.**

**זה לא אומר שהאפליקציה פגומה!** זו הגנת אבטחה של macOS בשם **Gatekeeper**.

---

## למה זה קורה?

Apple דורשת ש**כל אפליקציה** תהיה **חתומה דיגיטלית** (Code Signing) על ידי מפתח רשום.

- **לחתום אפליקציה** דורש:
  1. חשבון Apple Developer ($99/שנה)
  2. תעודה מיוחדת מApple
  3. Notarization (אישור מApple לאחר סריקת וירוסים)

- **Qognix אינה חתומה** כי:
  - עדיין בפיתוח
  - לא משתלם לשלם $99/שנה בשלב זה
  - אפליקציה חינמית לשימוש עם API משלך

---

## 🔧 הפתרון הקל - פקודה אחת בטרמינל

פתח **Terminal** והעתק את הפקודה הזו (החלף את הנתיב אם שונה):

```bash
xattr -cr /Applications/Qognix.app
```

**זהו!** עכשיו אפשר לפתוח את Qognix בלחיצה רגילה.

---

## 📝 הסבר מפורט - 3 דרכים

### דרך 1: הסרת בדיקת האבטחה (המומלץ ביותר)

1. פתח **Terminal** (Applications → Utilities → Terminal)

2. הקלד את הפקודה הבאה והקש Enter:
   ```bash
   xattr -cr /Applications/Qognix.app
   ```

3. אם האפליקציה לא ב-Applications, החלף את הנתיב:
   ```bash
   xattr -cr ~/Downloads/Qognix.app
   ```

**מה הפקודה עושה?**
- `xattr` = מנהל attributes של קבצים
- `-c` = מחק את כל ה-attributes
- `-r` = רקורסיבי (כולל כל התיקיות)
- זה מסיר את הדגל "downloaded from internet"

---

### דרך 2: דרך ההגדרות (GUI)

1. **לחיצה ימנית** (או Control+Click) על האפליקציה
2. בחר **"Open"** מהתפריט
3. תקפוץ אזהרה: **"Qognix is from an unidentified developer"**
4. לחץ **"Open"** שוב

macOS ישאל פעם אחת, ואז תמיד יאפשר לפתוח.

**חיסרון:** צריך לעשות את זה פעם אחת, והודעה קצת מפחידה.

---

### דרך 3: השבתת Gatekeeper זמנית (לא מומלץ)

```bash
sudo spctl --master-disable
```

זה **משבית לגמרי את Gatekeeper**.

**אחרי שפתחת את Qognix, חזור והפעל:**
```bash
sudo spctl --master-enable
```

**אזהרה:** זה משאיר את המחשב פתוח לאפליקציות מסוכנות. **לא מומלץ.**

---

## ❓ שאלות נפוצות

### האם זה בטוח?

**כן!** אם הורדת מ-GitHub Releases הרשמי או build עצמאי.

הקוד פתוח (Open Source) - כל אחד יכול לבדוק מה הוא עושה.

### למה לא פשוט לחתום את האפליקציה?

- דורש $99/שנה לחשבון Apple Developer
- הליך מורכב של Notarization
- לא שווה בשלב זה כשהאפליקציה בפיתוח
- Qognix חינמית לשימוש עם API משלך

בעתיד, אם נעבור לגרסה מסחרית, נחתום.

### האם צריך לעשות את זה בכל עדכון?

**תלוי באיזו דרך השתמשת:**

- **דרך 1 (xattr)**: כן, אבל זה שנייה אחת בטרמינל
- **דרך 2 (Open מהתפריט)**: כן, פעם אחת לכל גרסה
- אפשר לשמור את הפקודה בקובץ טקסט להעתקה מהירה

### האפליקציה נמחקת אוטומטית

macOS לפעמים **מוחק אוטומטית** אפליקציות לא חתומות.

**פתרון:**
1. לאחר שפתחת בהצלחה, העבר ל-`/Applications`
2. הרץ: `xattr -cr /Applications/Qognix.app`
3. זה יעצור את המחיקה האוטומטית

---

## 🔐 אבטחה - מה Qognix באמת עושה?

- **רץ לוקלית** - שום דבר לא עולה לשרת שלנו
- **הצפנת connection strings** - סיסמאות מאוחסנות מוצפנות מקומית
- **BYOK** - אתה מביא את ה-API key שלך (OpenAI/Claude)
- **קוד פתוח** - [GitHub](https://github.com/your-repo) - תבדוק בעצמך

---

## 🆘 עדיין לא עובד?

### שגיאה: "Operation not permitted"

הרץ עם `sudo`:
```bash
sudo xattr -cr /Applications/Qognix.app
```

### שגיאה: "No such file"

בדוק את הנתיב:
```bash
ls -la /Applications/Qognix.app
```

אם לא קיים, מצא איפה האפליקציה:
```bash
find ~ -name "Qognix.app" 2>/dev/null
```

### שגיאה: "malware detected"

זה לא Malware. אם אתה ממש מודאג:
1. בדוק checksum של הקובץ שהורדת
2. בדוק בVirusTotal
3. בנה בעצמך מהקוד ב-GitHub

---

## סיכום

**הדרך הכי מהירה:**

```bash
# 1. העתק את האפליקציה ל-Applications
# 2. הרץ בטרמינל:
xattr -cr /Applications/Qognix.app

# 3. פתח את Qognix בלחיצה כפולה רגילה
```

**זהו!** 🎉

---

**עדכון אחרון:** 2025-12-08
