/**
 * Analytics stub - no tracking in local-only app
 * Kept for backwards compatibility but does nothing
 */

export async function trackEvent(_event: string, _metadata?: Record<string, unknown>) {
  // No-op - local app doesn't track analytics
}

// Convenience helpers (no-ops)
export const analytics = {
  appOpen: () => { },
  chatSent: (_provider?: string) => { },
  connectionAdded: (_dbType?: string) => { },
  connectionRemoved: () => { },
  settingsChanged: (_setting?: string) => { },
  updateInstalled: (_version?: string) => { },
};
