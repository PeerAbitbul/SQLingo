import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIProvider } from '../types/aiProvider';

interface APIKeyState {
  claudeKey: string;
  openaiKey: string;
  geminiKey: string;
  claudeModel: string;
  openaiModel: string;
  geminiModel: string;
  bedrockModel: string;
  setClaudeKey: (key: string) => void;
  setOpenaiKey: (key: string) => void;
  setGeminiKey: (key: string) => void;
  setClaudeModel: (model: string) => void;
  setOpenaiModel: (model: string) => void;
  setGeminiModel: (model: string) => void;
  setBedrockModel: (model: string) => void;
  getKeyForProvider: (provider: AIProvider) => string;
  getModelForProvider: (provider: AIProvider) => string;
}

export const useAPIKeyStore = create<APIKeyState>()(
  persist(
    (set, get) => ({
      claudeKey: '',
      openaiKey: '',
      geminiKey: '',
      // Default models - will be updated from API
      claudeModel: 'claude-3-5-sonnet-latest',
      openaiModel: 'gpt-4o',
      geminiModel: 'gemini-2.5-flash',
      bedrockModel: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      setClaudeKey: (key) => set({ claudeKey: key }),
      setOpenaiKey: (key) => set({ openaiKey: key }),
      setGeminiKey: (key) => set({ geminiKey: key }),
      setClaudeModel: (model) => set({ claudeModel: model }),
      setOpenaiModel: (model) => set({ openaiModel: model }),
      setGeminiModel: (model) => set({ geminiModel: model }),
      setBedrockModel: (model) => set({ bedrockModel: model }),
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
    }),
    {
      name: 'api-key-storage',
      version: 6, // Removed cloud support
    }
  )
);
