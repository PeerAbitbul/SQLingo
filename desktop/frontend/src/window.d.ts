// Electron API types
declare global {
  interface PortConfig {
    port: number;
    host: string;
    base_url: string;
  }

  interface Window {
    electron?: {
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      setAlwaysOnTop: (flag: boolean) => Promise<void>;
      setStartPosition: (position: 'center' | 'left' | 'right') => Promise<void>;
      openExternal: (url: string) => Promise<void>;      readPortConfig: () => Promise<PortConfig | null>;
      getBackendUrl: () => Promise<string>;
      // Auto-update
      checkForUpdates: () => Promise<void>;
      installUpdate: () => Promise<void>;
      getAppVersion: () => Promise<string>;
      onUpdateAvailable: (callback: (data: { version: string }) => void) => void;
      onUpdateProgress: (callback: (data: { percent: number }) => void) => void;
      onUpdateDownloaded: (callback: (data: { version: string }) => void) => void;
      // Diagnostics
      readLogFile: () => Promise<{ success: boolean; content: string; path: string }>;
      getBackendStatus: () => Promise<{ running: boolean; pid: number | null; port: number; logPath: string }>;
      platform: string;
      isElectron: boolean;
    };
  }
}

export {};

