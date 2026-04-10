import styled from 'styled-components';
import { useState } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useConnectionStore } from '../stores/connectionStore';
import { useSettingsStore } from '../stores/settingsStore';
import { showDialog } from '../stores/dialogStore';

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSettingsClick: () => void;
  onAgentsClick: () => void;
  onAPIKeysClick: () => void;
  onConnectionsClick: () => void;
}

// Overlay - רקע שקוף שסוגר את הסיידבר
const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 40px;
  left: 0;
  width: 100vw;
  height: calc(100vh - 40px);
  background-color: rgba(0, 0, 0, 0.5);
  display: ${(props) => (props.$isOpen ? 'block' : 'none')};
  z-index: 99;
  cursor: pointer;
`;

// Sidebar - התפריט עצמו
const Sidebar = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 40px;
  left: 0;
  width: 280px;
  height: calc(100vh - 40px);
  background-color: ${(props) => props.theme.colors.surface};
  border-right: 1px solid ${(props) => props.theme.colors.border};
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  transform: translateX(${(props) => (props.$isOpen ? '0' : '-100%')});
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  margin: 0;
`;

const NewChatButton = styled.button`
  width: calc(100% - 24px);
  padding: 8px 12px;
  margin: 12px;
  background-color: ${(props) => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ChatList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
`;

const ChatItem = styled.div<{ $active: boolean }>`
  padding: 10px 12px;
  margin-bottom: 6px;
  background-color: ${(props) =>
    props.$active ? props.theme.colors.primary + '15' : 'transparent'};
  border: 1px solid ${(props) =>
    props.$active ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${(props) => props.theme.colors.background};
    border-color: ${(props) => props.theme.colors.primary};
  }
`;

const ChatTitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${(props) => props.theme.colors.text};
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ChatMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: ${(props) => props.theme.colors.textSecondary};
`;

const ConnectionBadge = styled.span`
  padding: 2px 8px;
  background-color: ${(props) => props.theme.colors.primary}20;
  color: ${(props) => props.theme.colors.primary};
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: ${(props) => props.theme.colors.error};
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${(props) => props.theme.colors.error}20;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const EmptyState = styled.div`
  padding: 32px 16px;
  text-align: center;
  color: ${(props) => props.theme.colors.textSecondary};
  font-size: 14px;
  line-height: 1.6;
`;

const ContextMenu = styled.div<{ $x: number; $y: number }>`
  position: fixed;
  left: ${(props) => props.$x}px;
  top: ${(props) => props.$y}px;
  background-color: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 150px;
  overflow: hidden;
`;

const MenuItem = styled.button`
  width: 100%;
  padding: 10px 16px;
  background: none;
  border: none;
  text-align: left;
  font-size: 13px;
  color: ${(props) => props.theme.colors.text};
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background-color: ${(props) => props.theme.colors.background};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const RenameInput = styled.input`
  width: 100%;
  padding: 8px;
  background-color: ${(props) => props.theme.colors.background};
  border: 1px solid ${(props) => props.theme.colors.primary};
  border-radius: 4px;
  color: ${(props) => props.theme.colors.text};
  font-size: 13px;
  font-family: inherit;
  outline: none;

  &:focus {
    border-color: ${(props) => props.theme.colors.primary};
  }
`;

const SidebarFooter = styled.div`
  padding: 10px 12px;
  border-top: 1px solid ${(props) => props.theme.colors.border};
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  align-items: center;
  gap: 4px;
`;

const FooterIconButton = styled.button`
  width: 40px;
  height: 40px;
  padding: 0;
  background: none;
  border: 1px solid transparent;
  border-radius: 8px;
  color: ${(props) => props.theme.colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  position: relative;

  svg {
    width: 18px;
    height: 18px;
  }

  &::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%) scale(0.8);
    background-color: ${(props) => props.theme.colors.surface};
    color: ${(props) => props.theme.colors.text};
    border: 1px solid ${(props) => props.theme.colors.border};
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s, transform 0.15s;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  &:hover::after {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }

  &:hover {
    background-color: ${(props) => props.theme.colors.background};
    border-color: ${(props) => props.theme.colors.primary};
    color: ${(props) => props.theme.colors.primary};
  }
`;

// Icons
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const DatabaseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
  </svg>
);

const KeyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

const RobotIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v1a4 4 0 0 1-4 4h-1v2H7v-2H6a4 4 0 0 1-4-4v-1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 12 2z"/>
    <path d="M8 13v.01M16 13v.01" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

export const ChatSidebar = ({ isOpen, onToggle, onSettingsClick, onAgentsClick, onAPIKeysClick, onConnectionsClick }: ChatSidebarProps) => {
  const { chats, activeChat, setActiveChat, addChat, removeChat, updateChat, lastUsedConnectionId } = useChatStore();
  const { getConnection } = useConnectionStore();
  const { defaultAIProvider } = useSettingsStore();
  const [contextMenu, setContextMenu] = useState<{ chatId: string; x: number; y: number } | null>(null);
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: `New Chat`,
      messages: [],
      createdAt: new Date(),
      connectionId: lastUsedConnectionId || undefined, // Use last connection if available
      aiProvider: defaultAIProvider, // Use default provider from settings
    };
    addChat(newChat);
    setActiveChat(newChat.id);
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChat(chatId);
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await showDialog.confirm({
      message: 'Delete this chat?',
      variant: 'danger',
    });
    if (ok) {
      removeChat(chatId);
    }
  };

  const handleContextMenu = (chatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ chatId, x: e.clientX, y: e.clientY });
  };

  const handleRename = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      setRenamingChatId(chatId);
      setRenameValue(chat.title);
      setContextMenu(null);
    }
  };

  const handleRenameSubmit = (chatId: string) => {
    if (renameValue.trim()) {
      updateChat(chatId, { title: renameValue.trim() });
    }
    setRenamingChatId(null);
    setRenameValue('');
  };

  const handleRenameKeyPress = (chatId: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit(chatId);
    } else if (e.key === 'Escape') {
      setRenamingChatId(null);
      setRenameValue('');
    }
  };

  // Close context menu when clicking outside
  const handleClickOutside = () => {
    setContextMenu(null);
  };

  return (
    <>
      <Overlay $isOpen={isOpen} onClick={onToggle} />
      <Sidebar $isOpen={isOpen} onClick={handleClickOutside}>
        <Header>
          <Title>Chats</Title>
        </Header>

        <NewChatButton onClick={handleNewChat}>
          <PlusIcon />
          New Chat
        </NewChatButton>

        <ChatList>
          {chats.length === 0 ? (
            <EmptyState>
              No chats yet.
              <br />
              Click "New Chat" to start.
            </EmptyState>
          ) : (
            chats.map((chat) => {
              const connection = chat.connectionId ? getConnection(chat.connectionId) : null;
              const isRenaming = renamingChatId === chat.id;
              
              return (
                <ChatItem
                  key={chat.id}
                  $active={chat.id === activeChat}
                  onClick={() => !isRenaming && handleSelectChat(chat.id)}
                  onContextMenu={(e) => handleContextMenu(chat.id, e)}
                >
                  {isRenaming ? (
                    <RenameInput
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => handleRenameKeyPress(chat.id, e)}
                      onBlur={() => handleRenameSubmit(chat.id)}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <ChatTitle>{chat.title}</ChatTitle>
                  )}
                  <ChatMeta>
                    {connection ? (
                      <ConnectionBadge>{connection.name}</ConnectionBadge>
                    ) : (
                      <span>No connection</span>
                    )}
                    <DeleteButton onClick={(e) => handleDeleteChat(chat.id, e)}>
                      <TrashIcon />
                    </DeleteButton>
                  </ChatMeta>
                </ChatItem>
              );
            })
          )}
        </ChatList>

        <SidebarFooter>
          <FooterIconButton onClick={onConnectionsClick} data-tooltip="Connections">
            <DatabaseIcon />
          </FooterIconButton>
          <FooterIconButton onClick={onAgentsClick} data-tooltip="Agents">
            <RobotIcon />
          </FooterIconButton>
          <FooterIconButton onClick={onAPIKeysClick} data-tooltip="API Keys">
            <KeyIcon />
          </FooterIconButton>
          <FooterIconButton onClick={onSettingsClick} data-tooltip="Settings">
            <SettingsIcon />
          </FooterIconButton>
        </SidebarFooter>
      </Sidebar>

      {contextMenu && (
        <ContextMenu $x={contextMenu.x} $y={contextMenu.y}>
          <MenuItem onClick={() => handleRename(contextMenu.chatId)}>
            <EditIcon />
            Rename
          </MenuItem>
          <MenuItem onClick={(e) => {
            setContextMenu(null);
            handleDeleteChat(contextMenu.chatId, e as any);
          }}>
            <TrashIcon />
            Delete
          </MenuItem>
        </ContextMenu>
      )}
    </>
  );
};
