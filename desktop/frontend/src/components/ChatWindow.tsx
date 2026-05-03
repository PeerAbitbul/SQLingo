import styled from 'styled-components';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useChatStore } from '../stores/chatStore';
import { useConnectionStore } from '../stores/connectionStore';
import { ChatHeader } from './ChatHeader';
import { ChatSidebar } from './ChatSidebar';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { Settings } from './Settings';
import { AgentsView } from './AgentsView';
import { ConnectionManager } from './ConnectionManager';
import { APIKeyManager } from './APIKeyManager';
import { showToast } from '../stores/toastStore';
import { apiClient } from '../utils/api';
import { withRetry, RetryPresets } from '../utils/retry';
import { getBackendUrl } from '../utils/portConfig';
import { showDialog } from '../stores/dialogStore';

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

const AIDisclaimer = styled.div`
  text-align: center;
  font-size: 11px;
  color: ${(props) => props.theme.colors.textSecondary};
  padding: 4px ${(props) => props.theme.spacing.md} 8px;
  background-color: ${(props) => props.theme.colors.surface};
`;

export const ChatWindow = () => {
  const { chats, activeChat, updateChat, addMessage, setLastUsedConnectionId } = useChatStore();
  const { getConnection, buildConnectionString } = useConnectionStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAgentsViewOpen, setIsAgentsViewOpen] = useState(false);
  const [isConnectionManagerOpen, setIsConnectionManagerOpen] = useState(false);
  const [isAPIKeyManagerOpen, setIsAPIKeyManagerOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFile, setDroppedFile] = useState<{ name: string; content: string } | null>(null);

  const currentChat = chats.find((c) => c.id === activeChat);
  const currentConnection = currentChat?.connectionId
    ? getConnection(currentChat.connectionId)
    : null;

  const handleSelectConnection = () => {
    setIsConnectionManagerOpen(true);
  };

  const handleFavorite = async (sql: string) => {
    const connId = currentChat?.connectionId;
    if (!connId) {
      showToast.warning('No connection selected — favorite saved without connection context');
    }
    try {
      // Extract a short title from the first line of SQL
      const firstLine = sql.trim().split('\n')[0].substring(0, 60);
      await apiClient.saveFavorite({
        connection_id: Number(connId) || 0,
        title: firstLine,
        sql_query: sql,
      });
      showToast.success('Query saved to favorites ⭐');
    } catch (err) {
      showToast.error('Failed to save favorite');
    }
  };

  const isWriteQuery = (sql: string): boolean => {
    const first = sql.trim().replace(/^--[^\n]*\n/gm, '').trim().toUpperCase();
    return /^(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|RENAME|REPLACE|MERGE|EXEC|EXECUTE|CALL)\b/.test(first);
  };

  const handleRunQuery = async (sql: string) => {
    if (!currentChat || !currentConnection) {
      showToast.warning('Please select a database connection');
      return;
    }

    const connectionString = buildConnectionString(currentConnection);

    // Write query path — confirm then execute-action
    if (isWriteQuery(sql)) {
      const confirmed = await showDialog.confirm({
        message: `This will execute a write operation on "${currentConnection.name}".\n\nAre you sure you want to proceed?`,
        variant: 'danger',
      });
      if (!confirmed) return;

      try {
        showToast.info('Executing...');
        const result = await apiClient.executeActionQuery({
          connection_string: connectionString,
          database_type: currentConnection.databaseType,
          sql_query: sql,
          connection_name: currentConnection.name,
        });

        if (result.success) {
          const rowsMsg = result.affected_rows > 0 ? ` (${result.affected_rows} rows affected)` : '';
          showToast.success(`Executed successfully${rowsMsg}`);
          addMessage(currentChat.id, {
            id: uuidv4(),
            role: 'assistant',
            content: `✓ Executed successfully${rowsMsg}`,
            timestamp: new Date(),
          });
        } else {
          showToast.error(`Execution failed: ${result.error}`);
          addMessage(currentChat.id, {
            id: uuidv4(),
            role: 'assistant',
            content: `Error executing query: ${result.error}`,
            timestamp: new Date(),
          });
        }
      } catch (error: any) {
        const errorMsg = error?.message || String(error);
        showToast.error(`Execution failed: ${errorMsg}`);
        addMessage(currentChat.id, {
          id: uuidv4(),
          role: 'assistant',
          content: `Error executing query: ${errorMsg}`,
          timestamp: new Date(),
        });
      }
      return;
    }

    // Read-only SELECT path
    try {
      const connectionString = buildConnectionString(currentConnection);

      showToast.info('Executing query...');

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
        const normalizedSql = sql.trim().replace(/\s+/g, ' ');
        const updatedMessages = currentChat.messages.map((msg) => {
          const normalizedMsgSql = msg.sqlQuery?.trim().replace(/\s+/g, ' ');
          if (normalizedMsgSql === normalizedSql && msg.role === 'assistant') {
            return { ...msg, queryResults: { columns: result.columns, rows: result.rows } };
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

    // Read file and pass to ChatInput for user to add context before sending
    try {
      const xmlContent = await sqlplanFile.text();
      setDroppedFile({ name: sqlplanFile.name, content: xmlContent });
    } catch (error) {
      console.error('Failed to read file:', error);
      showToast.error('Failed to read the file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
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
        onAgentsClick={() => setIsAgentsViewOpen(true)}
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
              onFavorite={handleFavorite}
            />
            <ChatInput
              chatId={currentChat.id}
              pendingFile={droppedFile}
              onFileConsumed={() => setDroppedFile(null)}
            />
            <AIDisclaimer>
              AI can make mistakes. Always verify SQL before running on production.
            </AIDisclaimer>
          </ChatArea>
        ) : (
          <EmptyState>
            <EmptyText>No active chat. Open sidebar and create a new chat.</EmptyText>
          </EmptyState>
        )}
      </MainContent>

      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <AgentsView isOpen={isAgentsViewOpen} onClose={() => setIsAgentsViewOpen(false)} />
      <ConnectionManager
        isOpen={isConnectionManagerOpen}
        onClose={() => setIsConnectionManagerOpen(false)}
        onSelectConnection={(connectionId) => {
          const { chats, activeChat: latestActiveChat } = useChatStore.getState();
          const latestChat = chats.find((c) => c.id === latestActiveChat);
          if (latestChat) {
            updateChat(latestChat.id, { connectionId });
          } else {
            setLastUsedConnectionId(connectionId);
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


