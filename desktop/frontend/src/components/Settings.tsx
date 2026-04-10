import styled from 'styled-components';
import { useState, useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useChatStore } from '../stores/chatStore';
import { useOllamaStore } from '../stores/ollamaStore';
import { OllamaManager } from './OllamaManager';
import errorLogger from '../utils/errorLogger';
import { showDialog } from '../stores/dialogStore';
import { showToast } from '../stores/toastStore';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${(props) => (props.$isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Panel = styled.div`
  background-color: ${(props) => props.theme.colors.background};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  padding: ${(props) => props.theme.spacing.xl};
  width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: ${(props) => props.theme.shadows.lg};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spacing.lg};
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${(props) => props.theme.colors.textSecondary};
  cursor: pointer;
  font-size: 24px;
  padding: ${(props) => props.theme.spacing.xs};
  
  &:hover {
    color: ${(props) => props.theme.colors.text};
  }
`;

const Section = styled.div`
  margin-bottom: ${(props) => props.theme.spacing.lg};
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  margin-bottom: ${(props) => props.theme.spacing.md};
`;

const SettingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${(props) => props.theme.spacing.md} 0;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  
  &:last-child {
    border-bottom: none;
  }
`;

const SettingLabel = styled.label`
  font-size: 14px;
  color: ${(props) => props.theme.colors.text};
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.xs};
`;

const SettingDescription = styled.span`
  font-size: 12px;
  color: ${(props) => props.theme.colors.textSecondary};
`;

const Toggle = styled.button<{ $active: boolean }>`
  width: 48px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background-color: ${(props) =>
    props.$active ? props.theme.colors.primary : props.theme.colors.border};
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
  
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${(props) => (props.$active ? '26px' : '2px')};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: white;
    transition: all 0.2s;
  }
`;

const Select = styled.select`
  padding: ${(props) => props.theme.spacing.sm};
  background-color: ${(props) => props.theme.colors.surface};
  color: ${(props) => props.theme.colors.text};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: 14px;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary};
  }
`;

const Input = styled.input`
  padding: ${(props) => props.theme.spacing.sm};
  background-color: ${(props) => props.theme.colors.surface};
  color: ${(props) => props.theme.colors.text};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: 14px;
  width: 200px;
  
  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary};
  }
`;

const Button = styled.button`
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.md};
  background-color: ${(props) => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    opacity: 0.9;
  }
`;

const DangerButton = styled(Button)`
  background-color: ${(props) => props.theme.colors.error};
`;

const SecondaryButton = styled(Button)`
  background-color: ${(props) => props.theme.colors.surface};
  color: ${(props) => props.theme.colors.text};
  border: 1px solid ${(props) => props.theme.colors.border};
`;

// Tier/Account styled components














export const Settings = ({ isOpen, onClose }: SettingsProps) => {
  const { theme, toggleTheme } = useThemeStore();
  const {
    alwaysOnTop,
    defaultAIProvider,
    retentionDays,
    maxMessagesPerChat,
    windowStartPosition,
    setAlwaysOnTop,
    setDefaultAIProvider,
    setRetentionDays,
    setMaxMessagesPerChat,
    setWindowStartPosition,
  } = useSettingsStore();


  const { chats, removeChat } = useChatStore();
  const { installedModels: ollamaModels } = useOllamaStore();

  const [localRetentionDays, setLocalRetentionDays] = useState(retentionDays.toString());
  const [localMaxMessages, setLocalMaxMessages] = useState(maxMessagesPerChat.toString());

  // Apply "Always on Top" setting to Electron window
  useEffect(() => {
    if (window.electron) {
      window.electron.setAlwaysOnTop(alwaysOnTop).catch((error) => {
        console.error('Failed to set always on top:', error);
        // Fail silently - this is a non-critical feature
      });
    }
  }, [alwaysOnTop]);

  // Handle start position change
  const handleStartPositionChange = (position: 'center' | 'left' | 'right') => {
    setWindowStartPosition(position);
    if (window.electron) {
      window.electron.setStartPosition(position).catch((error) => {
        console.error('Failed to set start position:', error);
        // Fail silently - this is a non-critical feature
      });
    }
  };

  const handleSaveRetention = () => {
    const days = parseInt(localRetentionDays);
    if (!isNaN(days) && days > 0) {
      setRetentionDays(days);
    }
  };

  const handleSaveMaxMessages = () => {
    const max = parseInt(localMaxMessages);
    if (!isNaN(max) && max > 0) {
      setMaxMessagesPerChat(max);
    }
  };

  const handleClearHistory = async () => {
    if (chats.length === 0) {
      await showDialog.alert({ message: 'No chat history to clear.' });
      return;
    }
    const ok = await showDialog.confirm({
      message: `Are you sure you want to clear all ${chats.length} chat(s)? This cannot be undone.`,
      variant: 'danger',
    });
    if (ok) {
      chats.forEach(chat => removeChat(chat.id));
      showToast.success('Chat history cleared!');
    }
  };

  return (
    <Overlay $isOpen={isOpen} onClick={onClose}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>Settings</Title>
          <CloseButton onClick={onClose}>×</CloseButton>
        </Header>

        <Section>
          <SectionTitle>Appearance</SectionTitle>
          <SettingRow>
            <SettingLabel>
              Theme
              <SettingDescription>Choose light or dark theme</SettingDescription>
            </SettingLabel>
            <Select value={theme} onChange={() => toggleTheme()}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </Select>
          </SettingRow>
          <SettingRow>
            <SettingLabel>
              Always on Top
              <SettingDescription>
                Keep window above other apps (restart may be required)
              </SettingDescription>
            </SettingLabel>
            <Toggle
              $active={alwaysOnTop}
              onClick={() => setAlwaysOnTop(!alwaysOnTop)}
              title={alwaysOnTop ? 'Disable always on top' : 'Enable always on top'}
            />
          </SettingRow>
          <SettingRow>
            <SettingLabel>
              Window Start Position
              <SettingDescription>
                Choose where the window appears when app starts (takes effect on next launch)
              </SettingDescription>
            </SettingLabel>
            <Select value={windowStartPosition} onChange={(e) => handleStartPositionChange(e.target.value as 'center' | 'left' | 'right')}>
              <option value="center">Center</option>
              <option value="left">Left Edge</option>
              <option value="right">Right Edge</option>
            </Select>
          </SettingRow>
        </Section>

        <Section>
          <SectionTitle>AI Settings</SectionTitle>
          <SettingRow>
            <SettingLabel>
              Default AI Provider
              <SettingDescription>Choose your preferred AI provider. Configure API keys and models in API Keys settings.</SettingDescription>
            </SettingLabel>
            <Select
              value={defaultAIProvider}
              onChange={(e) => setDefaultAIProvider(e.target.value as any)}
            >
              <option value="claude">Claude (Anthropic)</option>
              <option value="openai">GPT-4 (OpenAI)</option>
              <option value="gemini">Gemini (Google)</option>
              {ollamaModels.length > 0 && (
                <option value="ollama">Ollama (Local)</option>
              )}
            </Select>
          </SettingRow>
        </Section>

        {isOpen && (
          <Section>
            <SectionTitle>Local AI (Ollama)</SectionTitle>
            <OllamaManager />
          </Section>
        )}

        <Section>
          <SectionTitle>Data Management</SectionTitle>
          <SettingRow>
            <SettingLabel>
              Chat Retention (days)
              <SettingDescription>Auto-delete chats older than this</SettingDescription>
            </SettingLabel>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Input
                type="number"
                value={localRetentionDays}
                onChange={(e) => setLocalRetentionDays(e.target.value)}
                min="1"
              />
              <Button onClick={handleSaveRetention}>Save</Button>
            </div>
          </SettingRow>
          <SettingRow>
            <SettingLabel>
              Max Messages per Chat
              <SettingDescription>Limit messages to save space</SettingDescription>
            </SettingLabel>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Input
                type="number"
                value={localMaxMessages}
                onChange={(e) => setLocalMaxMessages(e.target.value)}
                min="1"
              />
              <Button onClick={handleSaveMaxMessages}>Save</Button>
            </div>
          </SettingRow>
          <SettingRow>
            <SettingLabel>
              Clear All History
              <SettingDescription>Delete all chats and messages</SettingDescription>
            </SettingLabel>
            <DangerButton onClick={handleClearHistory}>Clear History</DangerButton>
          </SettingRow>
        </Section>

        <Section>
          <SectionTitle>About</SectionTitle>
          <SettingRow>
            <SettingLabel>
              Version
              <SettingDescription>SQLingo Desktop</SettingDescription>
            </SettingLabel>
            <span style={{ fontSize: '14px', color: '#64748b' }}>0.1.0</span>
          </SettingRow>
        </Section>

        {/* Development Tools - Only shown in dev mode */}
        {import.meta.env.DEV && (
          <Section style={{ borderTop: '2px dashed #ef4444', marginTop: '20px', paddingTop: '20px' }}>
            <SectionTitle style={{ color: '#ef4444' }}>Development Tools</SectionTitle>
            <SettingRow>
              <SettingLabel>
                Download Error Logs
                <SettingDescription>Export all error logs as JSON</SettingDescription>
              </SettingLabel>
              <SecondaryButton onClick={() => errorLogger.downloadLogs()}>
                Download Logs
              </SecondaryButton>
            </SettingRow>
            <SettingRow>
              <SettingLabel>
                Clear Error Logs
                <SettingDescription>Remove all stored error logs</SettingDescription>
              </SettingLabel>
              <DangerButton onClick={() => {
                errorLogger.clearLogs();
                showToast.success('Error logs cleared');
              }}>
                Clear Logs
              </DangerButton>
            </SettingRow>
          </Section>
        )}
      </Panel>
    </Overlay>
  );
};

