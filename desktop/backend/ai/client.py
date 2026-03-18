"""
AI Client
Unified interface for different AI providers
"""
from typing import Dict, Any, List
from ai.providers import AIProvider
from ai.base import Message, ChatRequest, ChatResponse
from ai.openai_provider import OpenAIProvider
from ai.claude_provider import ClaudeProvider
from ai.gemini_provider import GeminiProvider
from ai.bedrock_provider import BedrockProvider

class AIClient:
    """Unified AI client for SQL generation"""

    def __init__(self, provider: AIProvider, api_key: str = None, bedrock_config: dict = None, auth_mode: str = 'api_key'):
        self.provider = provider
        self.api_key = api_key
        self.auth_mode = auth_mode

        # Initialize provider-specific client
        if provider == AIProvider.CLAUDE:
            if auth_mode == 'access_token':
                self.client = ClaudeProvider(auth_token=api_key)
            else:
                self.client = ClaudeProvider(api_key=api_key)
        elif provider == AIProvider.OPENAI:
            # OpenAI SDK uses Bearer header for both api_key and access_token
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
        # Create prompt with schema and conversation history
        prompt = self._create_prompt(question, schema, database_type, conversation_history)
        
        # Create chat request
        request = ChatRequest(
            messages=[Message(role="user", content=prompt)],
            temperature=0.7,  # Higher temperature for more natural conversation
            max_tokens=2048,
            model=model  # Pass model if provided
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
            'tokens_prompt': response.tokens_prompt,
            'tokens_completion': response.tokens_completion,
            'tokens_total': response.tokens_total,
            'cost_usd': response.cost_usd,
            'latency_ms': response.latency_ms,
            'model': response.model,
            'provider': response.provider
        }
    
    def _add_sql_header(self, sql: str, provider: str, model: str) -> str:
        """Add header comment to SQL query"""
        from datetime import datetime
        
        # Get current date
        current_date = datetime.now().strftime('%Y-%m-%d')
        
        # Format provider name nicely
        provider_name = {
            'openai': 'OpenAI',
            'claude': 'Claude',
            'gemini': 'Gemini'
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
    
    def _create_prompt(self, question: str, schema: str, database_type: str, conversation_history: List[Dict[str, str]] = None) -> str:
        """Create prompt for AI with conversation history"""
        # Determine LIMIT syntax based on database type
        limit_syntax = {
            'sqlserver': 'TOP 100',
            'postgresql': 'LIMIT 100',
            'mysql': 'LIMIT 100'
        }.get(database_type.lower(), 'LIMIT 100')

        # Build conversation context if history exists
        context = ""
        if conversation_history and len(conversation_history) > 0:
            context = "\n\nPrevious conversation:\n"
            for msg in conversation_history:
                role = "User" if msg['role'] == 'user' else "Assistant"
                context += f"{role}: {msg['content']}\n"
            context += "\n"

        return f"""You are a helpful database assistant. Answer questions about databases and SQL.

Current database: {database_type}

Database Schema:
{schema}{context}

NOTE: The schema above includes tables, columns, views, and enums.
Stored procedures are NOT included to save tokens.
If the user asks about stored procedures, politely inform them that you need to fetch that information first.

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

5. When the user asks for DATABASE INSIGHTS or ANALYSIS:
   - This includes questions like:
     * "Give me insights about this database"
     * "Analyze this database"
     * "Database health check"
     * "Show me performance metrics"
     * "What are the issues with this database?"

   IMPORTANT: Follow this TWO-STEP process:

   STEP 1 - FIRST RESPONSE (Analysis Only - NO CODE):
   - Analyze the schema and provide your OBSERVATIONS in plain text
   - List what you found: number of tables, views, key tables, potential issues
   - Explain your findings in a conversational way
   - At the END, ask: "Would you like me to generate a diagnostic SQL script to check these items?"
   - DO NOT include any SQL code in this first response

   STEP 2 - ONLY AFTER USER CONFIRMS (says "yes", "sure", "ok", "generate", "create script", etc.):
   - THEN generate the comprehensive SQL diagnostic script
   - CRITICAL: Wrap ALL SQL code in EXACTLY ONE ```sql``` code block like this:

```sql
-- Your SQL script here
SELECT * FROM table;
```

   - Include all diagnostic queries with comments INSIDE the code block
   - Add NEED HELP section at the end INSIDE the code block
   - The code block format is REQUIRED for the UI to display it correctly

   Example FIRST response (no code):
   "Based on your database schema, here's what I found:

   **Schema Overview:**
   - Found 10 tables and 1 view
   - Key transactional tables: CommunicationSystems, Users, AuditLogs

   **Observations:**
   - The CommunicationSystems table is central, linking divisions, users, and communication types
   - The Users table has comprehensive user management with AD integration
   - The AuditLogs table captures detailed user actions

   **Potential Concerns:**
   - Some columns use nvarchar(-1) which can store large text but may impact performance
   - Consider reviewing index strategy for frequently queried tables

   Would you like me to generate a diagnostic SQL script to analyze performance, indexes, and table statistics?"

   REMEMBER:
   - NO emojis in the output
   - First response = analysis + question (NO SQL)
   - Second response = SQL script (only after user confirms)

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

7. When generating SELECT queries:
   - ALWAYS limit results to 100 rows for performance
   - For SQL Server: Use "SELECT TOP 100"
   - For PostgreSQL/MySQL: Use "LIMIT 100" at the end
   - Put ONLY the SQL query inside the ```sql``` code block
   - Put your explanation OUTSIDE the code block
   - Make the SQL clean and properly formatted
   - DO NOT add comments inside the SQL code block (we'll add them automatically)
   - EXCEPTION: Database insights scripts SHOULD include comments for interpretation guidance

8. Current database uses: {limit_syntax}

Example response format for {database_type}:
Here's a query to get users:

```sql
SELECT TOP 100 * FROM users;
```

This will retrieve up to 100 user records from the database.

User: {question}
"""
    
    
    def _parse_response(self, response: str) -> Dict[str, str]:
        """Parse AI response to extract SQL, procedure requests, and explanation"""
        import re

        sql = ""
        explanation = ""
        procedure_request = None

        # Check for procedure request
        procedure_pattern = r'```procedure-request\s*(.*?)\s*```'
        procedure_matches = re.findall(procedure_pattern, response, re.DOTALL | re.IGNORECASE)

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
            'procedure_request': procedure_request
        }



def get_ai_client(provider: str, api_key: str = None, model: str = None, bedrock_config: dict = None, auth_mode: str = 'api_key'):
    """
    Get AI client for a specific provider

    Args:
        provider: Provider name (claude, openai, gemini, bedrock)
        api_key: API key or access token for the provider (not needed for bedrock)
        model: Optional specific model to use
        bedrock_config: Optional AWS credentials for Bedrock (dict with access_key, secret_key, region)
        auth_mode: Authentication mode - 'api_key' or 'access_token'

    Returns:
        AIClient instance with the specified provider
    """
    provider_lower = provider.lower()

    # Map string provider to AIProvider enum
    provider_map = {
        "claude": AIProvider.CLAUDE,
        "openai": AIProvider.OPENAI,
        "gemini": AIProvider.GEMINI,
        "bedrock": AIProvider.BEDROCK,

    }

    if provider_lower not in provider_map:
        raise ValueError(f"Unsupported provider: {provider}")

    # Create AIClient with provider
    client = AIClient(
        provider=provider_map[provider_lower],
        api_key=api_key,
        bedrock_config=bedrock_config,
        auth_mode=auth_mode
    )

    # Set default model if provided
    if model:
        client.client.default_model = model

    return client
