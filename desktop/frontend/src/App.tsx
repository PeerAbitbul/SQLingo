import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatWindow } from './components/ChatWindow';
import { ThemeProvider } from 'styled-components';
import { useThemeStore } from './stores/themeStore';
import { lightTheme, darkTheme } from './styles/theme';
import { ToastList } from './components/Toast';
import { UpdateBanner } from './components/UpdateBanner';
import { useToastStore } from './stores/toastStore';
import ErrorBoundary from './components/ErrorBoundary';
import { showToast } from './stores/toastStore';
import { logCritical } from './utils/errorLogger';
import { analytics } from './utils/analytics';

const queryClient = new QueryClient();

function App() {
  useEffect(() => { analytics.appOpen(); }, []);
  const { theme } = useThemeStore();
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const { toasts, removeToast } = useToastStore();

  // Handle errors caught by Error Boundary
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Show error toast
    showToast.error('Application error occurred. Please try again or reload the app.');

    // Log error with context
    logCritical('React Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      errorName: error.name,
      errorMessage: error.message,
    });
  };

  return (
    <ErrorBoundary onError={handleError}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={currentTheme}>
          <ChatWindow />
          <UpdateBanner />
          <ToastList toasts={toasts} onClose={removeToast} />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

