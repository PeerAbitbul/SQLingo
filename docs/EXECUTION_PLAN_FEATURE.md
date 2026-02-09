# Execution Plan Analysis Feature - Implementation Plan

**Date Created:** December 2, 2024
**Status:** 🔄 Planning Phase
**Priority:** High

---

## 📋 Overview

תכונה חדשה לניתוח Execution Plans של SQL Server. התכונה תתמוך בשני מצבים:
1. **BYOK Mode** - המשתמש משתמש במפתחות API שלו
2. **Managed Mode** - השרת מספק את מפתחות ה-API (בתשלום)

---

## 🎯 Core Principle: Desktop First, Server Later

### ⚠️ חשוב מאוד!

```
┌────────────────────────────────────────────────────────────┐
│  אסטרטגיית הפיתוח:                                         │
│                                                            │
│  Phase 1: Desktop App (100%)                              │
│           ↓                                                │
│  Phase 2: Server Backend (0%)                             │
│                                                            │
│  ❌ אסור להתחיל Server לפני שDesktop גמור לחלוטין!        │
└────────────────────────────────────────────────────────────┘
```

### למה Desktop קודם?

1. ✅ **BYOK Mode עובד מיד** - משתמשים יכולים להשתמש בתכונה
2. ✅ **בדיקה מהירה** - אפשר לבדוק שהכל עובד
3. ✅ **אין תלות בServer** - לא צריך infrastructure
4. ✅ **Validation** - וידוא שהלוגיקה נכונה לפני שמעתיקים ל-Server

---

## 🏗️ Architecture - Full Picture

### Desktop App (Phase 1 - עכשיו)

```
Desktop (Electron)
├── Frontend (React + TypeScript)
│   ├── ExecutionPlanUploader.tsx       # Drag & Drop
│   ├── ExecutionPlanViewer.tsx         # Display results
│   ├── ExecutionPlanModal.tsx          # Modal wrapper
│   └── executionPlanStore.ts           # State management
│
└── Backend (Python FastAPI)
    ├── execution_plan/                 # ← New module
    │   ├── __init__.py
    │   ├── parser.py                   # XML parsing
    │   ├── analyzer.py                 # Find bottlenecks
    │   ├── insights.py                 # AI analysis
    │   └── models.py                   # Pydantic models
    │
    └── api/routes.py
        └── /execution-plan/analyze     # ← New endpoint
```

### Server Backend (Phase 2 - בעתיד)

```
Server (https://api.qognix.com)
└── Backend (Python FastAPI)
    ├── execution_plan/                 # ← Same module as Desktop
    │   ├── __init__.py                 # (shared code)
    │   ├── parser.py
    │   ├── analyzer.py
    │   ├── insights.py
    │   └── models.py
    │
    └── api/routes.py
        └── /ai/execution-plan/analyze  # ← New endpoint
            ├── Validate JWT token
            ├── Parse & Analyze (same code)
            ├── Call AI (server's API key)
            └── Track usage for billing
```

---

## 🔑 Key Principle: Same Code, Different API Key

### הכלל החשוב ביותר:

```python
# Desktop BYOK Mode
ai_client = AIClient(
    provider=AIProvider(request.ai_provider),
    api_key=request.api_key  # ← מפתח של המשתמש
)
ai_insights = get_ai_insights(ai_client, analysis)
# ↑ אותו פרומפט, אותה לוגיקה

# Server Managed Mode (בעתיד)
ai_client = AIClient(
    provider=AIProvider(request.ai_provider),
    api_key=os.getenv('OPENAI_API_KEY')  # ← מפתח של השרת
)
ai_insights = get_ai_insights(ai_client, analysis)
# ↑ אותו פרומפט, אותה לוגיקה בדיוק!
```

### מה זהה בין Desktop ל-Server?

✅ **XML Parser** - `ExecutionPlanParser` זהה לחלוטין
✅ **Analyzer** - `ExecutionPlanAnalyzer` זהה לחלוטין
✅ **AI Prompts** - אותם prompts בדיוק
✅ **Logic** - כל הלוגיקה זהה
✅ **Models** - Pydantic models זהים

### מה שונה?

| Component | Desktop BYOK | Server Managed |
|-----------|--------------|----------------|
| **API Key Source** | `request.api_key` (מהמשתמש) | `os.getenv('OPENAI_API_KEY')` (מהשרת) |
| **Authentication** | אין | JWT token validation |
| **Billing** | אין | `track_usage()` |
| **Endpoint** | `/execution-plan/analyze` | `/ai/execution-plan/analyze` |
| **Location** | `desktop/backend/` | `server/backend/` |

**הכל אחר זהה לחלוטין!**

---

## 📦 Phase 1: Desktop Implementation (Current)

### 1.1 Backend Module (Python)

#### Files to Create:
```
desktop/backend/execution_plan/
├── __init__.py
├── parser.py           # Parse .sqlplan XML files
├── analyzer.py         # Analyze for bottlenecks
├── insights.py         # Generate AI insights
└── models.py           # Pydantic models
```

#### Key Classes:

**parser.py:**
```python
class ExecutionPlanParser:
    """Parse SQL Server execution plan XML"""

    def parse(self, xml_content: str) -> Dict:
        """
        Parse .sqlplan file
        Returns: {
            "statement": str,
            "operations": List[Operation],
            "costs": CostMetrics,
            "warnings": List[Warning]
        }
        """
```

**analyzer.py:**
```python
class ExecutionPlanAnalyzer:
    """Analyze execution plan for issues"""

    def analyze(self, parsed_plan: Dict) -> Dict:
        """
        Identify bottlenecks and issues
        Returns: {
            "bottlenecks": List[Bottleneck],
            "missing_indexes": List[str],
            "expensive_operations": List[Operation],
            "statistics": Dict
        }
        """
```

**insights.py:**
```python
async def get_ai_insights(
    ai_client: AIClient,
    analysis: Dict
) -> str:
    """
    Get AI insights using any provider
    Same prompt for Desktop & Server!
    """
```

### 1.2 API Endpoint (Desktop)

#### File to Modify:
```python
# desktop/backend/api/routes.py

# Add at the end of file:

# ========================================
# NEW FEATURE: Execution Plan Analysis
# ========================================

@router.post("/execution-plan/analyze", response_model=ExecutionPlanResponse)
async def analyze_execution_plan(request: ExecutionPlanRequest):
    """
    Analyze SQL Server execution plan
    Supports: BYOK mode (Managed mode proxies to server)
    """
    try:
        # 1. Parse XML
        parser = ExecutionPlanParser()
        parsed_plan = parser.parse(request.xml_content)

        # 2. Analyze
        analyzer = ExecutionPlanAnalyzer()
        analysis = analyzer.analyze(parsed_plan)

        # 3. Get AI insights
        if request.mode == 'byok' and request.api_key:
            ai_client = AIClient(
                provider=AIProvider(request.ai_provider),
                api_key=request.api_key
            )
            ai_insights = await get_ai_insights(ai_client, analysis)

        elif request.mode == 'managed' and request.token:
            # Proxy to server (Phase 2)
            server_url = os.getenv('SERVER_URL')
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{server_url}/ai/execution-plan/analyze",
                    json={"xml_content": request.xml_content, ...},
                    headers={"Authorization": f"Bearer {request.token}"}
                )
                return ExecutionPlanResponse(**response.json())

        return ExecutionPlanResponse(
            summary=analysis['statistics'],
            bottlenecks=analysis['bottlenecks'],
            missing_indexes=analysis['missing_indexes'],
            recommendations=generate_recommendations(analysis),
            ai_insights=ai_insights,
            success=True
        )
    except Exception as e:
        return ExecutionPlanResponse(success=False, error=str(e))
```

### 1.3 Frontend Components (React)

#### 🎯 UX Requirements:

**✅ Drag & Drop Only - No Browse Button**
- רק גרירה של קובץ ישירות ל-Chat window
- **אין כפתור Browse/Upload**
- המשתמש צריך לשאול את ה-AI איך להעביר execution plan

**✅ File Type Validation:**
```
Allowed:
  - Drag .sqlplan file → Parse and analyze
  - Paste XML text into chat input → Parse and analyze

Blocked:
  - .txt, .pdf, .docx, .xlsx, etc. → Show error message
  - Other file types → "Only .sqlplan files are supported"
```

**✅ User Flow:**
```
User: "Can I analyze an execution plan here?"
AI: "Yes! You can:
     1. Drag and drop a .sqlplan file directly into the chat
     2. Or paste the XML content into the input box
     I'll analyze it and provide optimization recommendations."

User: [Drags .sqlplan file]
System: ✅ Parsing execution plan...
        ✅ Analyzing bottlenecks...
        ✅ Getting AI insights...
AI: [Shows analysis with bottlenecks, missing indexes, recommendations]
```

#### Files to Create:
```
desktop/frontend/src/
├── components/
│   ├── ExecutionPlanViewer.tsx        # Display analysis results
│   └── ChatWindow.tsx                 # Add drag & drop handler
├── stores/
│   └── executionPlanStore.ts          # State management
└── utils/
    └── executionPlanApi.ts            # API calls
```

#### File to Modify:
```typescript
// desktop/frontend/src/components/ChatWindow.tsx

const handleFileDrop = async (e: React.DragEvent) => {
  e.preventDefault();

  const files = Array.from(e.dataTransfer.files);
  const sqlplanFile = files.find(f => f.name.endsWith('.sqlplan'));

  if (!sqlplanFile) {
    // Check if user dropped unsupported file
    if (files.length > 0) {
      addMessage(chatId, {
        role: 'assistant',
        content: 'Only .sqlplan files are supported. Please drag a SQL Server execution plan file (.sqlplan) or paste the XML content into the input box.'
      });
    }
    return;
  }

  // Read and analyze .sqlplan file
  const xmlContent = await sqlplanFile.text();
  await analyzeExecutionPlan(xmlContent);
};

// Add to ChatArea container:
<ChatArea
  onDrop={handleFileDrop}
  onDragOver={(e) => e.preventDefault()}
>
  {/* existing content */}
</ChatArea>
```

#### Chat Input Enhancement:
```typescript
// desktop/frontend/src/components/ChatInput.tsx

// Detect XML paste in input
const detectExecutionPlanXML = (text: string): boolean => {
  // Check if text looks like execution plan XML
  return text.includes('<?xml') &&
         text.includes('ShowPlanXML') &&
         text.includes('StatementType');
};

const handleSend = async () => {
  if (detectExecutionPlanXML(input)) {
    // User pasted XML - analyze it
    await analyzeExecutionPlan(input);
    setInput('');
    return;
  }

  // Normal chat message
  // ... existing code
};
```

---

## 📦 Phase 2: Server Implementation (Future)

### ⚠️ לא להתחיל לפני ש-Desktop גמור!

### 2.1 Server Module (Python)

```
server/backend/execution_plan/
├── __init__.py          # ← Copy from desktop
├── parser.py            # ← Copy from desktop
├── analyzer.py          # ← Copy from desktop
├── insights.py          # ← Copy from desktop
└── models.py            # ← Copy from desktop
```

### 2.2 Server Endpoint

```python
# server/backend/api/routes.py

@router.post("/ai/execution-plan/analyze")
async def analyze_execution_plan_managed(
    request: ExecutionPlanRequest,
    token: str = Depends(validate_token)  # JWT validation
):
    """
    Managed mode - use server's API keys
    Track usage and bill user
    """
    try:
        # Same parsing & analysis
        parser = ExecutionPlanParser()
        parsed_plan = parser.parse(request.xml_content)

        analyzer = ExecutionPlanAnalyzer()
        analysis = analyzer.analyze(parsed_plan)

        # AI with SERVER's key
        ai_client = AIClient(
            provider=AIProvider(request.ai_provider),
            api_key=os.getenv(f"{request.ai_provider.upper()}_API_KEY")
        )
        ai_insights = await get_ai_insights(ai_client, analysis)

        # Track usage for billing
        await track_usage(
            user_id=token['user_id'],
            feature='execution_plan_analysis',
            tokens_used=estimate_tokens(ai_insights),
            provider=request.ai_provider,
            cost_usd=calculate_cost(...)
        )

        return ExecutionPlanResponse(
            summary=analysis['statistics'],
            bottlenecks=analysis['bottlenecks'],
            missing_indexes=analysis['missing_indexes'],
            recommendations=generate_recommendations(analysis),
            ai_insights=ai_insights,
            success=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 🔐 Modularity & Safety Principles

### 1. Isolated Module
```
✅ כל הקוד החדש ב-execution_plan/ directory
✅ אין שינויים בקבצים קיימים (חוץ מהוספת endpoint)
✅ אם execution_plan נכשל → רק הוא נכשל, לא כל המערכת
```

### 2. Non-Breaking Changes
```
✅ לא משנים /chat/query
✅ לא משנים /query/execute
✅ לא משנים AIClient
✅ רק מוסיפים endpoint חדש + UI חדש
```

### 3. Backwards Compatible
```
✅ אם לא משתמשים בתכונה → אין השפעה
✅ כל התכונות הקיימות ממשיכות לעבוד
✅ ניתן למחוק את execution_plan/ בלי לשבור כלום
```

### 4. Shared Code Strategy
```
Option A: Copy files from Desktop to Server (simple)
Option B: Git submodule (advanced)
Option C: Shared package (complex)

✅ נתחיל ב-Option A - העתקה פשוטה
```

---

## 🧪 Testing Strategy

### Phase 1 Testing (Desktop)

#### Test 1: XML Parsing
```
✅ Upload valid .sqlplan file
✅ Parse successfully
✅ Extract operations, costs, warnings
```

#### Test 2: Analysis
```
✅ Identify bottlenecks (operations > 20% cost)
✅ Find missing indexes
✅ Detect expensive operations
```

#### Test 3: BYOK Mode
```
✅ Use user's API key (Claude/GPT/Gemini)
✅ Generate AI insights
✅ Display results correctly
```

#### Test 4: Isolation
```
✅ Break execution_plan module intentionally
✅ Verify chat still works
✅ Verify query execution still works
✅ Only execution plan feature fails
```

### Phase 2 Testing (Server - Future)

#### Test 5: Managed Mode
```
⏳ Authenticate with JWT token
⏳ Proxy to server endpoint
⏳ Server uses its own API keys
⏳ Track usage correctly
⏳ Bill user properly
```

#### Test 6: Consistency
```
⏳ Same .sqlplan in BYOK and Managed
⏳ Compare results
⏳ Should be identical (except token tracking)
```

---

## 📊 Progress Tracking

### Phase 1: Desktop (Current Focus)

- [ ] **Backend Module**
  - [ ] Create `execution_plan/` directory
  - [ ] Implement `parser.py` (XML parsing)
  - [ ] Implement `analyzer.py` (bottleneck detection)
  - [ ] Implement `insights.py` (AI prompts)
  - [ ] Implement `models.py` (Pydantic)
  - [ ] Unit tests for parser
  - [ ] Unit tests for analyzer

- [ ] **Backend API**
  - [ ] Add `/execution-plan/analyze` endpoint
  - [ ] Implement BYOK mode
  - [ ] Implement Managed mode proxy
  - [ ] Error handling
  - [ ] Integration tests

- [ ] **Frontend Components**
  - [ ] Create `ExecutionPlanUploader.tsx`
  - [ ] Create `ExecutionPlanViewer.tsx`
  - [ ] Create `ExecutionPlanModal.tsx`
  - [ ] Create `executionPlanStore.ts`
  - [ ] Create `executionPlanApi.ts`
  - [ ] Add button to ChatWindow
  - [ ] Drag & Drop functionality
  - [ ] XML paste support
  - [ ] UI/UX polish

- [ ] **Testing & Documentation**
  - [ ] Manual testing with real .sqlplan files
  - [ ] Test with Claude, GPT, Gemini
  - [ ] Test error cases
  - [ ] User documentation
  - [ ] Code documentation

### Phase 2: Server (Future - After Desktop 100%)

- [ ] **Server Module**
  - [ ] Copy/adapt execution_plan module
  - [ ] Test parsing in server environment
  - [ ] Test analysis logic

- [ ] **Server API**
  - [ ] Create `/ai/execution-plan/analyze` endpoint
  - [ ] JWT validation
  - [ ] Usage tracking
  - [ ] Billing integration
  - [ ] Rate limiting

- [ ] **Testing**
  - [ ] Test Managed mode end-to-end
  - [ ] Verify billing accuracy
  - [ ] Load testing
  - [ ] Security audit

---

## 🚀 Implementation Order

### Week 1: Core Parsing & Analysis (Desktop)
1. Setup `execution_plan/` module structure
2. Implement XML parser for .sqlplan files
3. Implement analyzer for bottleneck detection
4. Unit tests

### Week 2: API Integration (Desktop)
1. Add backend endpoint
2. Implement BYOK mode
3. Implement Managed mode proxy (stub)
4. Integration tests

### Week 3: Frontend (Desktop)
1. Build uploader component (Drag & Drop)
2. Build viewer component
3. Build modal wrapper
4. State management
5. API integration

### Week 4: Polish & Testing (Desktop)
1. UI/UX improvements
2. Error handling
3. Edge cases
4. Documentation
5. Final testing

### Week 5+: Server Implementation
**⚠️ רק אחרי ש-Desktop גמור 100%!**

---

## 📝 Important Notes

### 🔴 Critical Rules

1. **אסור להתחיל Server לפני Desktop 100%**
   - Desktop חייב לעבוד מושלם ב-BYOK mode
   - כל הבדיקות חייבות לעבור
   - UI חייב להיות מוכן

2. **הקוד חייב להיות זהה**
   - Parser, Analyzer, Insights זהים לחלוטין
   - Prompts זהים לחלוטין
   - רק המפתחות API שונים

3. **מודולריות מוחלטת**
   - אפס שינויים בקבצים קיימים (חוץ מהוספות)
   - ניתן למחוק execution_plan/ בלי לשבור כלום
   - כל תכונה עובדת בנפרד

4. **תיעוד מלא**
   - כל פונקציה מתועדת
   - דוגמאות לשימוש
   - הסברים על הלוגיקה

### 🟡 Recommendations

1. התחל עם קובץ .sqlplan פשוט לבדיקות
2. בנה את ה-Parser בשלבים (operations → costs → warnings)
3. בדוק כל component בנפרד לפני אינטגרציה
4. השתמש ב-BYOK mode כ-reference implementation
5. תעד כל החלטה ארכיטקטונית

### 🟢 Success Criteria

**Desktop is 100% done when:**
- ✅ Can upload .sqlplan file (drag & drop)
- ✅ Can paste XML directly
- ✅ Parses correctly
- ✅ Identifies bottlenecks
- ✅ Suggests missing indexes
- ✅ Generates AI insights (BYOK mode)
- ✅ Works with Claude, GPT, Gemini
- ✅ UI is polished and intuitive
- ✅ Error handling is robust
- ✅ No bugs in existing features
- ✅ Documentation complete

**Only then → Start Server implementation**

---

## 🔗 Related Documentation

- [README.md](README.md) - Project overview
- [AUTH_IMPLEMENTATION.md](docs/AUTH_IMPLEMENTATION.md) - How BYOK/Managed works
- [AI_ARCHITECTURE_UPGRADE.md](docs/AI_ARCHITECTURE_UPGRADE.md) - AI provider system
- [PROGRESS.md](PROGRESS.md) - Overall project progress

---

## 📅 Timeline

- **Phase 1 (Desktop):** ~4 weeks
- **Testing & Polish:** ~1 week
- **Documentation:** ~3 days
- **Phase 2 (Server):** ~2 weeks (after Desktop done)

**Total estimated time:** ~7-8 weeks for complete implementation

---

## ✅ Checklist Before Starting

Before writing any code, ensure:

- [x] Architecture is clear and documented
- [x] Understand BYOK vs Managed flow
- [x] Know how existing AI system works
- [x] Modularity principles understood
- [x] Testing strategy defined
- [x] Desktop-first approach agreed
- [ ] Ready to write first line of code

---

**Last Updated:** December 2, 2024
**Next Review:** After Desktop Phase 1 completion

---

## 🎯 Summary

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  תכונת Execution Plan Analysis                         │
│                                                         │
│  ✅ מתוכנן היטב                                         │
│  ✅ מודולרי לחלוטין                                     │
│  ✅ לא פוגע בקיים                                       │
│  ✅ תומך ב-BYOK וב-Managed                              │
│  ✅ קוד משותף בין Desktop ל-Server                     │
│  ✅ Desktop קודם, Server אחר כך                        │
│                                                         │
│  🚀 מוכן להתחלה!                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```
