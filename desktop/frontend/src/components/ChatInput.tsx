import styled from 'styled-components';
import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useConnectionStore } from '../stores/connectionStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useAPIKeyStore } from '../stores/apiKeyStore';
import { apiClient } from '../utils/api';
import type { ChatResponse } from '../utils/api';
import { analyzeExecutionPlan, isExecutionPlanXML } from '../utils/executionPlanApi';
import { showToast } from '../stores/toastStore';
import { useOllamaStore } from '../stores/ollamaStore';
import { InlineLoading } from './Loading';
import { v4 as uuidv4 } from 'uuid';
import type { AIProvider } from '../types/aiProvider';

interface ChatInputProps {
  chatId: string;
  isAnalyzingPlan?: boolean;
  pendingFile?: { name: string; content: string } | null;
  onFileConsumed?: () => void;
}

const InputContainer = styled.div`
  position: relative;
  padding: ${(props) => props.theme.spacing.md};
  background-color: ${(props) => props.theme.colors.surface};
  border-top: 1px solid ${(props) => props.theme.colors.border};
`;

const ChatBox = styled.div`
  position: relative;
  background-color: ${(props) => props.theme.colors.background};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 16px;
  padding: 12px 12px 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: ${(props) => props.theme.colors.primary};
  }
`;

const BottomBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LeftActions = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const RightActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ProviderPill = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px 4px 7px;
  border-radius: 20px;
  border: 1px solid ${(props) => props.theme.colors.border};
  background: transparent;
  color: ${(props) => props.theme.colors.text};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;

  &:hover {
    background: ${(props) => props.theme.colors.surface};
  }
`;

const ProviderIconWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const PillModel = styled.span`
  color: ${(props) => props.theme.colors.textSecondary};
  font-weight: 400;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PillChevron = styled.span`
  font-size: 9px;
  color: ${(props) => props.theme.colors.textSecondary};
  margin-left: 1px;
`;

const SmallModelBadge = styled.span`
  font-size: 10px;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 4px;
  padding: 1px 5px;
  margin-left: 4px;
  font-weight: 500;
  white-space: nowrap;
  cursor: help;
`;

const ProviderDropdown = styled.div`
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  background: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 12px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 200;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  min-width: 230px;
`;

const ProviderOption = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  background: ${(props) => props.$active ? props.theme.colors.background : 'transparent'};
  color: ${(props) => props.theme.colors.text};
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;

  &:hover {
    background: ${(props) => props.theme.colors.background};
  }
`;

const ProviderOptionLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const ProviderOptionName = styled.span`
  font-weight: 500;
`;

const ProviderOptionModel = styled.span`
  font-size: 11px;
  color: ${(props) => props.theme.colors.textSecondary};
`;

const SendBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: ${(props) => props.theme.colors.primary};
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

const LoadingBar = styled.div`
  padding: 2px ${(props) => props.theme.spacing.xs} 4px;
  color: ${(props) => props.theme.colors.textSecondary};
  font-size: 11px;
  text-align: center;
`;

// Claude Logo (official claude.ai spark/asterisk logomark)
const ClaudeLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd">
    <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" />
  </svg>
);

// OpenAI Logo
const OpenAILogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
  </svg>
);

// Gemini Logo (Google AI style)
const GeminiLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

// AWS Bedrock Logo
const BedrockLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.82 8 12 11.82 4.18 8 12 4.18zM4 9.82l7 3.5v7.36l-7-3.5V9.82zm16 0v7.36l-7 3.5v-7.36l7-3.5z" />
  </svg>
);

// Ollama Logo (local AI)
const OllamaLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
  </svg>
);

const StyledTextarea = styled.textarea`
  background: transparent;
  border: none;
  outline: none;
  color: ${(props) => props.theme.colors.text};
  font-size: 14px;
  font-family: inherit;
  resize: none;
  min-height: 42px;
  max-height: 200px;
  overflow-y: auto;
  line-height: 1.5;
  width: 100%;

  &::placeholder {
    color: ${(props) => props.theme.colors.textSecondary};
  }
`;

const CommandMenuContainer = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 100%;
  background-color: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.2);
  margin-bottom: 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
  display: flex;
  flex-direction: column;
`;

const CommandItem = styled.div<{ $selected: boolean }>`
  padding: 10px 12px;
  cursor: pointer;
  background-color: ${(props) => props.$selected ? props.theme.colors.background : 'transparent'};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: ${(props) => props.theme.colors.background};
  }
`;

const CommandTitle = styled.div`
  font-weight: 600;
  font-size: 13px;
  color: ${(props) => props.theme.colors.text};
`;

const CommandDesc = styled.div`
  font-size: 11px;
  color: ${(props) => props.theme.colors.textSecondary};
  margin-top: 2px;
`;

const AttachBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid ${(props) => props.theme.colors.border};
  background: transparent;
  color: ${(props) => props.theme.colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: ${(props) => props.theme.colors.surface};
    color: ${(props) => props.theme.colors.text};
  }
`;

const AttachmentChip = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 8px;
  font-size: 12px;
  color: ${(props) => props.theme.colors.text};
  margin-bottom: 2px;
`;

const AttachmentRemove = styled.button`
  background: none;
  border: none;
  color: ${(props) => props.theme.colors.textSecondary};
  cursor: pointer;
  font-size: 14px;
  padding: 0 0 0 2px;
  line-height: 1;
  &:hover { color: ${(props) => props.theme.colors.text}; }
`;

const WRITE_KEYWORDS = /^\s*(insert|update|delete|drop|truncate|alter|create|replace|merge|upsert|exec|execute|call|grant|revoke|deny)\b/i;

function isReadOnlyQuery(sql: string): boolean {
  // Strip SQL comments and leading whitespace before checking
  const stripped = sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
  return !WRITE_KEYWORDS.test(stripped);
}

const SLASH_COMMANDS = [
  { cmd: '/permission mssql', desc: 'Show MSSQL minimum permissions' },
  { cmd: '/permission postgres', desc: 'Show PostgreSQL minimum permissions' },
  { cmd: '/permission mysql', desc: 'Show MySQL minimum permissions' },
  { cmd: '/telegram', desc: 'How to setup a Telegram Bot for alerts' }
];

export const ChatInput = ({ chatId, isAnalyzingPlan: isAnalyzingPlanProp, pendingFile, onFileConsumed }: ChatInputProps) => {
  const [input, setInput] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState(SLASH_COMMANDS);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; content: string }[]>([]);
  const [isAnalyzingPlanLocal, setIsAnalyzingPlanLocal] = useState(false);
  const [isComparingPlans, setIsComparingPlans] = useState(false);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [messageQueue, setMessageQueue] = useState<{ text: string; messageId: string }[]>([]);
  const [agentLoadingStage, setAgentLoadingStage] = useState<'running' | 'interpreting' | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { addMessage, chats, updateChat, updateMessage } = useChatStore();
  const { getConnection, buildConnectionString } = useConnectionStore();
  const { defaultAIProvider, bedrockAccessKey, bedrockSecretKey, bedrockRegion } = useSettingsStore();
  const { getKeyForProvider, getModelForProvider, getAuthModeForProvider } = useAPIKeyStore();
  const { selectedModel: ollamaSelectedModel, baseUrl: ollamaBaseUrl } = useOllamaStore();

  useEffect(() => {
    if (!showProviderDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProviderDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showProviderDropdown]);


  // Consume pending file from parent (drag & drop from ChatWindow)
  useEffect(() => {
    if (pendingFile) {
      setAttachedFiles([pendingFile]);
      onFileConsumed?.();
    }
  }, [pendingFile]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '42px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleBrowseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 2);
    if (files.length === 0) return;
    const readers = files.map(
      (file) =>
        new Promise<{ name: string; content: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve({ name: file.name, content: ev.target?.result as string });
          reader.readAsText(file);
        })
    );
    Promise.all(readers).then((results) => setAttachedFiles(results));
    e.target.value = '';
  };

  // Combine local and prop analyzing states
  const isAnalyzingPlan = isAnalyzingPlanProp || isAnalyzingPlanLocal;

  const handleExecutionPlanPaste = async (xmlContent: string, userQuestion?: string, fileName?: string) => {
    setIsAnalyzingPlanLocal(true);

    try {
      // Get current chat to access its AI provider
      const currentChat = chats.find((c) => c.id === chatId);
      if (!currentChat) {
        showToast.error('Chat not found');
        return;
      }

      // Get AI provider from chat or fall back to default
      const aiProvider = (currentChat.aiProvider || defaultAIProvider) as AIProvider;

      // Show user message — prefer what they typed, then filename, then generic
      // Store the XML in hiddenContent so follow-up questions have full context
      const userMsgContent = userQuestion
        || (fileName ? `Analyze execution plan: ${fileName}` : 'Analyze execution plan');
      addMessage(chatId, {
        id: uuidv4(),
        role: 'user',
        content: userMsgContent,
        hiddenContent: xmlContent,
        attachmentName: fileName,
        timestamp: new Date(),
      });

      // Clear input and reset textarea height
      setInput('');
      setShowCommands(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = '42px';
      }

      // Show analyzing message
      const analyzingMessageId = uuidv4();
      addMessage(chatId, {
        id: analyzingMessageId,
        role: 'assistant',
        content: 'Analyzing execution plan...',
        timestamp: new Date(),
      });

      // Get settings for analysis
      const apiKey = getKeyForProvider(aiProvider);
      const aiModel = aiProvider === 'ollama' ? (ollamaSelectedModel || undefined) : getModelForProvider(aiProvider);
      const planAuthMode = getAuthModeForProvider(aiProvider);

      // Get current connection info for context matching
      const connectedDatabase = currentChat.connectionId
        ? getConnection(currentChat.connectionId)?.database
        : undefined;
      const connectedDbType = currentChat.connectionId
        ? getConnection(currentChat.connectionId)?.databaseType
        : undefined;

      const analysis = await analyzeExecutionPlan(
        xmlContent,
        aiProvider,
        aiModel || undefined,
        apiKey || undefined,
        aiProvider === 'bedrock' && bedrockAccessKey && bedrockSecretKey
          ? {
            access_key: bedrockAccessKey,
            secret_key: bedrockSecretKey,
            region: bedrockRegion,
          }
          : undefined,
        planAuthMode,
        aiProvider === 'ollama' ? ollamaBaseUrl : undefined,
        connectedDatabase || undefined,
        connectedDbType || undefined,
      );

      // Remove analyzing message — use getState() to get fresh store (not stale closure)
      const freshChat = useChatStore.getState().chats.find((c) => c.id === chatId);
      if (freshChat) {
        const updatedMessages = freshChat.messages.filter(m => m.id !== analyzingMessageId);
        updateChat(chatId, { messages: updatedMessages });
      }

      if (!analysis.success) {
        addMessage(chatId, {
          id: uuidv4(),
          role: 'assistant',
          content: `Analysis failed: ${analysis.error || 'Unknown error'}`,
          timestamp: new Date(),
        });
        return;
      }

      // Create formatted analysis message
      const resultMessage = createAnalysisMessage(analysis);

      addMessage(chatId, {
        id: uuidv4(),
        role: 'assistant',
        content: resultMessage,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to analyze execution plan:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      showToast.error(`Failed to analyze execution plan: ${errorMessage}`);
      addMessage(chatId, {
        id: uuidv4(),
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
      });
    } finally {
      setIsAnalyzingPlanLocal(false);
    }
  };

  const handleCompareExecutionPlans = async (
    fileA: { name: string; content: string },
    fileB: { name: string; content: string },
    userQuestion?: string,
  ) => {
    setIsAnalyzingPlanLocal(true);
    setIsComparingPlans(true);
    try {
      const currentChat = chats.find((c) => c.id === chatId);
      if (!currentChat) { showToast.error('Chat not found'); return; }

      const aiProvider = (currentChat.aiProvider || defaultAIProvider) as AIProvider;
      const apiKey = getKeyForProvider(aiProvider);
      const aiModel = aiProvider === 'ollama' ? (ollamaSelectedModel || undefined) : getModelForProvider(aiProvider);
      const planAuthMode = getAuthModeForProvider(aiProvider);

      addMessage(chatId, {
        id: uuidv4(),
        role: 'user',
        content: userQuestion || `Compare execution plans: ${fileA.name} vs ${fileB.name}`,
        attachmentName: `${fileA.name} vs ${fileB.name}`,
        timestamp: new Date(),
      });
      setInput('');
      setShowCommands(false);
      if (textareaRef.current) textareaRef.current.style.height = '42px';

      const comparingMsgId = uuidv4();
      addMessage(chatId, {
        id: comparingMsgId,
        role: 'assistant',
        content: 'Comparing execution plans...',
        timestamp: new Date(),
      });

      const analysis = await analyzeExecutionPlan(
        fileA.content,
        aiProvider,
        aiModel || undefined,
        apiKey || undefined,
        aiProvider === 'bedrock' && bedrockAccessKey && bedrockSecretKey
          ? { access_key: bedrockAccessKey, secret_key: bedrockSecretKey, region: bedrockRegion }
          : undefined,
        planAuthMode,
        aiProvider === 'ollama' ? ollamaBaseUrl : undefined,
        undefined,
        undefined,
        fileB.content,
      );

      const freshChat = useChatStore.getState().chats.find((c) => c.id === chatId);
      if (freshChat) {
        updateChat(chatId, { messages: freshChat.messages.filter(m => m.id !== comparingMsgId) });
      }

      addMessage(chatId, {
        id: uuidv4(),
        role: 'assistant',
        content: analysis.success
          ? `# Execution Plan Comparison\n\n${analysis.ai_insights || createAnalysisMessage(analysis)}`
          : `Comparison failed: ${analysis.error || 'Unknown error'}`,
        timestamp: new Date(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showToast.error(`Comparison failed: ${errorMessage}`);
      addMessage(chatId, { id: uuidv4(), role: 'assistant', content: `Error: ${errorMessage}`, timestamp: new Date() });
    } finally {
      setIsAnalyzingPlanLocal(false);
      setIsComparingPlans(false);
    }
  };

  const createAnalysisMessage = (analysis: any): string => {
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
        analysis.summary.warnings.forEach((w: string) => {
          lines.push(`- ${w}`);
        });
        lines.push('');
      }
    }

    if (analysis.bottlenecks.length > 0) {
      lines.push('## Bottlenecks Found');
      lines.push('');
      analysis.bottlenecks.slice(0, 5).forEach((b: any, idx: number) => {
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
      analysis.missing_indexes.forEach((idx: any, i: number) => {
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
      analysis.recommendations.forEach((rec: string, idx: number) => {
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

  const handleSlashCommand = (cmdText: string) => {
    const parts = cmdText.split(' ').map(p => p.trim()).filter(Boolean);
    const command = parts[0].toLowerCase();

    // Store input and clear quickly
    setInput('');
    setShowCommands(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = '42px';
    }

    addMessage(chatId, {
      id: uuidv4(),
      role: 'user',
      content: cmdText,
      timestamp: new Date(),
    });

    if (command === '/permission' || command === '/permissions') {
      const dbType = parts[1]?.toLowerCase();
      let responseContent = '';

      if (!dbType) {
        responseContent = `Please specify the database type. Usage: \`/permission [mssql | postgres | mysql]\`\n\nFor example:\n\`/permission mssql\``;
      } else if (dbType === 'mssql' || dbType === 'sqlserver') {
        responseContent = `### MSSQL Minimum Permissions
* **Data Reading:** Requires \`db_datareader\` role membership.
* **Schema Extraction:** Strongly recommended to \`GRANT VIEW DEFINITION\` to read full definitions of constraints, views, and procedures.
* *(Optional - for Execution Plans)*: \`GRANT SHOWPLAN\`.`;
      } else if (dbType === 'postgres' || dbType === 'postgresql') {
        responseContent = `### PostgreSQL Minimum Permissions
* **Base Connection:** \`GRANT CONNECT ON DATABASE db_name TO user_name;\`
* **Schema Access:** \`GRANT USAGE ON SCHEMA public TO user_name;\`
* **Data Reading:** \`GRANT SELECT ON ALL TABLES IN SCHEMA public TO user_name;\`
*(Access to information_schema is granted by default)*`;
      } else if (dbType === 'mysql') {
        responseContent = `### MySQL Minimum Permissions
* **Data and Schema Reading:** \`GRANT SELECT ON database_name.* TO 'user'@'%';\`
*(In MySQL, schema metadata access in information_schema is derived from SELECT permissions)*`;
      } else {
        responseContent = `Unknown database type: **${dbType}**. Please use \`mssql\`, \`postgres\`, or \`mysql\`.`;
      }

      addMessage(chatId, {
        id: uuidv4(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      });
      return;
    }
    
    if (command === '/telegram') {
      const responseContent = `### 🤖 Telegram Bot Setup Guide
To allow SQLingo's Autonomous Agent to send you alerts, you need your own Telegram Bot. It takes 1 minute:

1. Open Telegram and search for the official **@BotFather**.
2. Send the message \`/newbot\` and give it a name to receive your **HTTP API Token**.
3. Search for **@userinfobot** (or forward a message to @getidsbot) to find your personal numeric **Chat ID**.
4. *(Coming Soon)* You will be able to paste these details directly into the "Create Agent" panel.

*Keep your token private!*`;

      addMessage(chatId, {
        id: uuidv4(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      });
      return;
    }

    addMessage(chatId, {
      id: uuidv4(),
      role: 'assistant',
      content: `Unknown command: ${command}`,
      timestamp: new Date(),
    });
  };

  const sendMessage = async (text: string, existingMessageId?: string) => {
    // Check if message contains execution plan XML
    if (isExecutionPlanXML(text)) {
      const xmlStart = text.indexOf('<?xml');
      const userQuestion = xmlStart > 0 ? text.slice(0, xmlStart).trim() : undefined;
      const xmlContent = xmlStart > 0 ? text.slice(xmlStart) : text;
      await handleExecutionPlanPaste(xmlContent, userQuestion);
      return;
    }

    const trimmedInput = text.trim();
    
    // Check if it's a slash command
    if (trimmedInput.startsWith('/')) {
      handleSlashCommand(trimmedInput);
      return;
    }

    // Get current chat (fetch once and reuse)
    const currentChat = chats.find((c) => c.id === chatId);
    if (!currentChat) {
      showToast.error('Chat not found');
      return;
    }

    // Check if connection is selected for this chat
    if (!currentChat.connectionId) {
      showToast.warning('Please select a database connection for this chat');
      return;
    }

    const connection = getConnection(currentChat.connectionId);
    if (!connection) {
      showToast.error('Connection not found');
      return;
    }

    // Get AI provider from chat or fall back to default
    const aiProvider = (currentChat.aiProvider || defaultAIProvider) as AIProvider;

    // Check credentials - need API key or access token (except for bedrock/ollama)
    let apiKey: string | undefined;
    const authMode = getAuthModeForProvider(aiProvider);

    if (aiProvider === 'ollama') {
      // Ollama runs locally - no API key needed, just check a model is selected
      if (!ollamaSelectedModel) {
        showToast.warning('Please select an Ollama model in Settings > Local AI');
        return;
      }
    } else if (aiProvider !== 'bedrock') {
      apiKey = getKeyForProvider(aiProvider);
      if (!apiKey) {
        const credLabel = authMode === 'access_token' ? 'access token' : 'API key';
        showToast.warning(`Please set your ${aiProvider.toUpperCase()} ${credLabel} in settings`);
        return;
      }
    }

    // Add user message (or activate a queued one)
    const userMessageId = existingMessageId || uuidv4();
    if (existingMessageId) {
      updateMessage(chatId, existingMessageId, { queued: false, timestamp: new Date() });
    } else {
      addMessage(chatId, { id: userMessageId, role: 'user', content: trimmedInput, timestamp: new Date() });
    }

    try {
      // Build connection string from connection details
      const connectionString = buildConnectionString(connection);

      // Get the model for the selected provider from API Key Store (or Ollama store)
      const aiModel = aiProvider === 'ollama' ? (ollamaSelectedModel || undefined) : getModelForProvider(aiProvider);

      // Get conversation history (last 10 messages for context)
      // Filter out error/system messages so they don't confuse small AI models
      // Append hiddenContent (e.g. execution plan XML) so follow-up questions have full context
      const conversationHistory = currentChat.messages
        .filter(msg => !(msg.role === 'assistant' && (
          msg.content.startsWith('Error:') ||
          msg.content.startsWith('Analysis failed') ||
          msg.content === 'Response generated successfully'
        )))
        .slice(-10)
        .map(msg => ({
          role: msg.role,
          content: msg.hiddenContent
            ? `${msg.content}\n\n${msg.hiddenContent}`
            : msg.content,
        }));

      // Stream SQL generation
      const streamingMsgId = uuidv4();
      addMessage(chatId, { id: streamingMsgId, role: 'assistant', content: '', timestamp: new Date() });
      setIsStreaming(true);

      let accumulated = '';
      let sqlResult: ChatResponse | null = null;
      let streamError: string | null = null;

      await apiClient.generateSQLStream(
        {
          question: trimmedInput,
          connection_string: connectionString,
          database_type: connection.databaseType,
          ai_provider: aiProvider,
          ai_model: aiModel,
          api_key: apiKey,
          auth_mode: authMode,
          bedrock_config: aiProvider === 'bedrock' && bedrockAccessKey && bedrockSecretKey
            ? { access_key: bedrockAccessKey, secret_key: bedrockSecretKey, region: bedrockRegion }
            : undefined,
          ollama_base_url: aiProvider === 'ollama' ? ollamaBaseUrl : undefined,
          conversation_history: conversationHistory,
        },
        {
          onToken: (token) => {
            accumulated += token;
            updateMessage(chatId, streamingMsgId, { content: accumulated });
          },
          onDone: (result) => { sqlResult = result; },
          onError: (msg) => { streamError = msg; },
        }
      );

      setIsStreaming(false);

      if (streamError || !sqlResult) {
        const errMsg = streamError || 'Failed to generate SQL';
        updateMessage(chatId, streamingMsgId, { content: `Error: ${errMsg}` });
        showToast.error(errMsg);
        return;
      }

      const finalResult = sqlResult as ChatResponse;

      if (!finalResult.success) {
        const errMsg = finalResult.error || 'Failed to generate SQL';
        const fullMsg = finalResult.traceback
          ? `${errMsg}\n\n--- traceback ---\n${finalResult.traceback}`
          : errMsg;
        updateMessage(chatId, streamingMsgId, { content: `Error: ${errMsg}` });
        showToast.error(fullMsg);
        return;
      }

      // Update message with final explanation and sqlQuery
      updateMessage(chatId, streamingMsgId, {
        content: finalResult.explanation,
        sqlQuery: finalResult.sql_query,
      });

      // If master switch is ON and SQL was generated, auto-execute + interpret
      let messageContent = finalResult.explanation;
      let autoQueryResults: { columns: string[]; rows: any[][] } | undefined;

      if (finalResult.sql_query && isReadOnlyQuery(finalResult.sql_query)) {
        try {
          const agentsStatus = await apiClient.getAllAgents();
          if (!agentsStatus.master_paused) {
            setAgentLoadingStage('running');
            const execResult = await apiClient.executeQuery({
              connection_string: connectionString,
              database_type: connection.databaseType,
              sql_query: finalResult.sql_query,
            });

            if (execResult.success) {
              autoQueryResults = { columns: execResult.columns, rows: execResult.rows };
              setAgentLoadingStage('interpreting');
              const interpResult = await apiClient.interpretResults({
                question: trimmedInput,
                sql_query: finalResult.sql_query,
                columns: execResult.columns,
                rows: execResult.rows,
                row_count: execResult.row_count,
                ai_provider: aiProvider,
                ai_model: aiModel,
                api_key: apiKey,
                auth_mode: authMode,
                bedrock_config: aiProvider === 'bedrock' && bedrockAccessKey && bedrockSecretKey
                  ? { access_key: bedrockAccessKey, secret_key: bedrockSecretKey, region: bedrockRegion }
                  : undefined,
                ollama_base_url: aiProvider === 'ollama' ? ollamaBaseUrl : undefined,
              });
              if (interpResult.success && interpResult.answer) {
                messageContent = interpResult.answer;
              }
            }
          }
        } catch {
          // Non-critical: if agent check/execute/interpret fails, fall back to SQL-only
        } finally {
          setAgentLoadingStage(null);
        }
      }

      updateMessage(chatId, streamingMsgId, {
        content: messageContent,
        sqlQuery: finalResult.sql_query,
        queryResults: autoQueryResults,
      });

      // Generate smart title if this is the first message
      // Use currentChat from above instead of fetching again
      if (currentChat.messages.length === 0) {
        try {
          const titleResult = await apiClient.generateChatTitle({
            question: trimmedInput,
            ai_provider: aiProvider,
            ai_model: aiModel,
            api_key: apiKey,
            auth_mode: authMode,
            bedrock_config: aiProvider === 'bedrock' && bedrockAccessKey && bedrockSecretKey
              ? {
                access_key: bedrockAccessKey,
                secret_key: bedrockSecretKey,
                region: bedrockRegion,
              }
              : undefined,
            ollama_base_url: aiProvider === 'ollama' ? ollamaBaseUrl : undefined,
          });

          if (titleResult.success && titleResult.title) {
            updateChat(chatId, { title: titleResult.title });
          }
        } catch (titleError) {
          console.error('Failed to generate title:', titleError);
          // Don't fail the whole operation if title generation fails
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to generate SQL';
      showToast.error(errorMsg);

      // Add error message to chat
      const errorMessage = {
        id: uuidv4(),
        role: 'assistant' as const,
        content: `Error: ${errorMsg}`,
        timestamp: new Date(),
      };
      addMessage(chatId, errorMessage);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    
    if (val.startsWith('/')) {
      const search = val.toLowerCase();
      const filtered = SLASH_COMMANDS.filter(c => c.cmd.startsWith(search));
      if (filtered.length > 0) {
        setFilteredCommands(filtered);
        setShowCommands(true);
        setSelectedIndex(0);
      } else {
        setShowCommands(false);
      }
    } else {
      setShowCommands(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showCommands) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredCommands.length - 1 ? prev + 1 : prev));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          handleSlashCommand(selected.cmd);
        }
        return;
      }
      if (e.key === 'Escape') {
        setShowCommands(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isLoading = isStreaming || isAnalyzingPlan || agentLoadingStage !== null;

  const handleSend = () => {
    if (!input.trim() && attachedFiles.length === 0) return;
    const typedText = input.trim();
    const files = attachedFiles;
    setInput('');
    setAttachedFiles([]);
    setShowCommands(false);
    if (textareaRef.current) textareaRef.current.style.height = '42px';

    if (files.length > 0) {
      if (isLoading) {
        showToast.warning('Please wait for the current request to finish before attaching a file');
        setAttachedFiles(files);
        if (typedText) setInput(typedText);
        return;
      }
      if (files.length === 2) {
        handleCompareExecutionPlans(files[0], files[1], typedText || undefined);
      } else {
        handleExecutionPlanPaste(files[0].content, typedText || undefined, files[0].name);
      }
      return;
    }

    // Plain text message
    if (!typedText) return;
    if (isLoading) {
      const queuedId = uuidv4();
      addMessage(chatId, { id: queuedId, role: 'user', content: typedText, timestamp: new Date(), queued: true });
      setMessageQueue(prev => [...prev, { text: typedText, messageId: queuedId }]);
      return;
    }
    sendMessage(typedText);
  };

  useEffect(() => {
    if (!isLoading && messageQueue.length > 0) {
      const [next, ...rest] = messageQueue;
      setMessageQueue(rest);
      setTimeout(() => sendMessage(next.text, next.messageId), 50);
    }
  }, [isLoading]);

  // Get current chat to access its AI provider
  const currentChat = chats.find((c) => c.id === chatId);
  const currentProvider = (currentChat?.aiProvider || defaultAIProvider || 'openai') as AIProvider;

  const handleProviderChange = (provider: AIProvider) => {
    if (currentChat) {
      updateChat(chatId, { aiProvider: provider });
    }
  };

  const PROVIDER_LIST: { id: AIProvider; name: string; icon: React.ReactNode; }[] = [
    { id: 'claude', name: 'Claude', icon: <ClaudeLogo /> },
    { id: 'openai', name: 'OpenAI', icon: <OpenAILogo /> },
    { id: 'gemini', name: 'Gemini', icon: <GeminiLogo /> },
    { id: 'bedrock', name: 'Bedrock', icon: <BedrockLogo /> },
    { id: 'openrouter', name: 'OpenRouter', icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )},
    { id: 'ollama', name: 'Ollama', icon: <OllamaLogo /> },
  ];

  const currentProviderInfo = PROVIDER_LIST.find(p => p.id === currentProvider);
  const currentModel = currentProvider === 'ollama'
    ? ollamaSelectedModel
    : getModelForProvider(currentProvider);
  const modelLabel = currentModel
    ? currentModel.length > 22 ? currentModel.slice(0, 22) + '…' : currentModel
    : null;

  const isSmallModel = (model: string | null): boolean => {
    if (!model) return false;
    const m = model.toLowerCase();
    return m.includes('flash-lite') || m.includes('flash') || m.includes('mini') ||
      m.includes('haiku') || m.includes('lite') || m.includes('nano') ||
      m.includes('3.5') || m.includes('small') || m.includes('1b') ||
      m.includes('3b') || m.includes('7b') || m.includes('8b');
  };

  return (
    <InputContainer>
      {isLoading && (
        <LoadingBar>
          {isAnalyzingPlan
            ? (isComparingPlans ? 'Comparing execution plans…' : 'Analyzing execution plan…')
            : agentLoadingStage === 'running' ? 'Running query…'
            : agentLoadingStage === 'interpreting' ? 'Interpreting results…'
            : 'Generating SQL…'}
        </LoadingBar>
      )}

      <ChatBox>
        {showCommands && (
          <CommandMenuContainer>
            {filteredCommands.map((cmd, idx) => (
              <CommandItem
                key={cmd.cmd}
                $selected={idx === selectedIndex}
                onClick={() => handleSlashCommand(cmd.cmd)}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <CommandTitle>{cmd.cmd}</CommandTitle>
                <CommandDesc>{cmd.desc}</CommandDesc>
              </CommandItem>
            ))}
          </CommandMenuContainer>
        )}

        {attachedFiles.map((f, i) => (
          <AttachmentChip key={i}>
            📎 {f.name}
            <AttachmentRemove onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))}>×</AttachmentRemove>
          </AttachmentChip>
        ))}

        <StyledTextarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={attachedFiles.length === 2 ? 'Compare plans — add a note (optional)…' : attachedFiles.length === 1 ? 'Add a message (optional)…' : 'Ask anything… (/ for commands, Shift+Enter for new line)'}
          rows={1}
        />

        <BottomBar>
          <LeftActions ref={dropdownRef}>
            <AttachBtn onClick={handleBrowseFile} title="Attach .sqlplan file">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </AttachBtn>

            <ProviderPill onClick={() => setShowProviderDropdown(prev => !prev)}>
              <ProviderIconWrapper>{currentProviderInfo?.icon}</ProviderIconWrapper>
              {currentProviderInfo?.name}
              {modelLabel && <PillModel> · {modelLabel}</PillModel>}
              {isSmallModel(currentModel) && (
                <SmallModelBadge title="Small models may struggle with complex queries, stored procedures, and multi-step requests. For best results, use a full-size model.">
                  ⚠ lite
                </SmallModelBadge>
              )}
              <PillChevron>▾</PillChevron>
            </ProviderPill>

            {showProviderDropdown && (
              <ProviderDropdown>
                {PROVIDER_LIST.map(p => {
                  const model = p.id === 'ollama'
                    ? ollamaSelectedModel
                    : getModelForProvider(p.id);
                  return (
                    <ProviderOption
                      key={p.id}
                      $active={currentProvider === p.id}
                      onClick={() => { handleProviderChange(p.id); setShowProviderDropdown(false); }}
                    >
                      <ProviderIconWrapper>{p.icon}</ProviderIconWrapper>
                      <ProviderOptionLabel>
                        <ProviderOptionName>{p.name}</ProviderOptionName>
                        {model && <ProviderOptionModel>{model}</ProviderOptionModel>}
                      </ProviderOptionLabel>
                    </ProviderOption>
                  );
                })}
              </ProviderDropdown>
            )}
          </LeftActions>

          <RightActions>
            <SendBtn onClick={handleSend} disabled={!input.trim() && attachedFiles.length === 0}>
              {isLoading ? <InlineLoading /> : messageQueue.length > 0 ? (
                <span style={{ fontSize: 10, fontWeight: 700 }}>+{messageQueue.length}</span>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </SendBtn>
          </RightActions>
        </BottomBar>

        <input
          ref={fileInputRef}
          type="file"
          accept=".sqlplan,.xml"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelected}
        />
      </ChatBox>
    </InputContainer>
  );
};

