/**
 * Ollama API Client
 * Communicates with backend Ollama endpoints under /api/ollama
 */
import { getBackendUrl } from './portConfig';
import type { GemmaModel, HardwareInfo, PullProgress } from '../stores/ollamaStore';

async function ollamaUrl(path: string): Promise<string> {
  const base = await getBackendUrl();
  return `${base}/ollama${path}`;
}

// ── Status ──────────────────────────────────────────────────────────────

export interface OllamaStatus {
  installed: boolean;
  running: boolean;
  version: string | null;
  base_url: string;
}

export async function fetchOllamaStatus(baseUrl?: string): Promise<OllamaStatus> {
  const params = baseUrl ? `?base_url=${encodeURIComponent(baseUrl)}` : '';
  const url = await ollamaUrl(`/status${params}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
  return res.json();
}

// ── Hardware ────────────────────────────────────────────────────────────

export async function fetchHardware(): Promise<HardwareInfo> {
  const url = await ollamaUrl('/hardware');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Hardware check failed: ${res.status}`);
  return res.json();
}

// ── Catalog ─────────────────────────────────────────────────────────────

export interface CatalogResponse {
  gemma: GemmaModel[];
  other_installed: string[];
  hardware: HardwareInfo;
}

export async function fetchCatalog(baseUrl?: string): Promise<CatalogResponse> {
  const params = baseUrl ? `?base_url=${encodeURIComponent(baseUrl)}` : '';
  const url = await ollamaUrl(`/catalog${params}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Catalog fetch failed: ${res.status}`);
  return res.json();
}

// ── Installed models ────────────────────────────────────────────────────

export interface InstalledResponse {
  models: string[];
  running: boolean;
}

export async function fetchInstalled(baseUrl?: string): Promise<InstalledResponse> {
  const params = baseUrl ? `?base_url=${encodeURIComponent(baseUrl)}` : '';
  const url = await ollamaUrl(`/installed${params}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Installed fetch failed: ${res.status}`);
  return res.json();
}

// ── Pull (SSE) ──────────────────────────────────────────────────────────

export async function pullModel(
  model: string,
  onProgress: (progress: PullProgress) => void,
  baseUrl?: string
): Promise<void> {
  const url = await ollamaUrl('/pull');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, base_url: baseUrl }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Pull request failed' }));
    throw new Error(err.detail || `Pull failed: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      try {
        const data: PullProgress = JSON.parse(trimmed.slice(6));
        onProgress(data);
      } catch {
        // skip malformed SSE lines
      }
    }
  }
}

// ── Delete ──────────────────────────────────────────────────────────────

export async function deleteModel(
  model: string,
  baseUrl?: string
): Promise<{ success: boolean; model: string }> {
  const url = await ollamaUrl('/delete');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, base_url: baseUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Delete failed' }));
    throw new Error(err.detail || `Delete failed: ${res.status}`);
  }
  return res.json();
}
