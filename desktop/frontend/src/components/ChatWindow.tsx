import styled from 'styled-components';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useChatStore } from '../stores/chatStore';
import { useConnectionStore } from '../stores/connectionStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useAPIKeyStore } from '../stores/apiKeyStore';
import { ChatHeader } from './ChatHeader';
import { ChatSidebar } from './ChatSidebar';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { Settings } from './Settings';
import { ConnectionManager } from './ConnectionManager';
import { APIKeyManager } from './APIKeyManager';
import { analyzeExecutionPlan, ExecutionPlanAnalysis } from '../utils/executionPlanApi';
import { showToast } from '../stores/toastStore';
import { withRetry, RetryPresets } from '../utils/retry';
import { logDebug } from '../utils/errorLogger';
import { getBackendUrl } from '../utils/portConfig';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background-color: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
`;

const MainContent = styled.div<{ $sidebarOpen: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: filter 0.3s ease;
  filter: ${(props) => (props.$sidebarOpen ? 'brightness(0.95)' : 'brightness(1)')};
`;

const ChatArea = styled.div<{ $isDragging?: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  ${(props) => props.$isDragging && `
    background: ${props.theme.colors.primary}08;
  `}
`;

const ConnectionBar = styled.div`
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.md};
  background-color: ${(props) => props.theme.colors.surface};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing.sm};
  font-size: 13px;
`;

const ConnectionLabel = styled.span`
  color: ${(props) => props.theme.colors.textSecondary};
`;

const ConnectionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing.xs};
  flex: 1;
`;

const DatabaseTypeIcon = styled.span<{ $type: string }>`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  color: white;
  background-color: ${(props) => {
    switch (props.$type) {
      case 'sqlserver':
        return '#CC2927';
      case 'postgresql':
        return '#336791';
      case 'mysql':
        return '#00758F';
      default:
        return '#666';
    }
  }};
`;

const DatabaseName = styled.span`
  color: ${(props) => props.theme.colors.text};
  font-weight: 600;
  font-size: 14px;
`;

const ConnectionName = styled.span`
  color: ${(props) => props.theme.colors.textSecondary};
  font-size: 12px;
`;

const Separator = styled.span`
  color: ${(props) => props.theme.colors.border};
  margin: 0 4px;
`;

const ChangeButton = styled.button`
  margin-left: auto;
  padding: 4px 12px;
  background-color: ${(props) => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: 12px;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

export const ChatWindow = () => {
  const { chats, activeChat, updateChat, addMessage, removeMessage } = useChatStore();
  const { getConnection, buildConnectionString } = useConnectionStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConnectionManagerOpen, setIsConnectionManagerOpen] = useState(false);
  const [isAPIKeyManagerOpen, setIsAPIKeyManagerOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzingPlan, setIsAnalyzingPlan] = useState(false);

  const currentChat = chats.find((c) => c.id === activeChat);
  const currentConnection = currentChat?.connectionId
    ? getConnection(currentChat.connectionId)
    : null;

  const handleSelectConnection = () => {
    setIsConnectionManagerOpen(true);
  };

  const handleRunQuery = async (sql: string) => {
    if (!currentChat || !currentConnection) {
      showToast.warning('Please select a database connection');
      return;
    }

    try {
      const connectionString = buildConnectionString(currentConnection);

      showToast.info('Executing query...');

      // Use retry logic for query execution
      const API_BASE_URL = await getBackendUrl();
      const result = await withRetry(
        async () => {
          const response = await fetch(`${API_BASE_URL}/query/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              connection_string: connectionString,
              database_type: currentConnection.databaseType,
              sql_query: sql,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return await response.json();
        },
        {
          ...RetryPresets.query,
          onRetry: (_error, attempt) => {
            showToast.warning(`Query execution failed, retrying (attempt ${attempt})...`);
          },
        }
      );

      if (result.success) {
        // Find the message with this SQL and update it with results
        // Normalize SQL for comparison (remove extra whitespace)
        const normalizedSql = sql.trim().replace(/\s+/g, ' ');

        const updatedMessages = currentChat.messages.map((msg) => {
          const normalizedMsgSql = msg.sqlQuery?.trim().replace(/\s+/g, ' ');
          if (normalizedMsgSql === normalizedSql && msg.role === 'assistant') {
            return {
              ...msg,
              queryResults: {
                columns: result.columns,
                rows: result.rows,
              },
            };
          }
          return msg;
        });

        try {
          updateChat(currentChat.id, { messages: updatedMessages });
          showToast.success(`Query executed successfully (${result.rows.length} rows)`);
        } catch (updateError) {
          console.error('Failed to update chat with query results:', updateError);
          showToast.error('Query executed but failed to save results');
        }
      } else {
        showToast.error(`Query execution failed: ${result.error}`);
        // Add error message
        addMessage(currentChat.id, {
          id: uuidv4(),
          role: 'assistant',
          content: `Error executing query: ${result.error}`,
          timestamp: new Date(),
        });
      }
    } catch (error: any) {
      console.error('Failed to execute query:', error);
      const errorMsg = error?.message || String(error);
      showToast.error(`Failed to execute query: ${errorMsg}`);

      if (currentChat) {
        addMessage(currentChat.id, {
          id: uuidv4(),
          role: 'assistant',
          content: `Failed to execute query: ${errorMsg}`,
          timestamp: new Date(),
        });
      }
    }
  };

  // NEW: Handle .sqlplan file drop
  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (!currentChat) {
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    const sqlplanFile = files.find(f => f.name.endsWith('.sqlplan'));

    if (!sqlplanFile) {
      // User dropped unsupported file
      if (files.length > 0) {
        addMessage(currentChat.id, {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Only .sqlplan files are supported. Please drag a SQL Server execution plan file (.sqlplan) or paste the XML content into the input box.',
          timestamp: new Date(),
        });
      }
      return;
    }

    // Read and analyze .sqlplan file
    try {
      // Show user message (file dropped)
      addMessage(currentChat.id, {
        id: `user-${Date.now()}`,
        role: 'user',
        content: `Dropped file: ${sqlplanFile.name}`,
        timestamp: new Date(),
      });

      const xmlContent = await sqlplanFile.text();

      await analyzeExecutionPlanFromXML(xmlContent);
    } catch (error) {
      console.error('Failed to analyze execution plan:', error);
      addMessage(currentChat.id, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Failed to analyze execution plan: ${error}`,
        timestamp: new Date(),
      });
    } finally {
      setIsAnalyzingPlan(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // NEW: Analyze execution plan from XML
  const analyzeExecutionPlanFromXML = async (xmlContent: string) => {
    const chatId = currentChat?.id;
    if (!chatId) return;

    // Show analyzing message
    const analyzingMessageId = `analyzing-${Date.now()}`;
    addMessage(chatId, {
      id: analyzingMessageId,
      role: 'assistant',
      content: 'Analyzing execution plan...',
      timestamp: new Date(),
    });

    // Set analyzing state to block input
    setIsAnalyzingPlan(true);

    try {
      // Get settings and API keys
      const settings = useSettingsStore.getState();
      const apiKeyStore = useAPIKeyStore.getState();

      const defaultProvider = settings.defaultAIProvider || 'openai';

      // BYOK mode only - no managed mode
      const mode = 'byok';

      // Get API key and auth mode for selected provider
      const apiKey = apiKeyStore.getKeyForProvider(defaultProvider);
      const defaultModel = apiKeyStore.getModelForProvider(defaultProvider);
      const authMode = apiKeyStore.getAuthModeForProvider(defaultProvider);

      logDebug('Analyzing execution plan', {
        mode,
        provider: defaultProvider,
        model: defaultModel,
        hasApiKey: !!apiKey,
        xmlLength: xmlContent.length
      });

      // Call analysis API
      const analysis = await analyzeExecutionPlan(
        xmlContent,
        mode,
        defaultProvider,
        defaultModel,
        apiKey,
        undefined, // token
        undefined, // bedrockConfig
        authMode
      );

      logDebug('Analysis result received', {
        success: analysis.success,
        hasBottlenecks: analysis.bottlenecks?.length > 0,
        hasMissingIndexes: analysis.missing_indexes?.length > 0,
        hasRecommendations: analysis.recommendations?.length > 0
      });

      // Remove analyzing message
      removeMessage(chatId, analyzingMessageId);

      if (!analysis.success) {
        // Show error to user
        addMessage(chatId, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `Analysis failed: ${analysis.error || 'Unknown error'}`,
          timestamp: new Date(),
        });
        return;
      }

      // Create analysis result message
      const resultMessage = createAnalysisMessage(analysis);

      addMessage(chatId, {
        id: `result-${Date.now()}`,
        role: 'assistant',
        content: resultMessage,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Exception in analyzeExecutionPlanFromXML:', error);

      // Remove analyzing message on error too
      removeMessage(chatId, analyzingMessageId);

      // Show error to user
      addMessage(chatId, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
      });
    }
  };

  const createAnalysisMessage = (analysis: ExecutionPlanAnalysis): string => {
    const lines = [
      '# Execution Plan Analysis',
      '',
    ];

    if (analysis.summary) {
      lines.push('## Summary');
      lines.push(`- **Query Cost:** ${analysis.summary.total_cost.toFixed(4)}`);
      lines.push(`- **Total Operations:** ${analysis.summary.total_operations}`);
      lines.push(`- **Most Expensive:** ${analysis.summary.most_expensive_operation}`);
      lines.push('');

      if (analysis.summary.warnings && analysis.summary.warnings.length > 0) {
        lines.push('### Warnings');
        analysis.summary.warnings.forEach(w => {
          lines.push(`- ${w}`);
        });
        lines.push('');
      }
    }

    if (analysis.bottlenecks.length > 0) {
      lines.push('## Bottlenecks Found');
      lines.push('');
      analysis.bottlenecks.slice(0, 5).forEach((b, idx) => {
        const severityLabel = b.severity === 'high' ? 'HIGH' : b.severity === 'medium' ? 'MEDIUM' : 'LOW';
        lines.push(`### ${idx + 1}. ${b.operation_type} (${severityLabel})`);
        lines.push(`- **Cost:** ${b.cost_percentage.toFixed(1)}% of total`);
        lines.push(`- **Description:** ${b.description}`);
        lines.push('');
      });
    }

    if (analysis.missing_indexes.length > 0) {
      lines.push('## Missing Indexes');
      lines.push('');
      analysis.missing_indexes.forEach((idx, i) => {
        lines.push(`### ${i + 1}. ${idx.table_name}`);
        lines.push(`- **Impact:** ${idx.impact.toFixed(0)}% (${idx.estimated_improvement})`);
        if (idx.equality_columns.length > 0) {
          lines.push(`- **Equality Columns:** ${idx.equality_columns.join(', ')}`);
        }
        if (idx.inequality_columns.length > 0) {
          lines.push(`- **Inequality Columns:** ${idx.inequality_columns.join(', ')}`);
        }
        if (idx.included_columns.length > 0) {
          lines.push(`- **Include Columns:** ${idx.included_columns.join(', ')}`);
        }
        lines.push('');
      });
    }

    if (analysis.recommendations.length > 0) {
      lines.push('## Recommendations');
      lines.push('');
      analysis.recommendations.forEach((rec, idx) => {
        lines.push(`${idx + 1}. ${rec}`);
      });
      lines.push('');
    }

    if (analysis.ai_insights) {
      lines.push('## AI Insights');
      lines.push('');
      lines.push(analysis.ai_insights);
    }

    return lines.join('\n');
  };

  return (
    <Container>
      <ChatHeader
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      <ChatSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onSettingsClick={() => setIsSettingsOpen(true)}
        onAPIKeysClick={() => setIsAPIKeyManagerOpen(true)}
        onConnectionsClick={() => setIsConnectionManagerOpen(true)}
      />

      <MainContent $sidebarOpen={isSidebarOpen}>
        {currentChat ? (
          <ChatArea
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            $isDragging={isDragging}
          >
            <ConnectionBar>
              <ConnectionLabel>Connection:</ConnectionLabel>
              {currentConnection ? (
                <ConnectionInfo>
                  <DatabaseTypeIcon $type={currentConnection.databaseType}>
                    {currentConnection.databaseType === 'sqlserver' && 'MS'}
                    {currentConnection.databaseType === 'postgresql' && 'PG'}
                    {currentConnection.databaseType === 'mysql' && 'MY'}
                  </DatabaseTypeIcon>
                  <DatabaseName>{currentConnection.database}</DatabaseName>
                  <Separator>•</Separator>
                  <ConnectionName>{currentConnection.name}</ConnectionName>
                </ConnectionInfo>
              ) : (
                <ConnectionInfo>
                  <ConnectionName style={{ color: '#999' }}>
                    No connection selected
                  </ConnectionName>
                </ConnectionInfo>
              )}
              <ChangeButton onClick={handleSelectConnection}>
                {currentConnection ? 'Change' : 'Select Connection'}
              </ChangeButton>
            </ConnectionBar>

            {isDragging && (
              <DragOverlay>
                <DropZoneIcon>📄</DropZoneIcon>
                <DropZoneText>Drop .sqlplan file here to analyze</DropZoneText>
              </DragOverlay>
            )}

            <ChatMessages
              messages={currentChat.messages}
              onRunQuery={handleRunQuery}
            />
            <ChatInput chatId={currentChat.id} isAnalyzingPlan={isAnalyzingPlan} />
          </ChatArea>
        ) : (
          <EmptyState>
            <EmptyText>No active chat. Open sidebar and create a new chat.</EmptyText>
          </EmptyState>
        )}
      </MainContent>

      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ConnectionManager
        isOpen={isConnectionManagerOpen}
        onClose={() => setIsConnectionManagerOpen(false)}
        onSelectConnection={(connectionId) => {
          if (currentChat) {
            updateChat(currentChat.id, { connectionId });
          }
          setIsConnectionManagerOpen(false);
        }}
      />
      <APIKeyManager
        isOpen={isAPIKeyManagerOpen}
        onClose={() => setIsAPIKeyManagerOpen(false)}
      />
    </Container>
  );
};

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const EmptyText = styled.p`
  color: ${(props) => props.theme.colors.textSecondary};
  font-size: 14px;
`;

// NEW: Drag & Drop Overlay Styles
const DragOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${(props) => props.theme.colors.primary}15;
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  pointer-events: none;
  border: 3px dashed ${(props) => props.theme.colors.primary};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  margin: ${(props) => props.theme.spacing.md};
`;

const DropZoneIcon = styled.div`
  font-size: 64px;
  margin-bottom: ${(props) => props.theme.spacing.md};
  animation: bounce 1s infinite;

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
`;

const DropZoneText = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.primary};
`;

