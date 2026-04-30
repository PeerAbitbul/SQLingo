/**
 * Execution Plan Analysis API Client
 */

import { getBackendUrl } from './portConfig';
import type { BedrockConfig } from './api';

export interface Operation {
  operation_type: string;
  estimated_cost: number;
  estimated_rows: number;
  actual_rows?: number;
  cost_percentage: number;
  object_name?: string;
}

export interface Bottleneck {
  operation_type: string;
  cost_percentage: number;
  estimated_rows: number;
  actual_rows?: number;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export interface MissingIndex {
  table_name: string;
  equality_columns: string[];
  inequality_columns: string[];
  included_columns: string[];
  impact: number;
  estimated_improvement: string;
  create_index_sql?: string;
}

export interface ExecutionPlanSummary {
  statement: string;
  database_name?: string;
  total_operations: number;
  most_expensive_operation: string;
  total_cost: number;
  warnings: string[];
}

export interface ExecutionPlanAnalysis {
  summary?: ExecutionPlanSummary;
  operations: Operation[];
  bottlenecks: Bottleneck[];
  missing_indexes: MissingIndex[];
  recommendations: string[];
  ai_insights?: string;
  success: boolean;
  error?: string;
}

export const analyzeExecutionPlan = async (
  xmlContent: string,
  mode: 'byok' | 'managed',
  aiProvider?: string,
  aiModel?: string,
  apiKey?: string,
  token?: string,
  bedrockConfig?: BedrockConfig,
  authMode?: 'api_key' | 'access_token'
): Promise<ExecutionPlanAnalysis> => {
  const apiBaseUrl = await getBackendUrl();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${apiBaseUrl}/execution-plan/analyze`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      xml_content: xmlContent,
      database_type: 'sqlserver',
      ai_provider: aiProvider,
      ai_model: aiModel,
      mode,
      api_key: apiKey,
      auth_mode: authMode,
      bedrock_config: bedrockConfig,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Detect if text is execution plan XML
 */
export const isExecutionPlanXML = (text: string): boolean => {
  if (!text || text.length < 100) return false;

  return (
    text.includes('<?xml') &&
    (text.includes('ShowPlanXML') || text.includes('showplan')) &&
    (text.includes('StatementType') || text.includes('StmtSimple'))
  );
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
