import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIProvider, AuthMode } from '../types/aiProvider';

interface APIKeyState {
  claudeKey: string;
  openaiKey: string;
  geminiKey: string;
  claudeModel: string;
  openaiModel: string;
  geminiModel: string;
  bedrockModel: string;
  claudeAuthMode: AuthMode;
  openaiAuthMode: AuthMode;
  setClaudeKey: (key: string) => void;
  setOpenaiKey: (key: string) => void;
  setGeminiKey: (key: string) => void;
  setClaudeModel: (model: string) => void;
  setOpenaiModel: (model: string) => void;
  setGeminiModel: (model: string) => void;
  setBedrockModel: (model: string) => void;
  setClaudeAuthMode: (mode: AuthMode) => void;
  setOpenaiAuthMode: (mode: AuthMode) => void;
  getKeyForProvider: (provider: AIProvider) => string;
  getModelForProvider: (provider: AIProvider) => string;
  getAuthModeForProvider: (provider: AIProvider) => AuthMode;
}

export const useAPIKeyStore = create<APIKeyState>()(
  persist(
    (set, get) => ({
      claudeKey: '',
      openaiKey: '',
      geminiKey: '',
      // Empty defaults - user enters their own model name
      claudeModel: '',
      openaiModel: '',
      geminiModel: '',
      bedrockModel: '',
      // Auth modes - default to api_key
      claudeAuthMode: 'api_key' as AuthMode,
      openaiAuthMode: 'api_key' as AuthMode,
      setClaudeKey: (key) => set({ claudeKey: key }),
      setOpenaiKey: (key) => set({ openaiKey: key }),
      setGeminiKey: (key) => set({ geminiKey: key }),
      setClaudeModel: (model) => set({ claudeModel: model }),
      setOpenaiModel: (model) => set({ openaiModel: model }),
      setGeminiModel: (model) => set({ geminiModel: model }),
      setBedrockModel: (model) => set({ bedrockModel: model }),
      setClaudeAuthMode: (mode) => set({ claudeAuthMode: mode }),
      setOpenaiAuthMode: (mode) => set({ openaiAuthMode: mode }),
      getKeyForProvider: (provider) => {
        const state = get();
        switch (provider) {
          case 'claude':
            return state.claudeKey;
          case 'openai':
            return state.openaiKey;
          case 'gemini':
            return state.geminiKey;
          case 'bedrock':
            // Bedrock uses AWS credentials from settingsStore, not API key
            return '';
          default:
            return '';
        }
      },
      getModelForProvider: (provider) => {
        const state = get();
        switch (provider) {
          case 'claude':
            return state.claudeModel;
          case 'openai':
            return state.openaiModel;
          case 'gemini':
            return state.geminiModel;
          case 'bedrock':
            return state.bedrockModel;
          default:
            return '';
        }
      },
      getAuthModeForProvider: (provider) => {
        const state = get();
        switch (provider) {
          case 'claude':
            return state.claudeAuthMode;
          case 'openai':
            return state.openaiAuthMode;
          default:
            return 'api_key';
        }
      },
    }),
    {
      name: 'api-key-storage',
      version: 8, // Removed static model defaults - user enters model name
    }
  )
);
