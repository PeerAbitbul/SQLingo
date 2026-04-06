import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ModelFit = 'compatible' | 'recommended' | 'risky' | 'incompatible';

export interface GemmaModel {
  id: string;
  name: string;
  params: string;
  active_params: string;
  ram_required_gb: number;
  size_gb: number;
  context: string;
  tier: string;
  description: string;
  fit: ModelFit;
  installed: boolean;
}

export interface HardwareInfo {
  os: string;
  arch: string;
  is_apple_silicon: boolean;
  total_ram_gb: number;
  available_ram_gb: number;
  cpu_count: number;
  effective_vram_gb: number | null;
}

export interface PullProgress {
  model: string;
  status: string;
  completed: number;
  total: number;
  percent: number;
  done: boolean;
  error?: string;
}

interface OllamaState {
  // Persisted
  baseUrl: string;
  selectedModel: string | null;

  // Runtime (not persisted)
  running: boolean;
  version: string | null;
  hardware: HardwareInfo | null;
  gemmaCatalog: GemmaModel[];
  otherInstalled: string[];
  installedModels: string[];
  pullProgress: Record<string, PullProgress>;

  // Actions
  setBaseUrl: (url: string) => void;
  setSelectedModel: (model: string | null) => void;
  setRunning: (running: boolean, version?: string | null) => void;
  setHardware: (hw: HardwareInfo) => void;
  setCatalog: (gemma: GemmaModel[], other: string[]) => void;
  setInstalledModels: (models: string[]) => void;
  updatePullProgress: (model: string, progress: PullProgress) => void;
  clearPullProgress: (model: string) => void;
}

export const useOllamaStore = create<OllamaState>()(
  persist(
    (set) => ({
      // Persisted defaults
      baseUrl: 'http://localhost:11434',
      selectedModel: null,

      // Runtime defaults
      running: false,
      version: null,
      hardware: null,
      gemmaCatalog: [],
      otherInstalled: [],
      installedModels: [],
      pullProgress: {},

      setBaseUrl: (url) => set({ baseUrl: url }),
      setSelectedModel: (model) => set({ selectedModel: model }),
      setRunning: (running, version = null) => set({ running, version }),
      setHardware: (hw) => set({ hardware: hw }),
      setCatalog: (gemma, other) =>
        set({ gemmaCatalog: gemma, otherInstalled: other }),
      setInstalledModels: (models) => set({ installedModels: models }),
      updatePullProgress: (model, progress) =>
        set((state) => ({
          pullProgress: { ...state.pullProgress, [model]: progress },
        })),
      clearPullProgress: (model) =>
        set((state) => {
          const { [model]: _, ...rest } = state.pullProgress;
          return { pullProgress: rest };
        }),
    }),
    {
      name: 'ollama-storage',
      version: 1,
      partialize: (state) => ({
        baseUrl: state.baseUrl,
        selectedModel: state.selectedModel,
      }),
    }
  )
);
