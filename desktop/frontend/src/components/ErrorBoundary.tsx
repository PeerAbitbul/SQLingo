import { Component, ErrorInfo, ReactNode } from 'react';
import styled from 'styled-components';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 32px;
  background-color: #ffffff;
  color: #1e293b;
`;

const ErrorIcon = styled.div`
  font-size: 64px;
  margin-bottom: 24px;
  color: #ef4444;
`;

const ErrorTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1e293b;
`;

const ErrorMessage = styled.p`
  font-size: 14px;
  color: #64748b;
  margin-bottom: 24px;
  text-align: center;
  max-width: 500px;
  line-height: 1.6;
`;

const ErrorDetails = styled.details`
  margin-top: 16px;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
  max-width: 600px;
  width: 100%;
`;

const ErrorDetailsSummary = styled.summary`
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #3b82f6;
  user-select: none;

  &:hover {
    opacity: 0.8;
  }
`;

const ErrorStack = styled.pre`
  margin-top: 16px;
  padding: 16px;
  background-color: #ffffff;
  border-radius: 4px;
  font-size: 12px;
  color: #64748b;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const ResetButton = styled.button`
  padding: 8px 24px;
  background-color: #3b82f6;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:active {
    opacity: 0.8;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 24px;
`;

const SecondaryButton = styled(ResetButton)`
  background-color: #f8fafc;
  color: #1e293b;
  border: 1px solid #e2e8f0;
`;

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <ErrorContainer>
          <ErrorIcon>⚠️</ErrorIcon>
          <ErrorTitle>Something went wrong</ErrorTitle>
          <ErrorMessage>
            The application encountered an unexpected error. Don't worry - your data is safe.
            You can try to reset the view or reload the application.
          </ErrorMessage>

          <ButtonGroup>
            <ResetButton onClick={this.handleReset}>
              Try Again
            </ResetButton>
            <SecondaryButton onClick={this.handleReload}>
              Reload App
            </SecondaryButton>
          </ButtonGroup>

          {this.state.error && (
            <ErrorDetails>
              <ErrorDetailsSummary>Show Error Details</ErrorDetailsSummary>
              <div>
                <strong>Error:</strong> {this.state.error.toString()}
                {this.state.error.message && (
                  <ErrorStack>{this.state.error.message}</ErrorStack>
                )}
                {this.state.error.stack && (
                  <ErrorStack>{this.state.error.stack}</ErrorStack>
                )}
                {this.state.errorInfo && this.state.errorInfo.componentStack && (
                  <>
                    <strong style={{ marginTop: '16px', display: 'block' }}>
                      Component Stack:
                    </strong>
                    <ErrorStack>{this.state.errorInfo.componentStack}</ErrorStack>
                  </>
                )}
              </div>
            </ErrorDetails>
          )}
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
