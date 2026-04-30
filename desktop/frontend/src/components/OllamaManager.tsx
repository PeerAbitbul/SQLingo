import styled from 'styled-components';
import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useOllamaStore } from '../stores/ollamaStore';
import type { ModelFit } from '../stores/ollamaStore';
import { fetchOllamaStatus, fetchCatalog, fetchInstalled, pullModel, deleteModel } from '../utils/ollamaApi';
import { showToast } from '../stores/toastStore';
import { showDialog } from '../stores/dialogStore';
import { OllamaInstallGuide } from './OllamaInstallGuide';

// ── Styles ────────────────────────────────────────────────────────────────────

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusDot = styled.span<{ $online: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) => (p.$online ? '#22c55e' : '#ef4444')};
`;

const StatusText = styled.span`
  font-size: 13px;
  color: ${(p) => p.theme.colors.textSecondary};
`;

const HwBar = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 12px;
  color: ${(p) => p.theme.colors.textSecondary};
  padding: 8px 12px;
  background: ${(p) => p.theme.colors.surface};
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: 6px;
`;

const HwChip = styled.span`
  color: ${(p) => p.theme.colors.text};
  font-weight: 500;
`;

const TabBar = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid ${(p) => p.$active ? p.theme.colors.primary : p.theme.colors.border};
  background: ${(p) => p.$active ? p.theme.colors.primary + '18' : 'transparent'};
  color: ${(p) => p.$active ? p.theme.colors.primary : p.theme.colors.textSecondary};
  font-size: 12px;
  font-weight: ${(p) => p.$active ? 600 : 400};
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    border-color: ${(p) => p.theme.colors.primary};
    color: ${(p) => p.theme.colors.primary};
  }
`;

const ModelList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: 8px;
  overflow: hidden;
`;

const ModelRow = styled.div<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  background: ${(p) => p.$selected ? p.theme.colors.primary + '0d' : p.theme.colors.surface};
  border-left: 3px solid ${(p) => p.$selected ? p.theme.colors.primary : 'transparent'};
  transition: background 0.1s;
  &:hover { background: ${(p) => p.theme.colors.background}; }
  &:not(:last-child) { border-bottom: 1px solid ${(p) => p.theme.colors.border}; }
`;

const ModelInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ModelName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${(p) => p.theme.colors.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ModelMeta = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 2px;
  font-size: 11px;
  color: ${(p) => p.theme.colors.textSecondary};
`;

const FitBadge = styled.span<{ $fit: ModelFit }>`
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 10px;
  white-space: nowrap;
  color: #fff;
  background: ${({ $fit }) =>
    $fit === 'recommended' ? '#22c55e' :
    $fit === 'compatible'  ? '#3b82f6' :
    $fit === 'risky'       ? '#eab308' : '#6b7280'};
`;

const ProgressWrap = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const ProgressBar = styled.div<{ $pct: number }>`
  height: 4px;
  border-radius: 2px;
  background: ${(p) => p.theme.colors.border};
  position: relative;
  overflow: hidden;
  &::after {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: ${(p) => p.$pct}%;
    background: ${(p) => p.theme.colors.primary};
    border-radius: 2px;
    transition: width 0.3s;
  }
`;

const ProgressLabel = styled.span`
  font-size: 10px;
  color: ${(p) => p.theme.colors.textSecondary};
`;

const Btn = styled.button<{ $variant?: 'danger' | 'success' | 'primary' | 'ghost' }>`
  padding: 4px 10px;
  border-radius: 5px;
  border: none;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  color: ${(p) => p.$variant === 'ghost' ? p.theme.colors.textSecondary : '#fff'};
  background: ${({ $variant, theme }) =>
    $variant === 'danger'  ? '#ef4444' :
    $variant === 'success' ? '#22c55e' :
    $variant === 'ghost'   ? 'transparent' :
    theme.colors.primary};
  border: 1px solid ${({ $variant, theme }) =>
    $variant === 'ghost' ? theme.colors.border : 'transparent'};
  &:hover { opacity: 0.85; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const OtherRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: ${(p) => p.theme.colors.surface};
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: 6px;
  font-size: 13px;
  color: ${(p) => p.theme.colors.text};
`;

const SectionLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${(p) => p.theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 4px;
`;

const POLL_INTERVAL = 10_000;

// ── Component ─────────────────────────────────────────────────────────────────

export const OllamaManager = () => {
  const store = useOllamaStore();
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const [activeFamily, setActiveFamily] = useState<string>('All');

  const refresh = useCallback(async () => {
    try {
      const status = await fetchOllamaStatus(store.baseUrl);
      store.setRunning(status.running, status.version);
      if (status.running) {
        const catalog = await fetchCatalog(store.baseUrl);
        store.setHardware(catalog.hardware);
        const installed = await fetchInstalled(store.baseUrl);
        store.setInstalledModels(installed.models);
        const source = catalog.catalog ?? catalog.gemma ?? [];
        const withInstalled = source.map((m: any) => ({
          ...m,
          installed: installed.models.includes(m.id),
        }));
        store.setCatalog(withInstalled, catalog.other_installed);
      }
    } catch {
      store.setRunning(false);
    }
  }, [store.baseUrl]);

  useEffect(() => {
    refresh();
    pollRef.current = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [refresh]);

  const handlePull = useCallback(async (modelId: string) => {
    try {
      await pullModel(modelId, (progress) => {
        store.updatePullProgress(modelId, progress);
        if (progress.done && !progress.error) {
          showToast.success(`${modelId} installed`);
          store.clearPullProgress(modelId);
          refresh();
        }
        if (progress.error) {
          showToast.error(`Pull failed: ${progress.error}`);
          store.clearPullProgress(modelId);
        }
      }, store.baseUrl);
    } catch (e: any) {
      showToast.error(e.message || 'Pull failed');
      store.clearPullProgress(modelId);
    }
  }, [store.baseUrl, refresh]);

  const handleDelete = useCallback(async (modelId: string) => {
    const ok = await showDialog.confirm({ message: `Delete ${modelId}?`, variant: 'danger' });
    if (!ok) return;
    try {
      await deleteModel(modelId, store.baseUrl);
      showToast.success(`${modelId} deleted`);
      if (store.selectedModel === modelId) store.setSelectedModel(null);
      refresh();
    } catch (e: any) {
      showToast.error(e.message || 'Delete failed');
    }
  }, [store.baseUrl, store.selectedModel, refresh]);

  const handleSelect = useCallback((modelId: string) => {
    store.setSelectedModel(modelId);
    showToast.success(`Using ${modelId}`);
  }, []);

  const families = useMemo(() => {
    const seen = new Set<string>();
    store.gemmaCatalog.forEach(m => seen.add(m.family || 'Other'));
    return ['All', ...Array.from(seen)];
  }, [store.gemmaCatalog]);

  const visibleModels = useMemo(() =>
    activeFamily === 'All'
      ? store.gemmaCatalog
      : store.gemmaCatalog.filter(m => (m.family || 'Other') === activeFamily),
    [store.gemmaCatalog, activeFamily]
  );

  if (!store.running) {
    return <Container><OllamaInstallGuide /></Container>;
  }

  const hw = store.hardware;

  return (
    <Container>
      <StatusRow>
        <StatusDot $online />
        <StatusText>Ollama v{store.version} running</StatusText>
      </StatusRow>

      {hw && (
        <HwBar>
          <span>OS: <HwChip>{hw.os} ({hw.arch})</HwChip></span>
          <span>RAM: <HwChip>{hw.total_ram_gb} GB</HwChip></span>
          <span>CPU: <HwChip>{hw.cpu_count} cores</HwChip></span>
          {hw.is_apple_silicon && <span><HwChip>Apple Silicon</HwChip></span>}
        </HwBar>
      )}

      <SectionLabel>Models</SectionLabel>

      <TabBar>
        {families.map(f => (
          <Tab key={f} $active={activeFamily === f} onClick={() => setActiveFamily(f)}>
            {f}
          </Tab>
        ))}
      </TabBar>

      <ModelList>
        {visibleModels.map(model => {
          const progress = store.pullProgress[model.id];
          const isPulling = progress && !progress.done;
          const isSelected = store.selectedModel === model.id;

          return (
            <ModelRow key={model.id} $selected={isSelected}>
              <ModelInfo>
                <ModelName>{model.name}</ModelName>
                <ModelMeta>
                  <span>{model.params}</span>
                  <span>·</span>
                  <span>{model.size_gb} GB</span>
                  <span>·</span>
                  <span>RAM {model.ram_required_gb} GB</span>
                </ModelMeta>
              </ModelInfo>

              {isPulling ? (
                <ProgressWrap>
                  <ProgressBar $pct={progress.percent} />
                  <ProgressLabel>{progress.status} {progress.percent > 0 ? `${progress.percent}%` : ''}</ProgressLabel>
                </ProgressWrap>
              ) : (
                <FitBadge $fit={model.fit}>
                  {model.fit === 'recommended' ? 'Recommended' :
                   model.fit === 'compatible'  ? 'Compatible'  :
                   model.fit === 'risky'       ? 'Risky'       : 'Too large'}
                </FitBadge>
              )}

              {model.installed ? (
                <div style={{ display: 'flex', gap: 4 }}>
                  <Btn $variant={isSelected ? 'success' : 'primary'} onClick={() => handleSelect(model.id)}>
                    {isSelected ? '✓ Active' : 'Use'}
                  </Btn>
                  <Btn $variant="ghost" onClick={() => handleDelete(model.id)}>✕</Btn>
                </div>
              ) : (
                <Btn
                  onClick={() => handlePull(model.id)}
                  disabled={model.fit === 'incompatible' || !!isPulling}
                >
                  {isPulling ? '...' : 'Install'}
                </Btn>
              )}
            </ModelRow>
          );
        })}
      </ModelList>

      {store.otherInstalled.length > 0 && (
        <>
          <SectionLabel>Other Installed</SectionLabel>
          {store.otherInstalled.map(name => (
            <OtherRow key={name}>
              <span>{name}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn $variant={store.selectedModel === name ? 'success' : 'primary'} onClick={() => handleSelect(name)}>
                  {store.selectedModel === name ? '✓ Active' : 'Use'}
                </Btn>
                <Btn $variant="ghost" onClick={() => handleDelete(name)}>✕</Btn>
              </div>
            </OtherRow>
          ))}
        </>
      )}
    </Container>
  );
};
