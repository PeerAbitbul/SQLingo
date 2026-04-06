/**
 * API Client for communicating with local Python backend
 */

import { getBackendUrl, getBaseUrlFromApiUrl } from './portConfig';

export interface ConnectionTestRequest {
  connection_string: string;
  database_type: 'sqlserver' | 'postgresql' | 'mysql';
}

export interface ConnectionTestResponse {
  success: boolean;
  message: string;
}

export interface SchemaRequest {
  connection_string: string;
  database_type: 'sqlserver' | 'postgresql' | 'mysql';
}

export interface TableSchema {
  table_name: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    default: string | null;
  }>;
}

export interface SchemaResponse {
  tables: TableSchema[];
  success: boolean;
}

export interface BedrockConfig {
  access_key: string;
  secret_key: string;
  region: string;
}

export interface ChatRequest {
  question: string;
  connection_string: string;
  database_type: 'sqlserver' | 'postgresql' | 'mysql';
  ai_provider: 'claude' | 'openai' | 'gemini' | 'bedrock' | 'ollama';
  ai_model?: string;  // Optional: specific model to use
  api_key?: string;  // For BYOK mode (not used for bedrock/ollama)
  auth_mode?: 'api_key' | 'access_token';  // Authentication mode
  bedrock_config?: BedrockConfig;  // For Bedrock BYOK mode
  ollama_base_url?: string;  // For Ollama local mode (default: http://localhost:11434)
  mode?: 'byok';  // Always BYOK mode
  conversation_history?: Array<{ role: 'user' | 'assistant'; content: string }>;  // Chat history for context
}

export interface ChatResponse {
  sql_query: string;
  explanation: string;
  success: boolean;
  error?: string;
  usage_warning?: 'approaching_limit' | 'limit_reached' | null;
}

export interface QueryExecuteRequest {
  connection_string: string;
  database_type: 'sqlserver' | 'postgresql' | 'mysql';
  sql_query: string;
}

export interface QueryExecuteResponse {
  columns: string[];
  rows: any[][];
  row_count: number;
  success: boolean;
  error?: string;
}

export interface GenerateTitleRequest {
  question: string;
  ai_provider: 'claude' | 'openai' | 'gemini' | 'bedrock' | 'ollama';
  ai_model?: string;  // Optional: specific model to use
  api_key?: string;  // For BYOK mode (not used for bedrock/ollama)
  auth_mode?: 'api_key' | 'access_token';  // Authentication mode
  bedrock_config?: BedrockConfig;  // For Bedrock BYOK mode
  ollama_base_url?: string;  // For Ollama local mode
  mode?: 'byok';  // Always BYOK mode
}

export interface GenerateTitleResponse {
  title: string;
  success: boolean;
  error?: string;
}






class APIClient {
  private async getBaseUrl(): Promise<string> {
    // Always get the latest backend URL
    return await getBackendUrl();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Get baseUrl fresh every time to support dynamic port changes
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}${endpoint}`;

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (fetchError: any) {
      // If connection refused, backend might have restarted on a different port
      // Force re-read the port config and try one more time
      if (fetchError.message?.includes('Failed to fetch') || fetchError.message?.includes('ECONNREFUSED')) {
        console.warn('Connection failed, retrying with fresh port config...');
        const freshBaseUrl = await this.getBaseUrl();
        const freshUrl = `${freshBaseUrl}${endpoint}`;
        response = await fetch(freshUrl, {
          ...options,
          headers,
        });
      } else {
        throw fetchError;
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail?.message || errorData.detail || errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async testConnection(data: ConnectionTestRequest): Promise<ConnectionTestResponse> {
    return this.request<ConnectionTestResponse>('/connection/test', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async extractSchema(data: SchemaRequest): Promise<SchemaResponse> {
    return this.request<SchemaResponse>('/schema/extract', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateSQL(data: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('/chat/query', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async executeQuery(data: QueryExecuteRequest): Promise<QueryExecuteResponse> {
    return this.request<QueryExecuteResponse>('/query/execute', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateChatTitle(data: GenerateTitleRequest): Promise<GenerateTitleResponse> {
    return this.request<GenerateTitleResponse>('/chat/generate-title', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async healthCheck(): Promise<{ status: string }> {
    const baseUrl = await this.getBaseUrl();
    const healthUrl = getBaseUrlFromApiUrl(baseUrl) + '/health';
    const response = await fetch(healthUrl);
    return response.json();
  }

}

export const apiClient = new APIClient();

