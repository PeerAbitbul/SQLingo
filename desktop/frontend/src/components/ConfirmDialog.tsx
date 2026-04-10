import styled, { keyframes } from 'styled-components';
import { useDialogStore } from '../stores/dialogStore';

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: ${fadeIn} 0.15s ease-out;
`;

const Panel = styled.div`
  background: ${(p) => p.theme.colors.surface};
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.borderRadius.lg};
  padding: ${(p) => p.theme.spacing.xl};
  width: 380px;
  max-width: 90vw;
  box-shadow: ${(p) => p.theme.shadows.lg};
  animation: ${scaleIn} 0.15s ease-out;
`;

const Title = styled.h3`
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: ${(p) => p.theme.colors.text};
`;

const Message = styled.p`
  margin: 0 0 24px;
  font-size: 14px;
  line-height: 1.5;
  color: ${(p) => p.theme.colors.textSecondary};
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${(p) => p.theme.spacing.sm};
`;

const Btn = styled.button`
  padding: 8px 20px;
  border-radius: ${(p) => p.theme.borderRadius.md};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  border: none;
`;

const CancelBtn = styled(Btn)`
  background: ${(p) => p.theme.colors.background};
  border: 1px solid ${(p) => p.theme.colors.border};
  color: ${(p) => p.theme.colors.text};

  &:hover {
    background: ${(p) => p.theme.colors.surface};
  }
`;

const ConfirmBtn = styled(Btn)<{ $variant: 'danger' | 'default' }>`
  background: ${(p) =>
    p.$variant === 'danger' ? p.theme.colors.error : p.theme.colors.primary};
  color: #fff;

  &:hover {
    opacity: 0.9;
  }
`;

export function ConfirmDialog() {
  const { isOpen, title, message, confirmLabel, cancelLabel, variant, onConfirm, onCancel } =
    useDialogStore();

  if (!isOpen) return null;

  return (
    <Overlay onClick={() => onCancel?.()}>
      <Panel onClick={(e) => e.stopPropagation()}>
        {title && <Title>{title}</Title>}
        <Message>{message}</Message>
        <ButtonRow>
          {cancelLabel && onCancel && (
            <CancelBtn onClick={onCancel}>{cancelLabel}</CancelBtn>
          )}
          <ConfirmBtn $variant={variant} onClick={() => onConfirm?.()}>
            {confirmLabel}
          </ConfirmBtn>
        </ButtonRow>
      </Panel>
    </Overlay>
  );
}
