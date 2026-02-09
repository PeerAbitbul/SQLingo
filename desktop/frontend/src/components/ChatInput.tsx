import styled from 'styled-components';
import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useConnectionStore } from '../stores/connectionStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useAPIKeyStore } from '../stores/apiKeyStore';
import { useGenerateSQL } from '../hooks/useAPI';
import { apiClient } from '../utils/api';
import { analyzeExecutionPlan, isExecutionPlanXML } from '../utils/executionPlanApi';
import { showToast } from '../stores/toastStore';
import { InlineLoading } from './Loading';
import { v4 as uuidv4 } from 'uuid';
import type { AIProvider } from '../types/aiProvider';
import { AI_PROVIDER_CONFIGS } from '../types/aiProvider';

interface ChatInputProps {
  chatId: string;
  isAnalyzingPlan?: boolean;
}

const InputContainer = styled.div`
  padding: ${(props) => props.theme.spacing.md};
  background-color: ${(props) => props.theme.colors.surface};
  border-top: 1px solid ${(props) => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.sm};
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 ${(props) => props.theme.spacing.xs};
`;

const ProviderSelectorCompact = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing.xs};
  align-items: center;
`;

const ProviderLabel = styled.span`
  font-size: 11px;
  color: ${(props) => props.theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
`;

const ProviderButton = styled.button<{ $active: boolean; $provider: AIProvider }>`
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid ${(props) => props.$active ? 'transparent' : props.theme.colors.border};
  background-color: ${(props) => {
    if (!props.$active) return 'transparent';
    return AI_PROVIDER_CONFIGS[props.$provider]?.color || props.theme.colors.primary;
  }};
  color: ${(props) => props.$active ? '#ffffff' : props.theme.colors.textSecondary};
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    ${(props) => !props.$active && `
      border-color: ${props.theme.colors.primary};
      color: ${props.theme.colors.text};
    `}
  }
`;

const ProviderIconWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

// Claude Logo (Anthropic style)
const ClaudeLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
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

const InputWrapper = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing.sm};
  align-items: flex-end;
`;

const Input = styled.textarea`
  flex: 1;
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.md};
  background-color: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  font-size: 14px;
  outline: none;
  font-family: inherit;
  resize: none;
  min-height: 42px;
  max-height: 200px;
  overflow-y: auto;
  line-height: 1.5;

  &:focus {
    border-color: ${(props) => props.theme.colors.primary};
  }

  &::placeholder {
    color: ${(props) => props.theme.colors.textSecondary};
  }
`;

const SendButton = styled.button`
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.md};
  background-color: ${(props) => props.theme.colors.primary};
  color: #ffffff;
  border: none;
  border-radius: ${(props) => props.theme.borderRadius.md};
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingIndicator = styled.div`
  padding: ${(props) => props.theme.spacing.sm};
  color: ${(props) => props.theme.colors.textSecondary};
  font-size: 12px;
  text-align: center;
`;

export const ChatInput = ({ chatId, isAnalyzingPlan: isAnalyzingPlanProp }: ChatInputProps) => {
  const [input, setInput] = useState('');
  const [isAnalyzingPlanLocal, setIsAnalyzingPlanLocal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { addMessage, chats, updateChat } = useChatStore();
  const { getConnection, buildConnectionString } = useConnectionStore();
  const { defaultAIProvider, bedrockAccessKey, bedrockSecretKey, bedrockRegion } = useSettingsStore();
  const { getKeyForProvider, getModelForProvider } = useAPIKeyStore();

  const generateSQLMutation = useGenerateSQL();

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '42px'; // Reset to min height
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + 'px';
    }
  }, [input]);

  // Combine local and prop analyzing states
  const isAnalyzingPlan = isAnalyzingPlanProp || isAnalyzingPlanLocal;

  const handleExecutionPlanPaste = async (xmlContent: string) => {
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

      // Add user message showing they pasted XML
      addMessage(chatId, {
        id: uuidv4(),
        role: 'user',
        content: 'Pasted execution plan XML for analysis',
        timestamp: new Date(),
      });

      // Clear input and reset textarea height
      setInput('');
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
      const aiModel = getModelForProvider(aiProvider);

      // All providers use BYOK mode
      const mode = 'byok';

      const analysis = await analyzeExecutionPlan(
        xmlContent,
        mode,
        aiProvider,
        aiModel,
        apiKey,
        undefined, // token (not used in BYOK mode)
        aiProvider === 'bedrock' && bedrockAccessKey && bedrockSecretKey
          ? {
            access_key: bedrockAccessKey,
            secret_key: bedrockSecretKey,
            region: bedrockRegion,
          }
          : undefined
      );

      // Remove analyzing message
      const chatAfterAnalysis = chats.find((c) => c.id === chatId);
      if (chatAfterAnalysis) {
        const updatedMessages = chatAfterAnalysis.messages.filter(m => m.id !== analyzingMessageId);
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

  const handleSend = async () => {
    if (!input.trim()) return;

    // Check if input is execution plan XML
    if (isExecutionPlanXML(input)) {
      await handleExecutionPlanPaste(input);
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

    // All providers use BYOK mode
    const mode = 'byok';

    // Check credentials - need API key (except for bedrock which uses AWS credentials)
    let apiKey: string | undefined;

    if (aiProvider !== 'bedrock') {
      apiKey = getKeyForProvider(aiProvider);
      if (!apiKey) {
        showToast.warning(`Please set your ${aiProvider.toUpperCase()} API key in settings`);
        return;
      }
    }

    // Store the input value before clearing
    const userInput = input;

    // Add user message
    const userMessage = {
      id: uuidv4(),
      role: 'user' as const,
      content: userInput,
      timestamp: new Date(),
    };
    addMessage(chatId, userMessage);
    setInput('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '42px';
    }

    try {
      // Build connection string from connection details
      const connectionString = buildConnectionString(connection);

      // Get the model for the selected provider from API Key Store
      const aiModel = getModelForProvider(aiProvider);

      // Get conversation history (last 10 messages for context)
      // Use currentChat from above instead of fetching again
      const conversationHistory = currentChat.messages
        .slice(-10) // Last 10 messages
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Generate SQL using BYOK mode
      const sqlResult = await generateSQLMutation.mutateAsync({
        question: userInput,
        connection_string: connectionString,
        database_type: connection.databaseType,
        ai_provider: aiProvider,
        ai_model: aiModel,
        api_key: apiKey,
        bedrock_config: aiProvider === 'bedrock' && bedrockAccessKey && bedrockSecretKey
          ? {
            access_key: bedrockAccessKey,
            secret_key: bedrockSecretKey,
            region: bedrockRegion,
          }
          : undefined,
        mode: mode,
        conversation_history: conversationHistory,
      });

      if (!sqlResult.success) {
        throw new Error(sqlResult.error || 'Failed to generate SQL');
      }

      // Add AI response with SQL (no auto-execution)
      const aiMessage = {
        id: uuidv4(),
        role: 'assistant' as const,
        content: sqlResult.explanation,
        sqlQuery: sqlResult.sql_query,
        timestamp: new Date(),
      };
      addMessage(chatId, aiMessage);

      // Generate smart title if this is the first message
      // Use currentChat from above instead of fetching again
      if (currentChat.messages.length === 0) {
        try {
          const titleResult = await apiClient.generateChatTitle({
            question: userInput,
            ai_provider: aiProvider,
            ai_model: aiModel,
            api_key: apiKey,
            bedrock_config: aiProvider === 'bedrock' && bedrockAccessKey && bedrockSecretKey
              ? {
                access_key: bedrockAccessKey,
                secret_key: bedrockSecretKey,
                region: bedrockRegion,
              }
              : undefined,
            mode: mode,
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isLoading = generateSQLMutation.isPending || isAnalyzingPlan;

  // Get current chat to access its AI provider
  const currentChat = chats.find((c) => c.id === chatId);
  const currentProvider = (currentChat?.aiProvider || defaultAIProvider || 'openai') as AIProvider;

  const handleProviderChange = (provider: AIProvider) => {
    if (currentChat) {
      updateChat(chatId, { aiProvider: provider });
    }
  };

  return (
    <InputContainer>
      {generateSQLMutation.isPending && <LoadingIndicator>Generating SQL...</LoadingIndicator>}
      {isAnalyzingPlan && <LoadingIndicator>Analyzing execution plan...</LoadingIndicator>}

      <TopBar>
        <ProviderSelectorCompact>
          <ProviderLabel>AI</ProviderLabel>
          <ProviderButton
            $active={currentProvider === 'claude'}
            $provider="claude"
            onClick={() => handleProviderChange('claude')}
          >
            <ProviderIconWrapper><ClaudeLogo /></ProviderIconWrapper>
            Claude
          </ProviderButton>
          <ProviderButton
            $active={currentProvider === 'openai'}
            $provider="openai"
            onClick={() => handleProviderChange('openai')}
          >
            <ProviderIconWrapper><OpenAILogo /></ProviderIconWrapper>
            OpenAI
          </ProviderButton>
          <ProviderButton
            $active={currentProvider === 'gemini'}
            $provider="gemini"
            onClick={() => handleProviderChange('gemini')}
          >
            <ProviderIconWrapper><GeminiLogo /></ProviderIconWrapper>
            Gemini
          </ProviderButton>
          <ProviderButton
            $active={currentProvider === 'bedrock'}
            $provider="bedrock"
            onClick={() => handleProviderChange('bedrock')}
          >
            <ProviderIconWrapper><BedrockLogo /></ProviderIconWrapper>
            Bedrock
          </ProviderButton>
        </ProviderSelectorCompact>
      </TopBar>

      <InputWrapper>
        <Input
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your question... (Shift+Enter for new line)"
          disabled={isLoading}
          rows={1}
        />
        <SendButton onClick={handleSend} disabled={!input.trim() || isLoading}>
          {isLoading ? <InlineLoading /> : 'Send'}
        </SendButton>
      </InputWrapper>
    </InputContainer>
  );
};

