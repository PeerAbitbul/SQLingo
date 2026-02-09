import { useEffect } from 'react';
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

export const Toast = ({ toast, onClose }: ToastProps) => {
  useEffect(() => {
    const duration = toast.duration || 5000;
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  return (
    <ToastContainer $type={toast.type}>
      <IconWrapper>{getIcon(toast.type)}</IconWrapper>
      <Message>{toast.message}</Message>
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
