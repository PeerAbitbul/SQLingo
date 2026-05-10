"""
AI Client
Unified interface for different AI providers
"""
import time
from typing import Dict, Any, List, Tuple, Generator
from ai.providers import AIProvider
from ai.base import Message, ChatRequest, ChatResponse
from ai.openai_provider import OpenAIProvider
from ai.claude_provider import ClaudeProvider
from ai.claude_cli_provider import ClaudeCLIProvider
from ai.gemini_provider import GeminiProvider
from ai.bedrock_provider import BedrockProvider
from ai.ollama_provider import OllamaProvider
from ai.openrouter_provider import OpenRouterProvider

class AIClient:
    """Unified AI client for SQL generation"""

    def __init__(self, provider: AIProvider, api_key: str = None, bedrock_config: dict = None, ollama_base_url: str = None):
        self.provider = provider
        self.api_key = api_key

        # Initialize provider-specific client
        if provider == AIProvider.CLAUDE_CLI:
            self.client = ClaudeCLIProvider()
        elif provider == AIProvider.CLAUDE:
            self.client = ClaudeProvider(api_key=api_key)
        elif provider == AIProvider.OPENAI:
            self.client = OpenAIProvider(api_key=api_key)
        elif provider == AIProvider.GEMINI:
            self.client = GeminiProvider(api_key=api_key)
        elif provider == AIProvider.BEDROCK:
            # Bedrock uses AWS credentials instead of API key
            if bedrock_config:
                self.client = BedrockProvider(
                    access_key=bedrock_config.get('access_key'),
                    secret_key=bedrock_config.get('secret_key'),
                    region=bedrock_config.get('region', 'us-east-1')
                )
            else:
                # Use default AWS credentials (env vars, IAM role, etc.)
                self.client = BedrockProvider()
        elif provider == AIProvider.OLLAMA:
            self.client = OllamaProvider(base_url=ollama_base_url)
        elif provider == AIProvider.OPENROUTER:
            self.client = OpenRouterProvider(api_key=api_key)
        else:
            raise ValueError(f"Unsupported AI provider: {provider}")
    
    def generate_sql(
        self,
        question: str,
        schema: str,  # Now accepts formatted schema text directly
        database_type: str,
        model: str = None,  # Optional: specific model to use
        conversation_history: List[Dict[str, str]] = None  # Optional: chat history for context
    ) -> Dict[str, Any]:
        """
        Chat with AI about database - may or may not generate SQL
        
        Args:
            question: User's question in natural language
            schema: Formatted schema text from SchemaExtractor
            database_type: Type of database (sqlserver, postgresql, mysql)
            model: Optional specific model to use (overrides default)
            conversation_history: Optional list of previous messages for context
            
        Returns:
            Dict with 'sql', 'explanation', 'tokens', 'cost', 'latency' keys
        """
        system, messages = self._build_request_parts(question, schema, database_type, conversation_history)
        request = ChatRequest(
            messages=messages,
            system=system,
            temperature=0.7,
            max_tokens=2048,
            model=model,
        )
        
        # Call provider
        response: ChatResponse = self.client.chat(request)
        
        # Parse response to extract SQL if present
        parsed = self._parse_response(response.content)

        # Add header comment to SQL if present
        if parsed['sql']:
            parsed['sql'] = self._add_sql_header(
                parsed['sql'],
                response.provider,
                response.model
            )

        return {
            'sql': parsed['sql'],  # Extracted SQL with header or empty
            'explanation': parsed['explanation'] or response.content,  # Explanation or full response
            'procedure_request': parsed.get('procedure_request'),  # Procedure request if present
            'agent_request': parsed.get('agent_request'),  # Agent creation request if present
            'tokens_prompt': response.tokens_prompt,
            'tokens_completion': response.tokens_completion,
            'tokens_total': response.tokens_total,

            'latency_ms': response.latency_ms,
            'model': response.model,
            'provider': response.provider
        }
    
    def generate_text(self, prompt: str, model: str = None) -> str:
        """Generate a short free-form text response (no SQL parsing)."""
        request = ChatRequest(
            messages=[Message(role="user", content=prompt)],
            temperature=0.3,
            max_tokens=500,
            model=model
        )
        response: ChatResponse = self.client.chat(request)
        return response.content.strip()

    def generate_sql_stream(
        self,
        question: str,
        schema: str,
        database_type: str,
        model: str = None,
        conversation_history: List[Dict[str, str]] = None,
    ) -> Generator[Tuple[str, Any], None, None]:
        """Generator that yields ('token', text) then ('done', result_dict)."""
        system, messages = self._build_request_parts(question, schema, database_type, conversation_history)
        request = ChatRequest(
            messages=messages,
            system=system,
            temperature=0.7,
            max_tokens=2048,
            model=model,
        )
        full_content = ""
        start_time = time.time()
        for token in self.client.stream_chat(request):
            full_content += token
            yield ("token", token)

        parsed = self._parse_response(full_content)
        if parsed["sql"]:
            parsed["sql"] = self._add_sql_header(
                parsed["sql"], self.client.provider_name, model or self.client.default_model
            )
        yield ("done", {
            **parsed,
            "latency_ms": int((time.time() - start_time) * 1000),
            "model": model or self.client.default_model,
            "provider": self.client.provider_name,
            "tokens_prompt": 0,
            "tokens_completion": 0,
            "tokens_total": 0,
        })

    def _build_system_prompt(self, schema: str, database_type: str) -> str:
        """Return the stable system prompt (instructions + schema, no history/question)."""
        full = self._create_prompt("__PLACEHOLDER__", schema, database_type, conversation_history=None)
        suffix = "\nUser: __PLACEHOLDER__\n"
        return full[:-len(suffix)] if full.endswith(suffix) else full

    def _build_request_parts(
        self,
        question: str,
        schema: str,
        database_type: str,
        conversation_history: List[Dict[str, str]] = None,
    ) -> Tuple[str, List[Message]]:
        """Returns (system_prompt, messages) — system goes to provider cache, messages are proper multi-turn."""
        history_messages: List[Message] = []

        if conversation_history:
            for msg in conversation_history[-8:]:
                content = msg["content"]
                role = msg["role"]
                if "<?xml" in content and ("ShowPlanXML" in content or "showplan" in content.lower()):
                    xml_start = content.find("<?xml")
                    user_question = content[:xml_start].strip()
                    xml_size_kb = (len(content) - xml_start) // 1024
                    xml_sample = content[xml_start:xml_start + 600]
                    content = (
                        f"{user_question}\n[Execution plan XML — {xml_size_kb} KB attached]\n{xml_sample}…"
                        if user_question
                        else f"[Execution plan XML — {xml_size_kb} KB attached]\n{xml_sample}…"
                    )
                elif role == "assistant" and len(content) > 1500:
                    content = content[:1500] + "… [truncated]"
                history_messages.append(Message(role=role, content=content))

        system = self._build_system_prompt(schema, database_type)
        return system, history_messages + [Message(role="user", content=question)]

    def _add_sql_header(self, sql: str, provider: str, model: str) -> str:
        """Add header comment to SQL query"""
        from datetime import datetime
        
        # Get current date
        current_date = datetime.now().strftime('%Y-%m-%d')
        
        # Format provider name nicely
        provider_name = {
            'openai': 'OpenAI',
            'claude': 'Claude',
            'gemini': 'Gemini',
            'bedrock': 'Bedrock',
            'ollama': 'Ollama (Local)'
        }.get(provider.lower(), provider)
        
        # Create header
        header = f"""-- Created by AI ({provider_name}) in SQLingo
-- Model: {model}
-- Generated on: {current_date}

"""
        
        return header + sql
    
    def _format_schema(self, schema: List[Dict[str, Any]]) -> str:
        """Format schema for AI prompt"""
        lines = []
        
        for table in schema:
            lines.append(f"\nTable: {table['table_name']}")
            for col in table['columns']:
                nullable = "NULL" if col['nullable'] else "NOT NULL"
                lines.append(f"  - {col['name']}: {col['type']} {nullable}")
        
        return "\n".join(lines)
    
    def _extract_first_table(self, schema: str) -> str:
        """Extract the first table name from schema text for use in examples"""
        import re
        # Schema lines look like "Table: tablename" or "tablename (table)"
        match = re.search(r'(?:^|\n)\s*(?:Table:\s*|•\s*)([A-Za-z_][A-Za-z0-9_]*)', schema)
        if match:
            return match.group(1)
        # Fallback: grab any identifier-looking word that isn't a column type
        words = re.findall(r'\b([A-Za-z_][A-Za-z0-9_]{2,})\b', schema)
        for w in words:
            if w.lower() not in ('null', 'not', 'int', 'text', 'varchar', 'char', 'date', 'bool', 'float', 'double', 'bigint', 'columns', 'column', 'table', 'view', 'index', 'primary', 'foreign', 'key'):
                return w
        return 'your_table'

    def _create_prompt(self, question: str, schema: str, database_type: str, conversation_history: List[Dict[str, str]] = None) -> str:
        """Create prompt for AI with conversation history"""
        context = ""
        has_execution_plan_in_history = False
        execution_plan_count = 0

        if conversation_history and len(conversation_history) > 0:
            context = "\n\nPrevious conversation:\n"
            for msg in conversation_history[-8:]:  # last 4 pairs
                role = "User" if msg['role'] == 'user' else "Assistant"
                content = msg['content']

                # Detect execution plan XML in message
                if '<?xml' in content and ('ShowPlanXML' in content or 'showplan' in content.lower()):
                    has_execution_plan_in_history = True
                    execution_plan_count += 1
                    xml_start = content.find('<?xml')
                    user_question = content[:xml_start].strip()
                    xml_size_kb = (len(content) - xml_start) // 1024
                    # Include a sample so the AI recognises the plan
                    xml_sample = content[xml_start:xml_start + 600]
                    plan_label = f"Plan {execution_plan_count}" if execution_plan_count > 1 else "Execution plan"
                    if user_question:
                        content = f"{user_question}\n[{plan_label} XML — {xml_size_kb} KB attached]\n{xml_sample}…"
                    else:
                        content = f"[{plan_label} XML — {xml_size_kb} KB attached]\n{xml_sample}…"
                elif role == "Assistant" and len(content) > 1500:
                    content = content[:1500] + "… [truncated]"

                context += f"{role}: {content}\n"
            context += "\n"

        from datetime import datetime
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Use real table name from schema in examples so the AI can't hallucinate a fake table
        example_table = self._extract_first_table(schema)
        schema_is_empty = (
            not schema or
            schema.strip() in ('', 'Schema unavailable', 'No schema found') or
            'Table:' not in schema
        )

        execution_plan_rule = ""
        if has_execution_plan_in_history:
            plan_count_note = f"({execution_plan_count} plan{'s' if execution_plan_count > 1 else ''} detected in conversation)"
            execution_plan_rule = f"""
RULE 2 — EXECUTION PLAN FOLLOW-UP (active — {plan_count_note}):
The conversation above contains {execution_plan_count} SQL Server execution plan{'s' if execution_plan_count > 1 else ''}.
Any follow-up question from the user refers to those plans.

A) SINGLE PLAN follow-up (e.g. "what should I fix?", "explain more", "can you fix it?"):
- Continue the analysis: give specific, actionable recommendations
- Reference actual operators, tables, and costs from the plan
- Do NOT generate unrelated SQL

B) PLAN COMPARISON (user shares a second plan, or asks "compare", "which is faster", "before/after"):
- Identify Plan A (first shared) and Plan B (second shared)
- Compare side by side:
    * Total cost: Plan A vs Plan B — state the % difference
    * Operation count: which plan has fewer operations
    * Key differences: new indexes used, join strategy changes, scan→seek upgrades
    * Missing indexes: were they resolved in Plan B?
    * Warnings: did they disappear?
- Give a clear verdict: which plan is better and why
- If the improvement came from a specific change (e.g. an index), name it explicitly
- Format as a structured comparison, not a wall of text

- Do NOT ask "which query?" — you have both plans in context
- Do NOT switch topics unless the user explicitly starts a new question about the database
"""

        # DB-specific syntax helpers (computed once, used in the prompt below)
        is_mssql = database_type.lower() in ['sqlserver', 'mssql']
        if is_mssql:
            db_row_limit_example  = f"SELECT TOP 100 * FROM {example_table};"
            db_limit_rule         = "Use TOP N: SELECT TOP 100 * FROM table_name. NEVER use LIMIT — SQL Server does not support it."
            db_date_now           = "GETDATE() or SYSDATETIME()"
            db_explain            = "SET STATISTICS IO, TIME ON;  (run before the query to see I/O and CPU cost)"
            db_pagination         = "ORDER BY col OFFSET 0 ROWS FETCH NEXT 100 ROWS ONLY"
            db_string_concat      = "'+' operator or CONCAT()"
            db_isnull             = "ISNULL(col, default) or COALESCE(col, default)"
            db_lob_rule           = """SQL Server LOB types rule: NEVER write image(N), text(N), or ntext(N) — these types do NOT accept a size parameter and will cause an error.
  Use instead: varbinary(max) instead of image, varchar(max) instead of text, nvarchar(max) instead of ntext."""
        else:
            db_row_limit_example  = f"SELECT * FROM {example_table} LIMIT 100;"
            db_limit_rule         = f"Use LIMIT N: SELECT * FROM table_name LIMIT 100. NEVER use TOP — {database_type} does not support it."
            db_date_now           = "NOW() or CURRENT_TIMESTAMP"
            db_explain            = "EXPLAIN ANALYZE SELECT ...  (shows actual execution stats)"
            db_pagination         = "LIMIT 100 OFFSET 0"
            db_lob_rule           = ""
            db_string_concat      = "CONCAT() or || operator"
            db_isnull             = "COALESCE(col, default) or IFNULL(col, default)"

        return f"""You are an intelligent database assistant for a {database_type} database.
You help with SQL queries, database analysis, execution plans, agent automation, and general conversation.

##### LANGUAGE RULE (highest priority of all) #####
Detect the language of the user's message and respond in that same language.
If the user writes in Hebrew — respond in Hebrew. If in Spanish — respond in Spanish. Etc.
SQL code blocks must always remain in English (SQL is a universal language).
Only the explanations and conversational text should be in the user's language.
#################################################

##### TOP PRIORITY RULES — READ FIRST #####

RULE 0 — CONVERSATIONAL MESSAGES (highest priority):
If the user is greeting you, chatting, or asking a non-database question
(e.g. "hello", "hey", "how are you", "thanks", "what can you do"),
respond in plain conversational text. Do NOT generate SQL. Do NOT generate JSON.

RULE 1 — DATABASE QUESTIONS:
If the user asks for data, rows, records, or results — respond with SQL immediately.
If the user asks to CREATE / ALTER / DROP / INSERT / UPDATE / DELETE — respond with SQL immediately.
If the user asks to CREATE a stored procedure, function, trigger, or any T-SQL/PL-SQL code block — write it immediately. Do NOT say you lack permissions or access. You are writing code for the user to run, not running it yourself.
This includes complex procedures that use system procedures like sp_send_dbmail, sp_addlinkedserver, xp_cmdshell, OPENQUERY, etc. — write the full working code.
NEVER respond with a procedure-request or agent-request for DDL/DML operations. Just write the SQL.
Examples:
  "give me all {example_table}"              → {db_row_limit_example}
  "create a table called orders"             → CREATE TABLE orders (...);
  "create a procedure that sends an email"   → CREATE PROCEDURE ... AS BEGIN EXEC sp_send_dbmail ... END;
  "add a column to {example_table}"          → ALTER TABLE {example_table} ADD COLUMN ...;
  "delete old rows"                          → DELETE FROM ... WHERE ...;
{execution_plan_rule}
##########################################

Current Server Date and Time: {current_time}
Database engine: {database_type}

=== CURRENT DATABASE SCHEMA (AUTHORITATIVE — use ONLY these tables and columns) ===
{schema}
=== END OF SCHEMA ===
{"⚠️ WARNING: The schema above contains NO tables. Do NOT invent or guess any table names. If the user asks for data, explain that the database appears to be empty or the schema could not be loaded, and suggest running SHOW TABLES (MySQL) or SELECT table_name FROM information_schema.tables." if schema_is_empty else ""}
{context}
CRITICAL RULE: You MUST answer based ONLY on the tables and columns listed in the CURRENT DATABASE SCHEMA above.
If previous messages in the conversation mention different tables, ignore them — the schema above is the only truth.
Do NOT invent, assume, or reuse table names from conversation history that are not in the schema.

NOTE: The schema above includes tables, columns, views, and enums.
Stored procedures are NOT included to save tokens.
If the user asks about stored procedures, politely inform them that you need to fetch that information first.

RULE — SCHEMA DISPLAY REQUESTS:
If the user asks to see the schema, available tables, columns, or database structure
(e.g. "show me the schema", "what tables exist", "list the tables", "what columns does X have"),
respond by listing the information directly from the CURRENT DATABASE SCHEMA above.
You ALWAYS have access to this schema — never say you cannot see or access it.

IMPORTANT FORMATTING RULES:
1. When the user asks for data or wants to query the database, generate SQL wrapped in markdown code blocks:
```sql
SELECT * FROM table_name;
```

2. Keep your explanation SEPARATE from the SQL code block.

3. For greetings or general questions (like "hello", "how are you"), respond conversationally WITHOUT SQL.

4. When the user asks about STORED PROCEDURES or FUNCTIONS:
   a) If asking for a LIST of all procedures:
      - Inform them: "I'll fetch the stored procedures information for you."
      - Then respond with EXACTLY this format:

```procedure-request
{{
  "action": "fetch_procedures_list"
}}
```

   b) If asking for DETAILS about a SPECIFIC procedure (e.g., "show me the GetUserById procedure"):
      - Inform them: "I'll fetch the definition of the [procedure_name] procedure."
      - Then respond with EXACTLY this format:

```procedure-request
{{
  "action": "fetch_procedure_definition",
  "procedure_name": "exact_procedure_name"
}}
```

5. CRITICAL RULE — DATA REQUESTS vs. ANALYSIS REQUESTS:

   If the user asks for DATA (rows, records, results) — even in casual language — ALWAYS generate SQL immediately. Do NOT ask questions.
   Examples that must generate SQL right away (use actual table names from the schema above):
     * "give me all {example_table}" → {db_row_limit_example}
     * "show me {example_table}" → {db_row_limit_example}
     * "list all {example_table}" → {db_row_limit_example}
     * "how many rows in X" → SELECT COUNT(*) FROM X
   These are DATA requests. Always respond with a SQL query. Never ask for confirmation.

   The TWO-STEP analysis flow is ONLY for explicit meta-level requests about the DATABASE ITSELF:
     * "give me insights about this database"
     * "analyze this database"
     * "database health check"
     * "show me performance metrics"
     * "what are the issues with this database"
     * "what do you see in this database"

   For those ONLY, follow this TWO-STEP process:

   STEP 1 - FIRST RESPONSE (Analysis Only - NO CODE):
   - Analyze the schema and provide your OBSERVATIONS in plain text
   - List: number of tables, views, key tables, potential issues
   - At the END, ask: "Would you like me to generate a diagnostic SQL script?"
   - DO NOT include any SQL code in this first response

   STEP 2 - ONLY AFTER USER CONFIRMS ("yes", "sure", "ok", "generate", etc.):
   - Generate the diagnostic SQL script in ONE ```sql``` block

   REMEMBER: When in doubt — generate SQL. The user came here for data, not conversation.

6. When the user asks about DATABASE PROPERTIES or DATABASE INFO:
   - This includes questions like:
     * "What is the database name?"
     * "What's the database size?"
     * "When was the database created?"
     * "Who owns this database?"
     * "Show me database properties"
     * "Tell me about this database"
   - Generate a SQL query to get this information
   - Use the appropriate syntax for the current database type
   - Example for SQL Server:

```sql
SELECT
    DB_NAME() AS DatabaseName,
    SUSER_SNAME(owner_sid) AS DatabaseOwner,
    create_date AS CreatedDate,
    collation_name AS Collation
FROM sys.databases
WHERE name = DB_NAME();
```

7. **CRITICAL SYSTEM DIRECTIVE: AGENT BUILDER**
   - WHEN THE USER ASKS TO SCHEDULE A JOB, SET AN ALERT, AUTOMATE AN ACTION, OR CREATE A BACKGROUND AGENT, YOU ARE FORBIDDEN FROM ENGAGING IN CONVERSATION.
   - YOU MUST OUTPUT **ONLY** A SINGLE MARKDOWN JSON BLOCK AS SHOWN BELOW, AND ABSOLUTELY **NOTHING ELSE**.
   - If you output anything other than this exact block, the system will crash.

```agent-request
{{
  "action": "create_agent",
  "name": "Meaningful name for the job",
  "agent_type": "monitor",
  "schedule_type": "cron",
  "schedule": "0 8 * * *",
  "query_logic": "SELECT ...",
  "destination": "local"
}}
```

**FIELD: agent_type** — choose the right type based on what the user asked:

- `"monitor"` — Read-only. Runs a SELECT and reports results to the inbox. Use for: alerts, reports, scheduled checks.
  - `"query_logic"`: a single SELECT query.
  - Example: *"Notify me every morning if there are new errors"*

- `"action"` — Runs a write query (INSERT, UPDATE, DELETE, EXEC, CALL). Use for: scheduled cleanup, archiving, maintenance tasks.
  - `"query_logic"`: a single INSERT/UPDATE/DELETE/EXEC statement.
  - Example: *"Every Sunday, delete orders older than 2 years"*

- `"conditional"` — Checks a condition first, then runs an action only if triggered. Use for: "if X then do Y" automations.
  - `"query_logic"`: a JSON array with exactly 2 elements: `["<condition SELECT>", "<action SQL>"]`
  - The condition query is run first. If it returns ANY rows, the action SQL is executed.
  - Example: *"If there are unpaid invoices older than 30 days, mark them as overdue"*
  - conditional query_logic example: `"[\\"SELECT id FROM invoices WHERE due_date < GETDATE()-30 AND status = 'pending'\\", \\"UPDATE invoices SET status = 'overdue' WHERE due_date < GETDATE()-30 AND status = 'pending'\\"]"`

**FIELD: schedule_type / schedule:**
   - "cron" for repeating jobs. 5-part cron: `"0 8 * * *"` = every day 8am. 6-part with seconds: `"*/30 * * * * *"` = every 30 sec.
   - "date" for one-time: absolute timestamp `"YYYY-MM-DD HH:MM:SS"` calculated from current server time.

**EXAMPLES:**
- Every day at 8am, report errors: `monitor`, `"0 8 * * *"`, SELECT query
- Every Sunday midnight, archive logs: `action`, `"0 0 * * 0"`, DELETE/INSERT query
- Every hour, escalate stale tickets if any: `conditional`, `"0 * * * *"`, JSON array of [check SELECT, update action]

8. **CRITICAL SYSTEM DIRECTIVE: IMMEDIATE ANALYSIS LOOP**
   - WHEN THE USER EXPLICITLY ASKS YOU TO *ANALYZE*, *EVALUATE*, or *CHECK* SOMETHING **RIGHT NOW** and give them your conclusions directly (e.g. "Check fragmentation right now and tell me what you think", "Can you scan the system for performance issues?").
   - YOU MUST OUTPUT **ONLY** A SINGLE MARKDOWN JSON BLOCK, EXACTLY AS SHOWN BELOW, AND ABSOLUTELY **NOTHING ELSE**.
   - This will instruct the system to silently run the query and feed you the results for you to analyze.

```analysis-request
{{
  "action": "analyze_now",
  "query_logic": "SELECT ... FROM ... /* write the scan query here */"
}}
```

9. SYNTAX RULES FOR {database_type.upper()} (CURRENT DATABASE — MANDATORY):
   - Row limiting: {db_limit_rule}
   - Pagination: {db_pagination}
   - Current date/time: {db_date_now}
   - String concatenation: {db_string_concat}
   - Null fallback: {db_isnull}
{f"   - {db_lob_rule}" if db_lob_rule else ""}   - Put ONLY the SQL query inside the ```sql``` code block
   - Put your explanation OUTSIDE the code block
   - Make the SQL clean and properly formatted
   - DO NOT add comments inside the SQL code block (we'll add them automatically)
   - EXCEPTION: Database insights scripts SHOULD include comments for interpretation guidance

10. WHEN THE USER SAYS A QUERY IS SLOW OR ASKS HOW TO OPTIMIZE:
   - First suggest running: {db_explain}
   - Then explain what to look for (sequential scans, missing indexes, high cost nodes)
   - If the user shares the output, analyze it and give specific fixes
   - Do NOT just say "add an index" — explain which column and why

11. WHEN THE USER ASKS "WHAT TABLES DO I HAVE?" OR "WHAT'S IN MY DATABASE?":
   - Answer directly from the CURRENT DATABASE SCHEMA provided above — do NOT generate a SQL query for this
   - List the tables and a one-line description of what each likely contains (based on column names)
   - If the schema is empty, say so and suggest reconnecting or checking permissions

12. SELECT * WARNING:
   - When generating SELECT * on a table that has many columns or the user didn't specify a limit, always add the appropriate row limit ({db_row_limit_example})
   - If the user explicitly asks for all rows (e.g. "give me everything"), still add the limit and mention they can remove it

Example response format for {database_type} (follow this exact syntax):
Here's a query to get {example_table}:

```sql
{db_row_limit_example}
```

This will retrieve up to 100 records from the {example_table} table.

User: {question}
"""
    
    
    def _parse_response(self, response: str) -> Dict[str, str]:
        """Parse AI response to extract SQL, procedure requests, and explanation"""
        import re

        sql = ""
        explanation = ""
        procedure_request = None
        agent_request = None
        analysis_request = None

        # Check for analysis request
        analysis_pattern = r'```analysis-request\s*(.*?)\s*```'
        analysis_matches = re.findall(analysis_pattern, response, re.DOTALL | re.IGNORECASE)

        if analysis_matches:
            import json
            try:
                analysis_request = json.loads(analysis_matches[0].strip())
            except:
                pass
            explanation = re.sub(analysis_pattern, '', response, flags=re.DOTALL | re.IGNORECASE).strip()
            
            return {
                'sql': '',
                'explanation': explanation or "Analyzing...",
                'procedure_request': None,
                'agent_request': None,
                'analysis_request': analysis_request
            }

        # Check for agent request
        agent_pattern = r'```agent-request\s*(.*?)\s*```'
        agent_matches = re.findall(agent_pattern, response, re.DOTALL | re.IGNORECASE)

        if agent_matches:
            import json
            try:
                agent_request = json.loads(agent_matches[0].strip())
            except:
                pass
            explanation = re.sub(agent_pattern, '', response, flags=re.DOTALL | re.IGNORECASE).strip()
            
            return {
                'sql': '',
                'explanation': explanation or "Creating agent...",
                'procedure_request': None,
                'agent_request': agent_request
            }

        # Check for procedure request (also catch plain ``` blocks with action JSON from small models)
        procedure_pattern = r'```procedure-request\s*(.*?)\s*```'
        procedure_matches = re.findall(procedure_pattern, response, re.DOTALL | re.IGNORECASE)

        # Fallback: detect plain JSON code blocks that contain a procedure action
        if not procedure_matches:
            import json as _json
            plain_block_pattern = r'```(?:json)?\s*(\{[^`]*?"action"\s*:\s*"fetch_procedure[^`]*?\})\s*```'
            plain_matches = re.findall(plain_block_pattern, response, re.DOTALL | re.IGNORECASE)
            if plain_matches:
                procedure_matches = plain_matches

        if procedure_matches:
            # Found procedure request - extract it
            import json
            try:
                procedure_request = json.loads(procedure_matches[0].strip())
            except:
                pass

            # Remove the procedure block from response
            explanation = re.sub(procedure_pattern, '', response, flags=re.DOTALL | re.IGNORECASE).strip()
            explanation = explanation.strip()

            return {
                'sql': '',
                'explanation': explanation or "Fetching stored procedures...",
                'procedure_request': procedure_request
            }

        # Try to extract SQL from markdown code blocks
        # Simple pattern: ```sql ... ``` (case insensitive)
        sql_pattern = r'```sql\s*(.*?)\s*```'
        sql_matches = re.findall(sql_pattern, response, re.DOTALL | re.IGNORECASE)

        # If no matches, try without "sql" label (just ``` ... ```)
        if not sql_matches:
            # Check if there's a code block that looks like SQL
            generic_pattern = r'```\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH|DECLARE|--.*?SELECT).*?```'
            if re.search(generic_pattern, response, re.DOTALL | re.IGNORECASE):
                # Extract content from generic code blocks
                generic_sql_pattern = r'```\s*(.*?)\s*```'
                sql_matches = re.findall(generic_sql_pattern, response, re.DOTALL)

        if sql_matches:
            # Found SQL in code block(s) - JOIN ALL matches into one script
            sql = '\n\n'.join(match.strip() for match in sql_matches)

            # Remove ALL SQL blocks from response to get explanation
            explanation = re.sub(sql_pattern, '', response, flags=re.DOTALL | re.IGNORECASE).strip()

            # Clean up explanation
            explanation = re.sub(r'\*\*.*?\*\*', '', explanation)  # Remove markdown bold
            explanation = re.sub(r'\n\s*\n\s*\n+', '\n\n', explanation)  # Remove extra newlines
            explanation = explanation.strip()
        else:
            # No SQL block found - DON'T try to extract SQL from plain text
            # This avoids incorrectly parsing explanation text that mentions SQL keywords
            # The AI should always use ```sql``` blocks for actual SQL code
            explanation = response.strip()

        return {
            'sql': sql,
            'explanation': explanation or "Response generated successfully",
            'procedure_request': procedure_request,
            'agent_request': None
        }



def get_ai_client(provider: str, api_key: str = None, model: str = None, bedrock_config: dict = None, ollama_base_url: str = None):
    provider_lower = provider.lower()
    provider_map = {
        "claude": AIProvider.CLAUDE,
        "openai": AIProvider.OPENAI,
        "gemini": AIProvider.GEMINI,
        "bedrock": AIProvider.BEDROCK,
        "ollama": AIProvider.OLLAMA,
        "openrouter": AIProvider.OPENROUTER,
    }
    if provider_lower not in provider_map:
        raise ValueError(f"Unsupported provider: {provider}")
    client = AIClient(
        provider=provider_map[provider_lower],
        api_key=api_key,
        bedrock_config=bedrock_config,
        ollama_base_url=ollama_base_url,
    )
    if model:
        client.client.default_model = model
    return client
