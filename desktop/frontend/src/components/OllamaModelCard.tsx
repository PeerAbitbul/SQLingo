import styled from 'styled-components';
import type { GemmaModel, ModelFit, PullProgress } from '../stores/ollamaStore';

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: ${(p) => p.theme.colors.surface};
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: 8px;
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModelName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => p.theme.colors.text};
`;

const FitBadge = styled.span<{ $fit: ModelFit }>`
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 10px;
  color: #fff;
  background: ${({ $fit }) =>
    $fit === 'recommended'
      ? '#22c55e'
      : $fit === 'compatible'
        ? '#3b82f6'
        : $fit === 'risky'
          ? '#eab308'
          : '#ef4444'};
`;

const Meta = styled.div`
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: ${(p) => p.theme.colors.textSecondary};
`;

const Desc = styled.p`
  font-size: 12px;
  color: ${(p) => p.theme.colors.textSecondary};
  margin: 0;
  line-height: 1.4;
`;

const ActionButton = styled.button<{ $variant?: 'danger' | 'primary' | 'success' }>`
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
  color: #fff;
  background: ${({ $variant, theme }) =>
    $variant === 'danger'
      ? '#ef4444'
      : $variant === 'success'
        ? '#22c55e'
        : theme.colors.primary};
  &:hover {
    opacity: 0.85;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ProgressBarOuter = styled.div`
  width: 100%;
  height: 6px;
  background: ${(p) => p.theme.colors.border};
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressBarInner = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${(p) => p.$percent}%;
  background: ${(p) => p.theme.colors.primary};
  border-radius: 3px;
  transition: width 0.3s ease;
`;

const ProgressText = styled.span`
  font-size: 11px;
  color: ${(p) => p.theme.colors.textSecondary};
`;

const fitLabel: Record<ModelFit, string> = {
  recommended: 'Recommended',
  compatible: 'Compatible',
  risky: 'Risky',
  incompatible: 'Too large',
};

interface Props {
  model: GemmaModel;
  progress?: PullProgress;
  onPull: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
}

export const OllamaModelCard = ({
  model,
  progress,
  onPull,
  onDelete,
  onSelect,
  isSelected,
}: Props) => {
  const isPulling = progress && !progress.done;

  return (
    <Card>
      <TopRow>
        <ModelName>{model.name}</ModelName>
        <FitBadge $fit={model.fit}>{fitLabel[model.fit]}</FitBadge>
      </TopRow>

      <Meta>
        <span>{model.params}</span>
        <span>{model.size_gb} GB</span>
        <span>RAM: {model.ram_required_gb} GB</span>
      </Meta>

      <Desc>{model.description}</Desc>

      {isPulling && (
        <>
          <ProgressBarOuter>
            <ProgressBarInner $percent={progress.percent} />
          </ProgressBarOuter>
          <ProgressText>
            {progress.status} {progress.percent > 0 ? `${progress.percent}%` : ''}
          </ProgressText>
        </>
      )}

      <ButtonRow>
        {model.installed ? (
          <>
            <ActionButton
              $variant={isSelected ? 'success' : 'primary'}
              onClick={() => onSelect(model.id)}
            >
              {isSelected ? 'Selected' : 'Use'}
            </ActionButton>
            <ActionButton $variant="danger" onClick={() => onDelete(model.id)}>
              Delete
            </ActionButton>
          </>
        ) : (
          <ActionButton
            onClick={() => onPull(model.id)}
            disabled={model.fit === 'incompatible' || !!isPulling}
          >
            {isPulling ? 'Pulling...' : 'Install'}
          </ActionButton>
        )}
      </ButtonRow>
    </Card>
  );
};
