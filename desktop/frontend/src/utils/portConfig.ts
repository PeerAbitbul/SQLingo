/**
 * Port Configuration Utility
 * Reads port from environment variable with sensible default
 */

// Desktop backend port - reads from env or uses default
export const DESKTOP_BACKEND_PORT = parseInt(import.meta.env.VITE_DESKTOP_BACKEND_PORT || '39847');
export const DESKTOP_BACKEND_URL = `http://127.0.0.1:${DESKTOP_BACKEND_PORT}`;

export interface PortConfig {
  port: number;
  host: string;
  base_url: string;
}

/**
 * Get the backend API URL (with /api suffix)
 */
export async function getBackendUrl(): Promise<string> {
  return `${DESKTOP_BACKEND_URL}/api`;
}

/**
 * Get the backend base URL without /api suffix
 */
export function getBaseUrlFromApiUrl(apiUrl: string): string {
  return apiUrl.replace('/api', '');
}
