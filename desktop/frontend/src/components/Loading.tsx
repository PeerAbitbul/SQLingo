import styled, { keyframes } from 'styled-components';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullScreen?: boolean;
}

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const LoadingContainer = styled.div<{ $fullScreen?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${(props) => props.theme.spacing.md};
  ${(props) => props.$fullScreen && `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 9998;
  `}
`;

const Spinner = styled.div<{ $size: 'small' | 'medium' | 'large' }>`
  border: ${(props) => {
    switch (props.$size) {
      case 'small': return '2px';
      case 'medium': return '3px';
      case 'large': return '4px';
      default: return '3px';
    }
  }} solid ${(props) => props.theme.colors.border};
  border-top: ${(props) => {
    switch (props.$size) {
      case 'small': return '2px';
      case 'medium': return '3px';
      case 'large': return '4px';
      default: return '3px';
    }
  }} solid ${(props) => props.theme.colors.primary};
  border-radius: 50%;
  width: ${(props) => {
    switch (props.$size) {
      case 'small': return '20px';
      case 'medium': return '40px';
      case 'large': return '60px';
      default: return '40px';
    }
  }};
  height: ${(props) => {
    switch (props.$size) {
      case 'small': return '20px';
      case 'medium': return '40px';
      case 'large': return '60px';
      default: return '40px';
    }
  }};
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.div<{ $fullScreen?: boolean }>`
  font-size: 14px;
  color: ${(props) => props.$fullScreen ? '#ffffff' : props.theme.colors.textSecondary};
  font-weight: 500;
`;

export const Loading = ({ size = 'medium', text, fullScreen = false }: LoadingProps) => {
  return (
    <LoadingContainer $fullScreen={fullScreen}>
      <Spinner $size={size} />
      {text && <LoadingText $fullScreen={fullScreen}>{text}</LoadingText>}
    </LoadingContainer>
  );
};

// Inline loading component for buttons or small spaces
const InlineLoadingContainer = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing.xs};
`;

const SmallSpinner = styled(Spinner)`
  display: inline-block;
`;

interface InlineLoadingProps {
  text?: string;
}

export const InlineLoading = ({ text }: InlineLoadingProps) => {
  return (
    <InlineLoadingContainer>
      <SmallSpinner $size="small" />
      {text && <span>{text}</span>}
    </InlineLoadingContainer>
  );
};
