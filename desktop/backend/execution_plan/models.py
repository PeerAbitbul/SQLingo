"""
Pydantic models for Execution Plan Analysis
"""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class BedrockConfig(BaseModel):
    access_key: str
    secret_key: str
    region: str = 'us-east-1'


class ExecutionPlanRequest(BaseModel):
    """Request to analyze an execution plan"""
    xml_content: str
    database_type: str = "sqlserver"
    ai_provider: Optional[str] = None  # 'claude', 'openai', 'gemini', 'bedrock'
    ai_model: Optional[str] = None
    api_key: Optional[str] = None  # For BYOK mode (not used for bedrock)
    auth_mode: Optional[str] = 'api_key'  # 'api_key' or 'access_token'
    bedrock_config: Optional[BedrockConfig] = None  # For Bedrock BYOK mode
    mode: str = "byok"  # 'byok' or 'managed'
    token: Optional[str] = None


class Operation(BaseModel):
    """Single operation in the execution plan"""
    operation_type: str  # e.g., "Clustered Index Scan", "Nested Loops"
    estimated_cost: float
    estimated_rows: int
    actual_rows: Optional[int] = None
    cost_percentage: float
    object_name: Optional[str] = None


class Bottleneck(BaseModel):
    """Identified bottleneck in the execution plan"""
    operation_type: str
    cost_percentage: float
    estimated_rows: int
    actual_rows: Optional[int] = None
    description: str
    severity: str  # 'high', 'medium', 'low'


class MissingIndex(BaseModel):
    """Missing index suggestion"""
    table_name: str
    equality_columns: List[str]
    inequality_columns: List[str]
    included_columns: List[str]
    impact: float  # 0-100
    estimated_improvement: str
    create_index_sql: Optional[str] = None


class CostMetrics(BaseModel):
    """Cost metrics for the execution plan"""
    total_cost: float
    compile_time_ms: Optional[float] = None
    execution_time_ms: Optional[float] = None
    estimated_rows: int
    actual_rows: Optional[int] = None


class ExecutionPlanSummary(BaseModel):
    """Summary of the execution plan"""
    statement: str
    database_name: Optional[str] = None
    total_operations: int
    most_expensive_operation: str
    total_cost: float
    warnings: List[str]


class ExecutionPlanResponse(BaseModel):
    """Response from execution plan analysis"""
    summary: Optional[ExecutionPlanSummary] = None
    operations: List[Operation]
    bottlenecks: List[Bottleneck]
    missing_indexes: List[MissingIndex]
    recommendations: List[str]
    ai_insights: Optional[str] = None
    success: bool
    error: Optional[str] = None
