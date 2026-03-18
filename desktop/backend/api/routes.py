"""
API Routes for Desktop Backend

Architecture:
- Free desktop-only application
- AI calls use BYOK (user's own API keys)
- No authentication or usage limits
- All data stored locally
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from database.connection import DatabaseConnection
from database.schema_extractor import SchemaExtractor
from ai.client import AIClient
from ai.providers import AIProvider
from utils.permission_helper import is_permission_error, get_permission_error_response


router = APIRouter()




# Request/Response Models
class ConnectionTestRequest(BaseModel):
    connection_string: str
    database_type: str  # 'sqlserver', 'postgresql', 'mysql'

class ConnectionTestResponse(BaseModel):
    success: bool
    message: str

class SchemaRequest(BaseModel):
    connection_string: str
    database_type: str

class SchemaResponse(BaseModel):
    tables: List[dict]
    success: bool

class ConversationMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class BedrockConfig(BaseModel):
    access_key: str
    secret_key: str
    region: str = 'us-east-1'

class ChatRequest(BaseModel):
    question: str
    connection_string: str
    database_type: str
    ai_provider: str  # 'claude', 'openai', 'gemini', 'bedrock'
    ai_model: Optional[str] = None  # Optional: specific model to use
    api_key: Optional[str] = None  # For BYOK mode (not used for bedrock)
    auth_mode: Optional[str] = 'api_key'  # 'api_key' or 'access_token'
    bedrock_config: Optional[BedrockConfig] = None  # For Bedrock BYOK mode
    conversation_history: Optional[List[ConversationMessage]] = None  # Chat history for context


class ChatResponse(BaseModel):
    sql_query: str
    explanation: str
    success: bool
    error: Optional[str] = None

class QueryExecuteRequest(BaseModel):
    connection_string: str
    database_type: str
    sql_query: str

class GenerateTitleRequest(BaseModel):
    question: str
    ai_provider: str  # 'claude', 'openai', 'gemini', 'bedrock'
    ai_model: Optional[str] = None  # Optional: specific model to use
    api_key: Optional[str] = None  # For BYOK mode (not used for bedrock)
    auth_mode: Optional[str] = 'api_key'  # 'api_key' or 'access_token'
    bedrock_config: Optional[BedrockConfig] = None  # For Bedrock BYOK mode


class GenerateTitleResponse(BaseModel):
    title: str
    success: bool
    error: Optional[str] = None

class QueryExecuteResponse(BaseModel):
    columns: List[str]
    rows: List[List]
    row_count: int
    success: bool
    error: Optional[str] = None

# Routes
@router.post("/connection/test", response_model=ConnectionTestResponse)
async def test_connection(request: ConnectionTestRequest):
    """Test database connection"""
    try:
        db = DatabaseConnection(request.connection_string, request.database_type)
        success = db.test_connection()
        
        if success:
            return ConnectionTestResponse(
                success=True,
                message="Connection successful"
            )
        else:
            return ConnectionTestResponse(
                success=False,
                message="Connection failed"
            )
    except Exception as e:
        return ConnectionTestResponse(
            success=False,
            message=f"Error: {str(e)}"
        )

@router.post("/schema/extract", response_model=SchemaResponse)
async def extract_schema(request: SchemaRequest):
    """Extract database schema"""
    try:
        db = DatabaseConnection(request.connection_string, request.database_type)
        extractor = SchemaExtractor(db)
        schema = extractor.get_schema()

        return SchemaResponse(
            tables=schema,
            success=True
        )
    except Exception as e:
        # Check if this is a permission error
        if is_permission_error(str(e), request.database_type):
            permission_info = get_permission_error_response('schema', request.database_type)
            error_message = f"{permission_info['message']}\n\n{permission_info['grant_script']}"
            raise HTTPException(status_code=403, detail=error_message)

        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/query", response_model=ChatResponse)
async def generate_sql(request: ChatRequest):
    """
    Generate SQL from natural language question

    Flow:
    1. Extract database schema
    2. Call AI with user's API key (BYOK)
    3. Log usage locally
    """
    try:
        # Get full schema with all details
        db = DatabaseConnection(request.connection_string, request.database_type)
        extractor = SchemaExtractor(db)
        schema_text = extractor.get_full_schema_text()

        # BYOK Mode - Use user's API key or credentials directly
        if request.ai_provider == 'bedrock':
            # Bedrock uses AWS credentials instead of API key
            if not request.bedrock_config:
                raise HTTPException(status_code=400, detail="AWS credentials required for Bedrock")

            ai_client = AIClient(
                provider=AIProvider.BEDROCK,
                bedrock_config={
                    'access_key': request.bedrock_config.access_key,
                    'secret_key': request.bedrock_config.secret_key,
                    'region': request.bedrock_config.region
                }
            )
        else:
            # Other providers use API key or access token
            if not request.api_key:
                raise HTTPException(status_code=400, detail="API key or access token required")

            ai_client = AIClient(
                provider=AIProvider(request.ai_provider),
                api_key=request.api_key,
                auth_mode=request.auth_mode or 'api_key'
            )

        # Convert conversation history to dict format
        history = None
        if request.conversation_history:
            history = [{'role': msg.role, 'content': msg.content} for msg in request.conversation_history]

        result = ai_client.generate_sql(
            question=request.question,
            schema=schema_text,
            database_type=request.database_type,
            model=request.ai_model,  # Pass the model if provided
            conversation_history=history  # Pass conversation history
        )
        # Check if AI requested procedure information
        if result.get('procedure_request'):
            action = result['procedure_request'].get('action')

            from database.schemas.postgres import POSTGRES_SCHEMA_QUERIES
            from database.schemas.mysql import MYSQL_SCHEMA_QUERIES
            from database.schemas.mssql import MSSQL_SCHEMA_QUERIES

            db_type = request.database_type.lower()

            if action == 'fetch_procedures_list':
                # Fetch procedures list from database
                try:
                    if db_type == 'postgresql':
                        query = POSTGRES_SCHEMA_QUERIES['procedures_list']
                    elif db_type == 'mysql':
                        query = MYSQL_SCHEMA_QUERIES['procedures_list']
                    elif db_type in ['mssql', 'sqlserver']:
                        query = MSSQL_SCHEMA_QUERIES['procedures_list']
                    else:
                        raise ValueError(f"Unsupported database type: {request.database_type}")

                    procedures_result = db.execute_query(query)

                    # Format procedures as text
                    procedures_text = "\n\nStored Procedures:\n"
                    for row in procedures_result:
                        proc_name = row.get('procedure_name') or row.get('PROCEDURE_NAME') or ''
                        proc_type = row.get('type') or row.get('TYPE') or ''
                        procedures_text += f"  - {proc_name} ({proc_type})\n"

                    # Return explanation with procedures info
                    return ChatResponse(
                        sql_query='',
                        explanation=result['explanation'] + procedures_text,
                        success=True
                    )
                except Exception as proc_error:
                    # Check if this is a permission error
                    if is_permission_error(str(proc_error), request.database_type):
                        permission_info = get_permission_error_response('procedures', request.database_type)
                        error_explanation = f"{permission_info['message']}\n\n{permission_info['grant_script']}"
                        return ChatResponse(
                            sql_query='',
                            explanation=error_explanation,
                            success=True  # Success=True so it doesn't break the chat
                        )
                    # For other errors, re-raise
                    raise

            elif action == 'fetch_procedure_definition':
                # Fetch specific procedure definition
                procedure_name = result['procedure_request'].get('procedure_name')

                if not procedure_name:
                    return ChatResponse(
                        sql_query='',
                        explanation="Error: No procedure name provided.",
                        success=False
                    )

                try:
                    if db_type == 'postgresql':
                        query = POSTGRES_SCHEMA_QUERIES['procedure_definition']
                        proc_result = db.execute_query(query, params=(procedure_name,))
                    elif db_type == 'mysql':
                        query = MYSQL_SCHEMA_QUERIES['procedure_definition']
                        proc_result = db.execute_query(query, params=(procedure_name,))
                    elif db_type in ['mssql', 'sqlserver']:
                        query = MSSQL_SCHEMA_QUERIES['procedure_definition']
                        query = query.replace('@procedure_name', f"'{procedure_name}'")
                        proc_result = db.execute_query(query)
                    else:
                        raise ValueError(f"Unsupported database type: {request.database_type}")
                except Exception as proc_error:
                    # Check if this is a permission error
                    if is_permission_error(str(proc_error), request.database_type):
                        permission_info = get_permission_error_response('procedures', request.database_type)
                        error_explanation = f"{permission_info['message']}\n\n{permission_info['grant_script']}"
                        return ChatResponse(
                            sql_query='',
                            explanation=error_explanation,
                            success=True  # Success=True so it doesn't break the chat
                        )
                    # For other errors, re-raise
                    raise

                if not proc_result or len(proc_result) == 0:
                    # Procedure not found - try to find similar ones
                    if db_type == 'postgresql':
                        list_query = POSTGRES_SCHEMA_QUERIES['procedures_list']
                    elif db_type == 'mysql':
                        list_query = MYSQL_SCHEMA_QUERIES['procedures_list']
                    elif db_type in ['mssql', 'sqlserver']:
                        list_query = MSSQL_SCHEMA_QUERIES['procedures_list']

                    all_procedures = db.execute_query(list_query)

                    # Find similar procedure names (case-insensitive partial match)
                    similar = []
                    search_lower = procedure_name.lower()
                    for proc in all_procedures:
                        proc_name_full = proc.get('procedure_name') or proc.get('PROCEDURE_NAME') or ''
                        if search_lower in proc_name_full.lower() or proc_name_full.lower() in search_lower:
                            similar.append(proc_name_full)

                    if similar:
                        suggestions = '\n'.join([f"  - {name}" for name in similar[:5]])  # Show max 5 suggestions
                        explanation = f"Procedure '{procedure_name}' not found.\n\nDid you mean one of these?\n{suggestions}"
                    else:
                        explanation = f"Procedure '{procedure_name}' not found. Use the procedure list to see all available procedures."

                    return ChatResponse(
                        sql_query='',
                        explanation=explanation,
                        success=True  # Success because we're providing helpful suggestions
                    )

                # Format procedure definition
                row = proc_result[0]
                proc_name = row.get('procedure_name') or row.get('PROCEDURE_NAME') or procedure_name
                proc_type = row.get('type') or row.get('TYPE') or 'PROCEDURE'
                proc_params = row.get('parameters') or row.get('PARAMETERS') or 'No parameters'
                proc_def = row.get('definition') or row.get('DEFINITION') or row.get('routine_definition') or row.get('ROUTINE_DEFINITION') or 'Definition not available'

                procedure_text = f"\n\nProcedure: {proc_name}\n"
                procedure_text += f"Type: {proc_type}\n"
                procedure_text += f"Parameters: {proc_params}\n\n"
                procedure_text += f"Definition:\n```sql\n{proc_def}\n```"

                return ChatResponse(
                    sql_query='',
                    explanation=result['explanation'] + procedure_text,
                    success=True
                )
        return ChatResponse(
            sql_query=result['sql'],
            explanation=result['explanation'],
            success=True
        )

    except HTTPException:
        raise
    except Exception as e:
        return ChatResponse(
            sql_query="",
            explanation="",
            success=False,
            error=str(e)
        )

@router.post("/query/execute", response_model=QueryExecuteResponse)
async def execute_query(request: QueryExecuteRequest):
    """Execute SELECT query (read-only)"""
    try:
        # Remove comments from SQL for validation
        sql_lines = request.sql_query.strip().split('\n')
        sql_without_comments = '\n'.join(
            line for line in sql_lines 
            if not line.strip().startswith('--')
        ).strip()
        
        # Validate query is read-only based on database type
        query_upper = sql_without_comments.upper()
        
        # Different allowed commands per database type
        if request.database_type == 'sqlserver':
            # SQL Server doesn't support SHOW
            allowed_starts = ['SELECT', 'EXEC sp_', 'EXECUTE sp_']
        else:
            # MySQL and PostgreSQL support SHOW, DESCRIBE, etc.
            allowed_starts = ['SELECT', 'SHOW', 'DESCRIBE', 'DESC', 'EXPLAIN']
        
        if not any(query_upper.startswith(cmd) for cmd in allowed_starts):
            raise HTTPException(
                status_code=400,
                detail=f"Only read-only queries are allowed for {request.database_type}"
            )
        
        # Check for dangerous keywords as standalone SQL commands (not in column names)
        if query_upper.startswith('SELECT'):
            dangerous_keywords = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', 'TRUNCATE']
            # Use word boundaries to match only complete keywords, not parts of column names
            import re
            for keyword in dangerous_keywords:
                # Match keyword as a separate word (not part of column name like create_date)
                pattern = r'\b' + keyword + r'\b'
                if re.search(pattern, query_upper):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Query contains forbidden keyword: {keyword}"
                    )
        
        # Execute query
        db = DatabaseConnection(request.connection_string, request.database_type)
        result = db.execute_select(request.sql_query, limit=100)
        
        return QueryExecuteResponse(
            columns=result['columns'],
            rows=result['rows'],
            row_count=len(result['rows']),
            success=True
        )
    except Exception as e:
        return QueryExecuteResponse(
            columns=[],
            rows=[],
            row_count=0,
            success=False,
            error=str(e)
        )

@router.post("/chat/generate-title", response_model=GenerateTitleResponse)
async def generate_chat_title(request: GenerateTitleRequest):
    """Generate a smart title for a chat based on the user's first question"""
    try:
        # BYOK Mode - Use user's API key or credentials directly
        if request.ai_provider == 'bedrock':
            # Bedrock uses AWS credentials instead of API key
            if not request.bedrock_config:
                raise HTTPException(status_code=400, detail="AWS credentials required for Bedrock")

            ai_client = AIClient(
                provider=AIProvider.BEDROCK,
                bedrock_config={
                    'access_key': request.bedrock_config.access_key,
                    'secret_key': request.bedrock_config.secret_key,
                    'region': request.bedrock_config.region
                }
            )
        else:
            # Other providers use API key or access token
            if not request.api_key:
                raise HTTPException(status_code=400, detail="API key or access token required")

            ai_client = AIClient(
                provider=AIProvider(request.ai_provider),
                api_key=request.api_key,
                auth_mode=request.auth_mode or 'api_key'
            )

        # For BYOK mode, generate title using AI
        prompt = f"""Generate a short, descriptive title (3-5 words max) for a database chat based on this question:

Question: "{request.question}"

Rules:
- Maximum 5 words
- No quotes or special characters
- Descriptive and clear
- Professional tone

Return ONLY the title, nothing else."""

        # Use the AI client to generate title
        import httpx
        
        if request.ai_provider == 'openai':
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    'https://api.openai.com/v1/chat/completions',
                    headers={
                        'Authorization': f'Bearer {request.api_key}',
                        'Content-Type': 'application/json'
                    },
                    json={
                        'model': request.ai_model or 'gpt-4o-mini',
                        'messages': [{'role': 'user', 'content': prompt}],
                        'max_tokens': 20,
                        'temperature': 0.7
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    title = result['choices'][0]['message']['content'].strip()
                    return GenerateTitleResponse(title=title, success=True)
                    
        elif request.ai_provider == 'claude':
            async with httpx.AsyncClient() as client:
                # Use Bearer token for access_token mode, x-api-key for api_key mode
                if request.auth_mode == 'access_token':
                    claude_headers = {
                        'Authorization': f'Bearer {request.api_key}',
                        'anthropic-version': '2023-06-01',
                        'Content-Type': 'application/json'
                    }
                else:
                    claude_headers = {
                        'x-api-key': request.api_key,
                        'anthropic-version': '2023-06-01',
                        'Content-Type': 'application/json'
                    }
                response = await client.post(
                    'https://api.anthropic.com/v1/messages',
                    headers=claude_headers,
                    json={
                        'model': request.ai_model or 'claude-3-5-sonnet-latest',
                        'max_tokens': 20,
                        'messages': [{'role': 'user', 'content': prompt}]
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    title = result['content'][0]['text'].strip()
                    return GenerateTitleResponse(title=title, success=True)
                    
        elif request.ai_provider == 'gemini':
            model_name = request.ai_model or 'gemini-2.5-flash'
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f'https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={request.api_key}',
                    headers={'Content-Type': 'application/json'},
                    json={
                        'contents': [{'parts': [{'text': prompt}]}],
                        'generationConfig': {
                            'maxOutputTokens': 20,
                            'temperature': 0.7
                        }
                    },
                    timeout=10.0
                )

                if response.status_code == 200:
                    result = response.json()
                    title = result['candidates'][0]['content']['parts'][0]['text'].strip()
                    return GenerateTitleResponse(title=title, success=True)

        elif request.ai_provider == 'bedrock':
            # Bedrock uses AIClient's chat method for title generation
            try:
                result = ai_client.chat(
                    messages=[{'role': 'user', 'content': prompt}],
                    model=request.ai_model,
                    max_tokens=20
                )
                title = result.strip()
                return GenerateTitleResponse(title=title, success=True)
            except Exception as e:
                # Fallback on error
                print(f"Bedrock title generation failed: {str(e)}")
                words = request.question.split()[:4]
                title = ' '.join(words).capitalize() if words else 'New Chat'
                return GenerateTitleResponse(title=title, success=True)
        
        # Fallback: Extract first few words from question
        words = request.question.split()[:4]
        title = ' '.join(words).capitalize()
        return GenerateTitleResponse(title=title, success=True)
        
    except Exception as e:
        # Fallback to simple title
        words = request.question.split()[:4]
        title = ' '.join(words).capitalize() if words else 'New Chat'
        return GenerateTitleResponse(title=title, success=True)


# ========================================
# NEW FEATURE: Execution Plan Analysis
# ========================================

from execution_plan.parser import ExecutionPlanParser
from execution_plan.analyzer import ExecutionPlanAnalyzer
from execution_plan.insights import get_ai_insights, generate_summary_for_chat
from execution_plan.models import ExecutionPlanRequest, ExecutionPlanResponse


@router.post("/execution-plan/analyze", response_model=ExecutionPlanResponse)
async def analyze_execution_plan(
    request: ExecutionPlanRequest,
    ):
    """
    Analyze SQL Server execution plan (.sqlplan XML)

    Uses BYOK mode with user's API key or AWS credentials.
    
    Free for all users - no restrictions.
    """
    try:
        analysis = analyzer.analyze(parsed_plan)

        # Get AI insights if provider specified
        ai_insights = None

        if request.ai_provider:
            # BYOK Mode - Use user's API key or credentials
            try:
                if request.ai_provider == 'bedrock':
                    # Bedrock uses AWS credentials
                    if not request.bedrock_config:
                        raise ValueError("AWS credentials required for Bedrock")

                    ai_client = AIClient(
                        provider=AIProvider.BEDROCK,
                        bedrock_config={
                            'access_key': request.bedrock_config.access_key,
                            'secret_key': request.bedrock_config.secret_key,
                            'region': request.bedrock_config.region
                        }
                    )
                else:
                    # Other providers use API key or access token
                    if not request.api_key:
                        raise ValueError("API key or access token required")

                    ai_client = AIClient(
                        provider=AIProvider(request.ai_provider),
                        api_key=request.api_key,
                        auth_mode=request.auth_mode or 'api_key'
                    )

                ai_insights = await get_ai_insights(
                    ai_client,
                    analysis,
                    parsed_plan['statement'],
                    model=request.ai_model
                )
            except Exception as e:
                # AI insights failed, but continue with analysis
                print(f"AI insights failed: {str(e)}")
                ai_insights = f"AI analysis unavailable: {str(e)}"


        # Return analysis results
        return ExecutionPlanResponse(
            summary=analysis['summary'],
            operations=analysis['expensive_operations'],
            bottlenecks=analysis['bottlenecks'],
            missing_indexes=analysis['missing_indexes'],
            recommendations=analysis['recommendations'],
            ai_insights=ai_insights,
            success=True
        )

    except ValueError as e:
        # Invalid XML or not an execution plan
        return ExecutionPlanResponse(
            summary=None,
            operations=[],
            bottlenecks=[],
            missing_indexes=[],
            recommendations=[],
            success=False,
            error=f"Invalid execution plan: {str(e)}"
        )
    except Exception as e:
        # Unexpected error
        return ExecutionPlanResponse(
            summary=None,
            operations=[],
            bottlenecks=[],
            missing_indexes=[],
            recommendations=[],
            success=False,
            error=f"Analysis failed: {str(e)}"
        )


# Models endpoint
class ModelsRequest(BaseModel):
    """Request to fetch available models from AI providers"""
    providers: List[str]  # List of providers to fetch models from: ['claude', 'openai', 'gemini']
    api_keys: dict  # Dict mapping provider name to API key for validation


class ProviderModels(BaseModel):
    """Available models for a specific provider"""
    provider: str
    models: List[str]
    default_model: str
    success: bool
    error: Optional[str] = None


class ModelsResponse(BaseModel):
    """Response with available models from all providers"""
    providers: List[ProviderModels]
    success: bool


@router.post("/models/available", response_model=ModelsResponse)
async def get_available_models(request: ModelsRequest):
    """
    Fetch available models from AI provider APIs.

    This endpoint queries each provider's API to get the list of available models.
    Used on app startup to ensure the latest models are always available.
    """
    results = []

    for provider_name in request.providers:
        try:
            api_key = request.api_keys.get(provider_name)
            if not api_key:
                results.append(ProviderModels(
                    provider=provider_name,
                    models=[],
                    default_model="",
                    success=False,
                    error="No API key provided"
                ))
                continue

            # Get models from provider
            if provider_name == "claude":
                from ai.claude_provider import ClaudeProvider
                provider = ClaudeProvider(api_key)
                models = provider.get_available_models()
                default = provider.default_model
            elif provider_name == "openai":
                from ai.openai_provider import OpenAIProvider
                provider = OpenAIProvider(api_key)
                models = provider.get_available_models()
                default = provider.default_model
            elif provider_name == "gemini":
                from ai.gemini_provider import GeminiProvider
                provider = GeminiProvider(api_key)
                models = provider.get_available_models()
                default = provider.default_model
            else:
                results.append(ProviderModels(
                    provider=provider_name,
                    models=[],
                    default_model="",
                    success=False,
                    error=f"Unknown provider: {provider_name}"
                ))
                continue

            results.append(ProviderModels(
                provider=provider_name,
                models=models,
                default_model=default,
                success=True
            ))

        except Exception as e:
            results.append(ProviderModels(
                provider=provider_name,
                models=[],
                default_model="",
                success=False,
                error=str(e)
            ))

    return ModelsResponse(
        providers=results,
        success=True
    )


# ========================================
# NEW FEATURE: Stored Procedures - Dynamic Fetching
# ========================================

class ProceduresListRequest(BaseModel):
    connection_string: str
    database_type: str

class ProcedureInfo(BaseModel):
    procedure_name: str
    type: str  # 'PROCEDURE' or 'FUNCTION'

class ProceduresListResponse(BaseModel):
    procedures: List[ProcedureInfo]
    success: bool
    error: Optional[str] = None

class ProcedureDefinitionRequest(BaseModel):
    connection_string: str
    database_type: str
    procedure_name: str

class ProcedureDefinitionResponse(BaseModel):
    procedure_name: str
    type: str
    definition: Optional[str] = None
    parameters: Optional[str] = None
    success: bool
    error: Optional[str] = None


@router.post("/procedures/list", response_model=ProceduresListResponse)
async def fetch_procedures_list(request: ProceduresListRequest):
    """
    Fetch list of all stored procedures and functions from the database.

    This is a dynamic endpoint - only called when user/AI explicitly requests procedure information.
    Not included in the initial schema to save tokens.
    """
    try:
        db = DatabaseConnection(request.connection_string, request.database_type)
        extractor = SchemaExtractor(db)

        # Get the appropriate query based on database type
        from database.schemas.postgres import POSTGRES_SCHEMA_QUERIES
        from database.schemas.mysql import MYSQL_SCHEMA_QUERIES
        from database.schemas.mssql import MSSQL_SCHEMA_QUERIES

        db_type = request.database_type.lower()

        if db_type == 'postgresql':
            query = POSTGRES_SCHEMA_QUERIES['procedures_list']
        elif db_type == 'mysql':
            query = MYSQL_SCHEMA_QUERIES['procedures_list']
        elif db_type in ['mssql', 'sqlserver']:
            query = MSSQL_SCHEMA_QUERIES['procedures_list']
        else:
            raise ValueError(f"Unsupported database type: {request.database_type}")

        # Execute query
        result = db.execute_query(query)

        # Format results
        procedures = []
        for row in result:
            procedures.append(ProcedureInfo(
                procedure_name=row.get('procedure_name') or row.get('PROCEDURE_NAME') or '',
                type=row.get('type') or row.get('TYPE') or ''
            ))

        return ProceduresListResponse(
            procedures=procedures,
            success=True
        )

    except Exception as e:
        return ProceduresListResponse(
            procedures=[],
            success=False,
            error=str(e)
        )


@router.post("/procedures/definition", response_model=ProcedureDefinitionResponse)
async def fetch_procedure_definition(request: ProcedureDefinitionRequest):
    """
    Fetch detailed definition of a specific stored procedure or function.

    This is a dynamic endpoint - only called when user/AI explicitly requests
    details about a specific procedure.
    """
    try:
        db = DatabaseConnection(request.connection_string, request.database_type)

        # Get the appropriate query based on database type
        from database.schemas.postgres import POSTGRES_SCHEMA_QUERIES
        from database.schemas.mysql import MYSQL_SCHEMA_QUERIES
        from database.schemas.mssql import MSSQL_SCHEMA_QUERIES

        db_type = request.database_type.lower()

        if db_type == 'postgresql':
            query = POSTGRES_SCHEMA_QUERIES['procedure_definition']
            # PostgreSQL uses %s placeholders
            result = db.execute_query(query, params=(request.procedure_name,))
        elif db_type == 'mysql':
            query = MYSQL_SCHEMA_QUERIES['procedure_definition']
            # MySQL uses %s placeholders
            result = db.execute_query(query, params=(request.procedure_name,))
        elif db_type in ['mssql', 'sqlserver']:
            query = MSSQL_SCHEMA_QUERIES['procedure_definition']
            # SQL Server uses @parameter_name placeholders
            # Need to replace the placeholder with actual value for this simple case
            query = query.replace('@procedure_name', f"'{request.procedure_name}'")
            result = db.execute_query(query)
        else:
            raise ValueError(f"Unsupported database type: {request.database_type}")

        if not result or len(result) == 0:
            return ProcedureDefinitionResponse(
                procedure_name=request.procedure_name,
                type='',
                success=False,
                error=f"Procedure '{request.procedure_name}' not found"
            )

        # Get first row
        row = result[0]

        return ProcedureDefinitionResponse(
            procedure_name=row.get('procedure_name') or row.get('PROCEDURE_NAME') or request.procedure_name,
            type=row.get('type') or row.get('TYPE') or '',
            definition=row.get('definition') or row.get('DEFINITION') or row.get('routine_definition') or row.get('ROUTINE_DEFINITION'),
            parameters=row.get('parameters') or row.get('PARAMETERS'),
            success=True
        )

    except Exception as e:
        return ProcedureDefinitionResponse(
            procedure_name=request.procedure_name,
            type='',
            success=False,
            error=str(e)
        )

# Database Info Request/Response Models
class DatabaseInfoRequest(BaseModel):
    connection_string: str
    database_type: str

class DatabaseInfoResponse(BaseModel):
    database_name: Optional[str] = None
    database_size: Optional[str] = None
    creation_date: Optional[str] = None
    collation: Optional[str] = None
    owner: Optional[str] = None
    status: Optional[str] = None
    recovery_model: Optional[str] = None
    compatibility_level: Optional[str] = None
    success: bool
    error: Optional[str] = None


@router.post("/database/info", response_model=DatabaseInfoResponse)
async def get_database_info(request: DatabaseInfoRequest):
    """Get database properties and metadata - independent endpoint that doesn't affect chat"""
    try:
        db = DatabaseConnection(request.connection_string, request.database_type)

        if not db.test_connection():
            return DatabaseInfoResponse(
                success=False,
                error="Failed to connect to database"
            )

        db_type = request.database_type.lower()
        info = {}

        if db_type == 'postgresql':
            # PostgreSQL database info queries
            queries = {
                'database_name': "SELECT current_database() as db_name",
                'database_size': "SELECT pg_size_pretty(pg_database_size(current_database())) as size",
                'creation_date': """
                    SELECT (pg_stat_file('base/'||oid ||'/PG_VERSION')).modification as creation_date
                    FROM pg_database WHERE datname = current_database()
                """,
                'collation': "SELECT datcollate as collation FROM pg_database WHERE datname = current_database()",
                'owner': "SELECT pg_catalog.pg_get_userbyid(datdba) as owner FROM pg_database WHERE datname = current_database()"
            }

            for key, query in queries.items():
                try:
                    result = db.execute_query(query)
                    if result and len(result) > 0:
                        info[key] = str(result[0].get(key.replace('_', ''))) if key.replace('_', '') in result[0] else str(list(result[0].values())[0])
                except:
                    info[key] = "N/A"

        elif db_type == 'mysql':
            # MySQL database info queries
            db_name_result = db.execute_query("SELECT DATABASE() as db_name")
            db_name = db_name_result[0]['db_name'] if db_name_result else None

            if db_name:
                queries = {
                    'database_name': f"SELECT '{db_name}' as db_name",
                    'database_size': f"""
                        SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb
                        FROM information_schema.tables
                        WHERE table_schema = '{db_name}'
                    """,
                    'creation_date': f"""
                        SELECT create_time as creation_date
                        FROM information_schema.tables
                        WHERE table_schema = '{db_name}'
                        ORDER BY create_time ASC LIMIT 1
                    """,
                    'collation': f"""
                        SELECT default_collation_name as collation
                        FROM information_schema.schemata
                        WHERE schema_name = '{db_name}'
                    """
                }

                for key, query in queries.items():
                    try:
                        result = db.execute_query(query)
                        if result and len(result) > 0:
                            value = list(result[0].values())[0]
                            if key == 'database_size' and value:
                                info[key] = f"{value} MB"
                            else:
                                info[key] = str(value) if value else "N/A"
                    except:
                        info[key] = "N/A"

        elif db_type in ['mssql', 'sqlserver']:
            # SQL Server database info queries
            queries = {
                'database_name': "SELECT DB_NAME() as database_name",
                'database_size': """
                    SELECT
                        CAST(SUM(size) * 8.0 / 1024 AS DECIMAL(10,2)) as size_mb
                    FROM sys.master_files
                    WHERE database_id = DB_ID()
                """,
                'creation_date': "SELECT create_date FROM sys.databases WHERE name = DB_NAME()",
                'collation': "SELECT collation_name FROM sys.databases WHERE name = DB_NAME()",
                'owner': "SELECT SUSER_SNAME(owner_sid) as owner FROM sys.databases WHERE name = DB_NAME()",
                'recovery_model': "SELECT recovery_model_desc FROM sys.databases WHERE name = DB_NAME()",
                'compatibility_level': "SELECT compatibility_level FROM sys.databases WHERE name = DB_NAME()",
                'status': "SELECT state_desc FROM sys.databases WHERE name = DB_NAME()"
            }

            for key, query in queries.items():
                try:
                    result = db.execute_query(query)
                    if result and len(result) > 0:
                        value = list(result[0].values())[0]
                        if key == 'database_size' and value:
                            info[key] = f"{value} MB"
                        else:
                            info[key] = str(value) if value else "N/A"
                except:
                    info[key] = "N/A"

        return DatabaseInfoResponse(
            database_name=info.get('database_name'),
            database_size=info.get('database_size'),
            creation_date=info.get('creation_date'),
            collation=info.get('collation'),
            owner=info.get('owner'),
            status=info.get('status'),
            recovery_model=info.get('recovery_model'),
            compatibility_level=info.get('compatibility_level'),
            success=True
        )

    except Exception as e:
        # Check if this is a permission error
        if is_permission_error(str(e), request.database_type):
            permission_info = get_permission_error_response('database_info', request.database_type)
            error_message = f"{permission_info['message']}\n\n{permission_info['grant_script']}"
            return DatabaseInfoResponse(
                success=False,
                error=error_message
            )

        return DatabaseInfoResponse(
            success=False,
            error=str(e)
        )











