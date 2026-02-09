/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DESKTOP_BACKEND_PORT?: string;
  // Add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

