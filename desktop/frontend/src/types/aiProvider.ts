/**
 * AI Provider Types
 * Centralized type definitions for AI providers used across the app
 */

export type AIProvider = 'claude' | 'openai' | 'gemini' | 'bedrock' | 'ollama' | 'openrouter';

export type AuthMode = 'api_key' | 'access_token';

/** Providers that support access token authentication */
export const ACCESS_TOKEN_PROVIDERS: AIProvider[] = ['claude', 'openai'];

export const AI_PROVIDERS = {
  CLAUDE: 'claude' as const,
  OPENAI: 'openai' as const,
  GEMINI: 'gemini' as const,
  BEDROCK: 'bedrock' as const,
  OLLAMA: 'ollama' as const,
  OPENROUTER: 'openrouter' as const,
};

export interface AIProviderConfig {
  name: string;
  color: string;
  requiresAPIKey: boolean;
  requiresSubscription: boolean;
  isLocal?: boolean;
}

export const AI_PROVIDER_CONFIGS: Record<AIProvider, AIProviderConfig> = {
  claude: {
    name: 'Claude',
    color: '#8B5CF6',
    requiresAPIKey: true,
    requiresSubscription: false,
  },
  openai: {
    name: 'OpenAI',
    color: '#10B981',
    requiresAPIKey: true,
    requiresSubscription: false,
  },
  gemini: {
    name: 'Gemini',
    color: '#3B82F6',
    requiresAPIKey: true,
    requiresSubscription: false,
  },
  bedrock: {
    name: 'Bedrock',
    color: '#FF9900', // AWS orange
    requiresAPIKey: true, // AWS credentials
    requiresSubscription: false,
  },
  ollama: {
    name: 'Ollama',
    color: '#0A0A0A',
    requiresAPIKey: false,
    requiresSubscription: false,
    isLocal: true,
  },
  openrouter: {
    name: 'OpenRouter',
    color: '#6D28D9',
    requiresAPIKey: true,
    requiresSubscription: false,
  },
};

