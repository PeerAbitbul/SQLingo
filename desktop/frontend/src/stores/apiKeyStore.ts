import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIProvider, AuthMode } from '../types/aiProvider';

interface APIKeyState {
  claudeKey: string;
  openaiKey: string;
  geminiKey: string;
  openrouterKey: string;
  claudeModel: string;
  openaiModel: string;
  geminiModel: string;
  bedrockModel: string;
  openrouterModel: string;
  claudeAuthMode: AuthMode;
  openaiAuthMode: AuthMode;
  setClaudeKey: (key: string) => void;
  setOpenaiKey: (key: string) => void;
  setGeminiKey: (key: string) => void;
  setOpenrouterKey: (key: string) => void;
  setClaudeModel: (model: string) => void;
  setOpenaiModel: (model: string) => void;
  setGeminiModel: (model: string) => void;
  setBedrockModel: (model: string) => void;
  setOpenrouterModel: (model: string) => void;
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
      openrouterKey: '',
      claudeModel: '',
      openaiModel: '',
      geminiModel: '',
      bedrockModel: '',
      openrouterModel: '',
      claudeAuthMode: 'api_key' as AuthMode,
      openaiAuthMode: 'api_key' as AuthMode,
      setClaudeKey: (key) => set({ claudeKey: key }),
      setOpenaiKey: (key) => set({ openaiKey: key }),
      setGeminiKey: (key) => set({ geminiKey: key }),
      setOpenrouterKey: (key) => set({ openrouterKey: key }),
      setClaudeModel: (model) => set({ claudeModel: model }),
      setOpenaiModel: (model) => set({ openaiModel: model }),
      setGeminiModel: (model) => set({ geminiModel: model }),
      setBedrockModel: (model) => set({ bedrockModel: model }),
      setOpenrouterModel: (model) => set({ openrouterModel: model }),
      setClaudeAuthMode: (mode) => set({ claudeAuthMode: mode }),
      setOpenaiAuthMode: (mode) => set({ openaiAuthMode: mode }),
      getKeyForProvider: (provider) => {
        const state = get();
        switch (provider) {
          case 'claude': return state.claudeKey;
          case 'openai': return state.openaiKey;
          case 'gemini': return state.geminiKey;
          case 'openrouter': return state.openrouterKey;
          default: return '';
        }
      },
      getModelForProvider: (provider) => {
        const state = get();
        switch (provider) {
          case 'claude': return state.claudeModel;
          case 'openai': return state.openaiModel;
          case 'gemini': return state.geminiModel;
          case 'bedrock': return state.bedrockModel;
          case 'openrouter': return state.openrouterModel;
          default: return '';
        }
      },
      getAuthModeForProvider: (provider) => {
        const state = get();
        switch (provider) {
          case 'claude': return state.claudeAuthMode;
          case 'openai': return state.openaiAuthMode;
          default: return 'api_key';
        }
      },
    }),
    {
      name: 'api-key-storage',
      version: 9,
    }
  )
);
