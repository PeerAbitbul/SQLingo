import styled from 'styled-components';
import { useEffect, useCallback, useRef } from 'react';
import { useOllamaStore } from '../stores/ollamaStore';
import { fetchOllamaStatus, fetchCatalog, fetchInstalled, pullModel, deleteModel } from '../utils/ollamaApi';
import { showToast } from '../stores/toastStore';
import { OllamaInstallGuide } from './OllamaInstallGuide';
import { OllamaModelCard } from './OllamaModelCard';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
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

const SubTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => p.theme.colors.text};
  margin: 8px 0 4px;
`;

const HwGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const HwItem = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.colors.textSecondary};
  span {
    color: ${(p) => p.theme.colors.text};
    font-weight: 500;
  }
`;

const CatalogGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const OtherModelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: ${(p) => p.theme.colors.surface};
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: 6px;
  font-size: 13px;
  color: ${(p) => p.theme.colors.text};
`;

const SmallButton = styled.button<{ $variant?: 'danger' | 'primary' | 'success' }>`
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  color: #fff;
  background: ${({ $variant, theme }) =>
    $variant === 'danger'
      ? '#ef4444'
      : $variant === 'success'
        ? '#22c55e'
        : theme.colors.primary};
  &:hover { opacity: 0.85; }
`;

const POLL_INTERVAL = 10_000;

export const OllamaManager = () => {
  const store = useOllamaStore();
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  // ── Fetch status + catalog ─────────────────────────────────────────
  const refresh = useCallback(async () => {
    try {
      const status = await fetchOllamaStatus(store.baseUrl);
      store.setRunning(status.running, status.version);

      if (status.running) {
        const catalog = await fetchCatalog(store.baseUrl);
        store.setHardware(catalog.hardware);

        // Mark installed models
        const installed = await fetchInstalled(store.baseUrl);
        store.setInstalledModels(installed.models);

        const gemmaWithInstalled = catalog.gemma.map((m) => ({
          ...m,
          installed: installed.models.includes(m.id),
        }));
        store.setCatalog(gemmaWithInstalled, catalog.other_installed);
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

  // ── Pull handler ──────────────────────────────────────────────────
  const handlePull = useCallback(
    async (modelId: string) => {
      try {
        await pullModel(
          modelId,
          (progress) => {
            store.updatePullProgress(modelId, progress);
            if (progress.done && !progress.error) {
              showToast.success(`${modelId} installed successfully`);
              store.clearPullProgress(modelId);
              refresh();
            }
            if (progress.error) {
              showToast.error(`Pull failed: ${progress.error}`);
              store.clearPullProgress(modelId);
            }
          },
          store.baseUrl
        );
      } catch (e: any) {
        showToast.error(e.message || 'Pull failed');
        store.clearPullProgress(modelId);
      }
    },
    [store.baseUrl, refresh]
  );

  // ── Delete handler ────────────────────────────────────────────────
  const handleDelete = useCallback(
    async (modelId: string) => {
      if (!confirm(`Delete ${modelId}? You can re-install it later.`)) return;
      try {
        await deleteModel(modelId, store.baseUrl);
        showToast.success(`${modelId} deleted`);
        if (store.selectedModel === modelId) store.setSelectedModel(null);
        refresh();
      } catch (e: any) {
        showToast.error(e.message || 'Delete failed');
      }
    },
    [store.baseUrl, store.selectedModel, refresh]
  );

  // ── Select handler ────────────────────────────────────────────────
  const handleSelect = useCallback(
    (modelId: string) => {
      store.setSelectedModel(modelId);
      showToast.success(`Using ${modelId} for Ollama chats`);
    },
    []
  );

  // ── Not running → install guide ───────────────────────────────────
  if (!store.running) {
    return (
      <Container>
        <OllamaInstallGuide />
      </Container>
    );
  }

  // ── Running → hardware + catalog ──────────────────────────────────
  const hw = store.hardware;

  return (
    <Container>
      <StatusRow>
        <StatusDot $online />
        <StatusText>
          Ollama v{store.version} running
        </StatusText>
      </StatusRow>

      {hw && (
        <>
          <SubTitle>Hardware</SubTitle>
          <HwGrid>
            <HwItem>
              OS: <span>{hw.os} ({hw.arch})</span>
            </HwItem>
            <HwItem>
              RAM: <span>{hw.total_ram_gb} GB</span>
            </HwItem>
            <HwItem>
              CPU Cores: <span>{hw.cpu_count}</span>
            </HwItem>
            {hw.is_apple_silicon && (
              <HwItem>
                Apple Silicon: <span>Yes (unified memory)</span>
              </HwItem>
            )}
          </HwGrid>
        </>
      )}

      <SubTitle>Gemma 4 Models</SubTitle>
      <CatalogGrid>
        {store.gemmaCatalog.map((model) => (
          <OllamaModelCard
            key={model.id}
            model={model}
            progress={store.pullProgress[model.id]}
            onPull={handlePull}
            onDelete={handleDelete}
            onSelect={handleSelect}
            isSelected={store.selectedModel === model.id}
          />
        ))}
      </CatalogGrid>

      {store.otherInstalled.length > 0 && (
        <>
          <SubTitle>Other Installed Models</SubTitle>
          {store.otherInstalled.map((name) => (
            <OtherModelRow key={name}>
              <span>{name}</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <SmallButton
                  $variant={store.selectedModel === name ? 'success' : 'primary'}
                  onClick={() => handleSelect(name)}
                >
                  {store.selectedModel === name ? 'Selected' : 'Use'}
                </SmallButton>
                <SmallButton $variant="danger" onClick={() => handleDelete(name)}>
                  Delete
                </SmallButton>
              </div>
            </OtherModelRow>
          ))}
        </>
      )}
    </Container>
  );
};
