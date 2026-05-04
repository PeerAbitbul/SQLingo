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
  ai_provider: 'claude' | 'openai' | 'gemini' | 'bedrock' | 'ollama' | 'openrouter';
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
  traceback?: string;
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

export interface QueryActionRequest {
  connection_string: string;
  database_type: 'sqlserver' | 'postgresql' | 'mysql';
  sql_query: string;
  connection_name?: string;
}

export interface QueryActionResponse {
  success: boolean;
  affected_rows: number;
  log_id?: string;
  error?: string;
}

export interface InterpretResultsRequest {
  question: string;
  sql_query: string;
  columns: string[];
  rows: any[][];
  row_count: number;
  ai_provider: 'claude' | 'openai' | 'gemini' | 'bedrock' | 'ollama' | 'openrouter';
  ai_model?: string;
  api_key?: string;
  auth_mode?: 'api_key' | 'access_token';
  bedrock_config?: BedrockConfig;
  ollama_base_url?: string;
}

export interface InterpretResultsResponse {
  answer: string;
  success: boolean;
  error?: string;
}

export interface GenerateTitleRequest {
  question: string;
  ai_provider: 'claude' | 'openai' | 'gemini' | 'bedrock' | 'ollama' | 'openrouter';
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

export interface AgentData {
  id: string;
  name: string;
  connection_id: string;
  schedule: string;
  query_logic: string;
  destination: string;
  is_active: boolean;
  created_at: string;
  last_run_at: string | null;
  last_status: string | null;
  agent_type: 'monitor' | 'action' | 'conditional';
}

export interface AgentRunLog {
  id: string;
  agent_id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  row_count: number;
  summary: string | null;
  error_message: string | null;
}

export interface GetAllAgentsResponse {
  success: boolean;
  agents: AgentData[];
  master_paused: boolean;
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
      const isNetworkError = fetchError.message?.includes('Failed to fetch') ||
        fetchError.message?.includes('ECONNREFUSED') ||
        fetchError.message?.includes('Network request failed');

      if (isNetworkError) {
        console.warn('Connection failed, retrying with fresh port config...');
        try {
          const freshBaseUrl = await this.getBaseUrl();
          const freshUrl = `${freshBaseUrl}${endpoint}`;
          response = await fetch(freshUrl, { ...options, headers });
        } catch {
          throw new Error(
            'Backend is not responding. The background service may have failed to start. ' +
            'Check the log file at: ~/.sqlingo/electron-main.log'
          );
        }
      } else {
        throw fetchError;
      }
    }

    if (!response.ok) {
      let detail: string;
      try {
        const errorData = await response.json();
        const message = errorData.detail?.message || errorData.detail || errorData.message || `HTTP ${response.status}`;
        if (errorData.traceback) {
          detail = `${message}\n\n--- traceback ---\n${errorData.traceback}`;
        } else {
          detail = message;
        }
      } catch {
        detail = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
      }
      throw new Error(detail);
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

  async executeActionQuery(data: QueryActionRequest): Promise<QueryActionResponse> {
    return this.request<QueryActionResponse>('/query/execute-action', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getActionLogs(limit = 50): Promise<{ success: boolean; logs: any[] }> {
    return this.request<{ success: boolean; logs: any[] }>(`/query/action-logs?limit=${limit}`);
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

  async getAgentMessages(): Promise<{ success: boolean, messages: any[] }> {
    return this.request<{ success: boolean, messages: any[] }>('/agents/messages');
  }

  async markAgentMessagesRead(messageIds: string[]): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/agents/messages/mark-read', {
      method: 'POST',
      body: JSON.stringify({ message_ids: messageIds }),
    });
  }

  async getAllAgents(): Promise<GetAllAgentsResponse> {
    return this.request<GetAllAgentsResponse>('/agents/');
  }

  async toggleAgentMaster(active: boolean): Promise<{ success: boolean, master_paused: boolean }> {
    return this.request<{ success: boolean, master_paused: boolean }>('/agents/toggle-master', {
      method: 'POST',
      body: JSON.stringify({ active }),
    });
  }

  async toggleAgent(agentId: string, active: boolean): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/agents/${agentId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ active }),
    });
  }

  async deleteAgent(agentId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/agents/${agentId}`, {
      method: 'DELETE',
    });
  }

  async getAgentRuns(agentId: string, limit: number = 10): Promise<{ success: boolean, runs: AgentRunLog[] }> {
    return this.request<{ success: boolean, runs: AgentRunLog[] }>(`/agents/${agentId}/runs?limit=${limit}`);
  }

  async saveObserverConfig(keys: Record<string, string>, models: Record<string, string>): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/agents/observer-config', {
      method: 'POST',
      body: JSON.stringify({ keys, models }),
    });
  }

  async saveFavorite(data: { connection_id: number, title: string, sql_query: string, description?: string, tags?: string }): Promise<{ success: boolean, id: number }> {
    return this.request<{ success: boolean, id: number }>('/favorites', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFavorites(connectionId?: number): Promise<{ success: boolean, favorites: any[] }> {
    const url = connectionId ? `/favorites?connection_id=${connectionId}` : '/favorites';
    return this.request<{ success: boolean, favorites: any[] }>(url);
  }

  async deleteFavorite(favoriteId: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/favorites/${favoriteId}`, {
      method: 'DELETE',
    });
  }

  async interpretResults(data: InterpretResultsRequest): Promise<InterpretResultsResponse> {
    return this.request<InterpretResultsResponse>('/chat/interpret', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

}

export const apiClient = new APIClient();

