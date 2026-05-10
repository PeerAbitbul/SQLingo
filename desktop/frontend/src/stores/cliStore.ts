import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CLIState {
  claudeCliMode: boolean;
  setClaudeCliMode: (enabled: boolean) => void;
}

export const useCLIStore = create<CLIState>()(
  persist(
    (set) => ({
      claudeCliMode: false,
      setClaudeCliMode: (enabled) => set({ claudeCliMode: enabled }),
    }),
    { name: 'cli-settings', version: 1 }
  )
);
