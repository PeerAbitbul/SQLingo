import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatWindow } from './components/ChatWindow';
import { ThemeProvider } from 'styled-components';
import { useThemeStore } from './stores/themeStore';
import { lightTheme, darkTheme } from './styles/theme';
import { ToastList } from './components/Toast';
import { ConfirmDialog } from './components/ConfirmDialog';
import { UpdateBanner } from './components/UpdateBanner';
import { useToastStore } from './stores/toastStore';
import ErrorBoundary from './components/ErrorBoundary';
import { showToast } from './stores/toastStore';
import { logCritical } from './utils/errorLogger';
import { analytics } from './utils/analytics';
import { apiClient } from './utils/api';
import { useChatStore } from './stores/chatStore';

const queryClient = new QueryClient();

function App() {
  useEffect(() => { 
    analytics.appOpen(); 

    // Agent Alerts Polling Background Loop
    const pollInterval = window.setInterval(async () => {
      try {
        // Check if agent system is active before polling
        const systemStatus = await apiClient.getAllAgents();
        if (systemStatus.master_paused) return; // Agents are off, skip polling

        const { messages, success } = await apiClient.getAgentMessages();
        if (success && messages && messages.length > 0) {
          const state = useChatStore.getState();
          const targetChat = state.activeChat || (state.chats.length > 0 ? state.chats[0].id : null);
          
          if (!targetChat) return; // No open chat yet to receive the message

          messages.forEach((msg: any) => {
            state.addMessage(targetChat, {
              id: msg.id,
              role: 'assistant',
              content: msg.content,
              timestamp: new Date(msg.created_at),
              isAgentAlert: true
            });
          });

          // Acknowledge these messages as received
          await apiClient.markAgentMessagesRead(messages.map((m: any) => m.id));
        }
      } catch (e) {
        // Silent fail (backend might be restarting or not ready)
      }
    }, 10000); // 10s poll rate

    return () => clearInterval(pollInterval);
  }, []);
  
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
          <ConfirmDialog />
          <ToastList toasts={toasts} onClose={removeToast} />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

