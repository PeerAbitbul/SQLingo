import { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const ToastContainer = styled.div<{ $type: ToastType }>`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing.sm};
  padding: ${(props) => props.theme.spacing.md};
  background-color: ${(props) => {
    switch (props.$type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return props.theme.colors.surface;
    }
  }};
  color: #ffffff;
  border-radius: ${(props) => props.theme.borderRadius.md};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 300px;
  max-width: 500px;
  animation: ${slideIn} 0.3s ease-out;
  margin-bottom: ${(props) => props.theme.spacing.sm};
  position: relative;

  &.closing {
    animation: ${slideOut} 0.3s ease-out forwards;
  }
`;

const IconWrapper = styled.div`
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Message = styled.div`
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
`;

const TracebackBox = styled.pre`
  font-size: 10px;
  line-height: 1.4;
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 4px;
  padding: 6px 8px;
  white-space: pre-wrap;
  word-break: break-all;
  width: 100%;
`;

const ShowMoreBtn = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  font-size: 11px;
  padding: 4px 0 0;
  text-decoration: underline;
  text-underline-offset: 2px;
  &:hover { color: #fff; }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #ffffff;
  cursor: pointer;
  padding: ${(props) => props.theme.spacing.xs};
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

const getIcon = (type: ToastType): string => {
  switch (type) {
    case 'success': return '✓';
    case 'error': return '✕';
    case 'warning': return '⚠';
    case 'info': return 'ℹ';
    default: return 'ℹ';
  }
};

const TRACEBACK_SEP = '\n\n--- traceback ---\n';

export const Toast = ({ toast, onClose }: ToastProps) => {
  const hasTraceback = toast.message.includes(TRACEBACK_SEP);
  const [shortMsg, tracebackText] = hasTraceback
    ? toast.message.split(TRACEBACK_SEP)
    : [toast.message, null];
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (hasTraceback) {
      console.error('[SQLingo dev] Backend traceback:\n' + tracebackText);
    }
    const duration = hasTraceback ? 30000 : (toast.duration || 5000);
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose, hasTraceback, tracebackText]);

  return (
    <ToastContainer $type={toast.type} style={hasTraceback ? { maxWidth: 560, alignItems: 'flex-start' } : undefined}>
      <IconWrapper>{getIcon(toast.type)}</IconWrapper>
      <div style={{ flex: 1 }}>
        <Message>{shortMsg}</Message>
        {tracebackText && (
          <>
            <ShowMoreBtn onClick={() => setShowDetails(v => !v)}>
              {showDetails ? 'Hide details' : 'Show details'}
            </ShowMoreBtn>
            {showDetails && <TracebackBox>{tracebackText}</TracebackBox>}
          </>
        )}
      </div>
      <CloseButton onClick={() => onClose(toast.id)}>
        ✕
      </CloseButton>
    </ToastContainer>
  );
};

const ToastListContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
`;

interface ToastListProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export const ToastList = ({ toasts, onClose }: ToastListProps) => {
  return (
    <ToastListContainer>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </ToastListContainer>
  );
};
