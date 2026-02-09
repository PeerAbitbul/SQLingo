import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIProvider } from '../types/aiProvider';

type WindowStartPosition = 'center' | 'left' | 'right';

interface SettingsState {
  alwaysOnTop: boolean;
  defaultAIProvider: AIProvider;
  // AWS Bedrock credentials (for BYOK mode)
  bedrockAccessKey: string;
  bedrockSecretKey: string;
  bedrockRegion: string;
  retentionDays: number;
  maxMessagesPerChat: number;
  windowStartPosition: WindowStartPosition;
  setAlwaysOnTop: (value: boolean) => void;
  setDefaultAIProvider: (provider: AIProvider) => void;
  setBedrockCredentials: (accessKey: string, secretKey: string, region: string) => void;
  setRetentionDays: (days: number) => void;
  setMaxMessagesPerChat: (max: number) => void;
  setWindowStartPosition: (position: WindowStartPosition) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      alwaysOnTop: true,
      defaultAIProvider: 'claude',
      bedrockAccessKey: '',
      bedrockSecretKey: '',
      bedrockRegion: 'us-east-1',
      retentionDays: 90,
      maxMessagesPerChat: 1000,
      windowStartPosition: 'center',
      setAlwaysOnTop: (value) => set({ alwaysOnTop: value }),
      setDefaultAIProvider: (provider) => set({ defaultAIProvider: provider }),
      setBedrockCredentials: (accessKey, secretKey, region) =>
        set({ bedrockAccessKey: accessKey, bedrockSecretKey: secretKey, bedrockRegion: region }),
      setRetentionDays: (days) => set({ retentionDays: days }),
      setMaxMessagesPerChat: (max) => set({ maxMessagesPerChat: max }),
      setWindowStartPosition: (position) => set({ windowStartPosition: position }),
    }),
    {
      name: 'settings-storage',
    }
  )
);
