import styled from 'styled-components';
import { useState } from 'react';
import { useAPIKeyStore } from '../stores/apiKeyStore';
import { useSettingsStore } from '../stores/settingsStore';

import { showToast } from '../stores/toastStore';
import { ACCESS_TOKEN_PROVIDERS, type AuthMode } from '../types/aiProvider';

interface APIKeyManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

// SVG Icons
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const KeyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

// Provider logos as SVG
const ClaudeLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm-2-8c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
  </svg>
);

const OpenAILogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
  </svg>
);

const GeminiLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

const BedrockLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.82 8 12 11.82 4.18 8 12 4.18zM4 9.82l7 3.5v7.36l-7-3.5V9.82zm16 0v7.36l-7 3.5v-7.36l7-3.5z" />
  </svg>
);

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: ${(props) => (props.$isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Panel = styled.div`
  background-color: ${(props) => props.theme.colors.background};
  border-radius: 16px;
  width: 90%;
  max-width: 480px;
  max-height: 85vh;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
`;

const TitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TitleIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, ${(props) => props.theme.colors.primary}, ${(props) => props.theme.colors.primary}88);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const TitleText = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  margin: 0;
`;

const Subtitle = styled.span`
  font-size: 12px;
  color: ${(props) => props.theme.colors.textSecondary};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${(props) => props.theme.colors.textSecondary};
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    background: ${(props) => props.theme.colors.surface};
    color: ${(props) => props.theme.colors.text};
  }
`;

const TabsContainer = styled.div`
  display: flex;
  padding: 0 24px;
  gap: 4px;
  background: ${(props) => props.theme.colors.background};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
`;

const Tab = styled.button<{ $active: boolean; $provider: string }>`
  flex: 1;
  padding: 14px 8px;
  background: none;
  border: none;
  border-bottom: 2px solid ${(props) => props.$active ?
    (props.$provider === 'claude' ? '#8B5CF6' :
      props.$provider === 'openai' ? '#10B981' : '#3B82F6')
    : 'transparent'};
  color: ${(props) => props.$active ? props.theme.colors.text : props.theme.colors.textSecondary};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  
  &:hover {
    color: ${(props) => props.theme.colors.text};
    background: ${(props) => props.theme.colors.surface};
  }
  
  svg {
    opacity: ${(props) => props.$active ? 1 : 0.5};
    color: ${(props) =>
    props.$provider === 'claude' ? '#8B5CF6' :
      props.$provider === 'openai' ? '#10B981' : '#3B82F6'};
  }
`;

const StatusDot = styled.span<{ $hasKey: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: ${(props) => props.$hasKey ? '#10B981' : props.theme.colors.textSecondary};
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: ${(props) => props.theme.colors.text};
  margin-bottom: 8px;
`;

const InputWrapper = styled.div`
  position: relative;
`;

const Input = styled.input<{ $hasValue: boolean }>`
  width: 100%;
  padding: 12px 40px 12px 14px;
  background-color: ${(props) => props.theme.colors.surface};
  color: ${(props) => props.theme.colors.text};
  border: 1px solid ${(props) =>
    props.$hasValue ? '#10B981' : props.theme.colors.border};
  border-radius: 10px;
  font-size: 14px;
  font-family: 'SF Mono', Monaco, monospace;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${(props) => props.theme.colors.primary}22;
  }
  
  &::placeholder {
    color: ${(props) => props.theme.colors.textSecondary};
    font-family: inherit;
  }
`;

const StatusIcon = styled.span<{ $hasValue: boolean }>`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${(props) =>
    props.$hasValue ? '#10B981' : props.theme.colors.textSecondary};
  display: flex;
  align-items: center;
`;

const HelpLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: ${(props) => props.theme.colors.primary};
  text-decoration: none;
  margin-top: 8px;
  
  &:hover {
    text-decoration: underline;
  }
`;


const Select = styled.select`
  width: 100%;
  padding: 12px 14px;
  background-color: ${(props) => props.theme.colors.surface};
  color: ${(props) => props.theme.colors.text};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${(props) => props.theme.colors.primary}22;
  }
  
  option {
    background-color: ${(props) => props.theme.colors.surface};
    color: ${(props) => props.theme.colors.text};
    padding: 8px;
  }
`;

const AuthModeToggle = styled.div`
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${(props) => props.theme.colors.border};
  margin-bottom: 16px;
`;

const AuthModeOption = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 8px 12px;
  background: ${(props) => props.$active ? props.theme.colors.primary + '22' : 'transparent'};
  color: ${(props) => props.$active ? props.theme.colors.primary : props.theme.colors.textSecondary};
  border: none;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:first-child {
    border-right: 1px solid ${(props) => props.theme.colors.border};
  }

  &:hover {
    background: ${(props) => props.$active ? props.theme.colors.primary + '22' : props.theme.colors.surface};
  }
`;

const AuthModeHint = styled.div`
  font-size: 11px;
  color: ${(props) => props.theme.colors.textSecondary};
  margin-top: 6px;
  line-height: 1.4;
  opacity: 0.8;
`;

const Footer = styled.div`
  padding: 16px 24px;
  border-top: 1px solid ${(props) => props.theme.colors.border};
  display: flex;
  gap: 12px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 12px 20px;
  background-color: ${(props) =>
    props.$variant === 'secondary' ? 'transparent' : props.theme.colors.primary};
  color: ${(props) =>
    props.$variant === 'secondary' ? props.theme.colors.text : 'white'};
  border: 1px solid ${(props) =>
    props.$variant === 'secondary' ? props.theme.colors.border : 'transparent'};
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

const providerConfig = {
  claude: {
    name: 'Claude',
    company: 'Anthropic',
    placeholder: 'sk-ant-...',
    tokenPlaceholder: 'Paste access token from: claude setup-token',
    docsUrl: 'https://console.anthropic.com/',
    tokenDocsUrl: 'https://docs.anthropic.com/en/docs/claude-code',
    tokenHint: 'Run "claude setup-token" in Claude Code CLI to generate a token. Note: uses your Claude subscription, may be blocked by Anthropic.',
    modelDocsUrl: 'https://docs.anthropic.com/en/docs/about-claude/models',
    logo: ClaudeLogo,
  },
  openai: {
    name: 'OpenAI',
    company: 'OpenAI',
    placeholder: 'sk-...',
    tokenPlaceholder: 'Paste access token from Codex CLI',
    docsUrl: 'https://platform.openai.com/api-keys',
    tokenDocsUrl: 'https://developers.openai.com/codex/auth/',
    tokenHint: 'Login via Codex CLI to get an access token. Note: uses your ChatGPT subscription.',
    modelDocsUrl: 'https://platform.openai.com/docs/models',
    logo: OpenAILogo,
  },
  gemini: {
    name: 'Gemini',
    company: 'Google',
    placeholder: 'AIza...',
    tokenPlaceholder: '',
    docsUrl: 'https://makersuite.google.com/app/apikey',
    tokenDocsUrl: '',
    tokenHint: '',
    modelDocsUrl: 'https://ai.google.dev/models',
    logo: GeminiLogo,
  },
  bedrock: {
    name: 'Bedrock',
    company: 'Amazon Web Services',
    placeholder: 'AKIA...',
    tokenPlaceholder: '',
    docsUrl: 'https://console.aws.amazon.com/bedrock/',
    tokenDocsUrl: '',
    tokenHint: '',
    modelDocsUrl: 'https://docs.aws.amazon.com/bedrock/',
    logo: BedrockLogo,
  },
};

type Provider = 'claude' | 'openai' | 'gemini' | 'bedrock';

export const APIKeyManager = ({ isOpen, onClose }: APIKeyManagerProps) => {
  const {
    claudeKey, openaiKey, geminiKey,
    claudeModel, openaiModel, geminiModel, bedrockModel,
    claudeAuthMode, openaiAuthMode,
    setClaudeKey, setOpenaiKey, setGeminiKey,
    setClaudeModel, setOpenaiModel, setGeminiModel, setBedrockModel,
    setClaudeAuthMode, setOpenaiAuthMode
  } = useAPIKeyStore();

  const {
    bedrockAccessKey,
    bedrockSecretKey,
    bedrockRegion,
    setBedrockCredentials,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<Provider>('openai');

  const [localKeys, setLocalKeys] = useState({
    claude: claudeKey,
    openai: openaiKey,
    gemini: geminiKey,
    bedrock: bedrockAccessKey,
  });

  const [localBedrockSecretKey, setLocalBedrockSecretKey] = useState(bedrockSecretKey);
  const [localBedrockRegion, setLocalBedrockRegion] = useState(bedrockRegion);

  const [localAuthModes, setLocalAuthModes] = useState<{ claude: AuthMode; openai: AuthMode }>({
    claude: claudeAuthMode,
    openai: openaiAuthMode,
  });

  const [localModels, setLocalModels] = useState({
    claude: claudeModel,
    openai: openaiModel,
    gemini: geminiModel,
    bedrock: bedrockModel,
  });

  const validateApiKey = (provider: string, key: string): boolean => {
    // Skip validation for empty keys (user might want to clear it)
    if (!key || key.trim() === '') return true;

    // Skip format validation for access token mode - tokens have unpredictable formats
    const authMode = (provider === 'claude' || provider === 'openai')
      ? localAuthModes[provider]
      : 'api_key';
    if (authMode === 'access_token') {
      if (key.length < 10) {
        showToast.error('Access token seems too short');
        return false;
      }
      return true;
    }

    // Validate API key format based on provider
    switch (provider) {
      case 'claude':
        // Claude keys start with 'sk-ant-'
        if (!key.startsWith('sk-ant-')) {
          showToast.error('Invalid Claude API key format. Should start with "sk-ant-"');
          return false;
        }
        if (key.length < 20) {
          showToast.error('Claude API key seems too short');
          return false;
        }
        break;

      case 'openai':
        // OpenAI keys start with 'sk-' (but not 'sk-ant-')
        if (!key.startsWith('sk-') || key.startsWith('sk-ant-')) {
          showToast.error('Invalid OpenAI API key format. Should start with "sk-"');
          return false;
        }
        if (key.length < 20) {
          showToast.error('OpenAI API key seems too short');
          return false;
        }
        break;

      case 'gemini':
        // Gemini keys are typically alphanumeric
        if (!/^[A-Za-z0-9_-]+$/.test(key)) {
          showToast.error('Invalid Gemini API key format. Should contain only letters, numbers, dashes and underscores');
          return false;
        }
        if (key.length < 20) {
          showToast.error('Gemini API key seems too short');
          return false;
        }
        break;

      case 'bedrock':
        // AWS Access Keys start with 'AKIA'
        if (!key.startsWith('AKIA')) {
          showToast.error('Invalid AWS Access Key format. Should start with "AKIA"');
          return false;
        }
        if (key.length !== 20) {
          showToast.error('AWS Access Key should be exactly 20 characters');
          return false;
        }
        break;
    }

    return true;
  };

  const handleSave = () => {
    // Validate all API keys before saving
    if (!validateApiKey('claude', localKeys.claude)) return;
    if (!validateApiKey('openai', localKeys.openai)) return;
    if (!validateApiKey('gemini', localKeys.gemini)) return;
    if (!validateApiKey('bedrock', localKeys.bedrock)) return;

    // Save the keys
    setClaudeKey(localKeys.claude);
    setOpenaiKey(localKeys.openai);
    setGeminiKey(localKeys.gemini);
    setClaudeModel(localModels.claude);
    setOpenaiModel(localModels.openai);
    setGeminiModel(localModels.gemini);
    setBedrockModel(localModels.bedrock);

    // Save auth modes
    setClaudeAuthMode(localAuthModes.claude);
    setOpenaiAuthMode(localAuthModes.openai);

    // Save Bedrock credentials (Access Key, Secret Key, Region)
    setBedrockCredentials(localKeys.bedrock, localBedrockSecretKey, localBedrockRegion);

    showToast.success('Settings saved successfully');
    onClose();
  };

  const config = providerConfig[activeTab];
  const currentKey = localKeys[activeTab];
  const currentModel = localModels[activeTab];
  const supportsAccessToken = ACCESS_TOKEN_PROVIDERS.includes(activeTab);
  const currentAuthMode = (activeTab === 'claude' || activeTab === 'openai')
    ? localAuthModes[activeTab]
    : 'api_key' as AuthMode;
  const isAccessToken = currentAuthMode === 'access_token';

  return (
    <Overlay $isOpen={isOpen} onClick={onClose}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <Header>
          <TitleWrapper>
            <TitleIcon>
              <KeyIcon />
            </TitleIcon>
            <TitleText>
              <Title>API Keys</Title>
              <Subtitle>Configure your AI providers</Subtitle>
            </TitleText>
          </TitleWrapper>
          <CloseButton onClick={onClose}>
            <CloseIcon />
          </CloseButton>
        </Header>

        <TabsContainer>
          {(Object.keys(providerConfig) as Provider[]).map((provider) => {
            const ProviderLogo = providerConfig[provider].logo;
            return (
              <Tab
                key={provider}
                $active={activeTab === provider}
                $provider={provider}
                onClick={() => setActiveTab(provider)}
              >
                <ProviderLogo />
                {providerConfig[provider].name}
                <StatusDot $hasKey={!!localKeys[provider]} />
              </Tab>
            );
          })}
        </TabsContainer>

        <Content>
          {supportsAccessToken && (
            <FormGroup>
              <Label>Authentication Method</Label>
              <AuthModeToggle>
                <AuthModeOption
                  $active={!isAccessToken}
                  onClick={() => setLocalAuthModes({ ...localAuthModes, [activeTab]: 'api_key' as AuthMode })}
                >
                  API Key (Recommended)
                </AuthModeOption>
                <AuthModeOption
                  $active={isAccessToken}
                  onClick={() => setLocalAuthModes({ ...localAuthModes, [activeTab]: 'access_token' as AuthMode })}
                >
                  Access Token
                </AuthModeOption>
              </AuthModeToggle>
            </FormGroup>
          )}

          <FormGroup>
            <Label>
              {activeTab === 'bedrock' ? 'AWS Access Key' : isAccessToken ? 'Access Token' : 'API Key'}
            </Label>
            <InputWrapper>
              <Input
                type="password"
                placeholder={isAccessToken ? config.tokenPlaceholder : config.placeholder}
                value={currentKey}
                onChange={(e) =>
                  setLocalKeys({ ...localKeys, [activeTab]: e.target.value })
                }
                $hasValue={!!currentKey}
              />
              <StatusIcon $hasValue={!!currentKey}>
                {currentKey ? <CheckIcon /> : <CircleIcon />}
              </StatusIcon>
            </InputWrapper>
            {isAccessToken ? (
              <>
                <HelpLink href={config.tokenDocsUrl} target="_blank">
                  How to get an access token <ExternalLinkIcon />
                </HelpLink>
                <AuthModeHint>{config.tokenHint}</AuthModeHint>
              </>
            ) : (
              <HelpLink href={config.docsUrl} target="_blank">
                Get your {activeTab === 'bedrock' ? 'AWS credentials' : 'API key'} <ExternalLinkIcon />
              </HelpLink>
            )}
          </FormGroup>

          {activeTab === 'bedrock' && (
            <>
              <FormGroup>
                <Label>AWS Secret Access Key</Label>
                <InputWrapper>
                  <Input
                    type="password"
                    placeholder="Enter secret key"
                    value={localBedrockSecretKey}
                    onChange={(e) => setLocalBedrockSecretKey(e.target.value)}
                    $hasValue={!!localBedrockSecretKey}
                  />
                  <StatusIcon $hasValue={!!localBedrockSecretKey}>
                    {localBedrockSecretKey ? <CheckIcon /> : <CircleIcon />}
                  </StatusIcon>
                </InputWrapper>
              </FormGroup>

              <FormGroup>
                <Label>AWS Region</Label>
                <Select
                  value={localBedrockRegion}
                  onChange={(e) => setLocalBedrockRegion(e.target.value)}
                >
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">Europe (Ireland)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                </Select>
              </FormGroup>
            </>
          )}

          <FormGroup>
            <Label>Model</Label>
            <Input
              type="text"
              placeholder="Enter model name..."
              value={currentModel}
              onChange={(e) =>
                setLocalModels({ ...localModels, [activeTab]: e.target.value })
              }
              $hasValue={!!currentModel}
            />
            {config.modelDocsUrl && (
              <HelpLink href={config.modelDocsUrl} target="_blank">
                View available models <ExternalLinkIcon />
              </HelpLink>
            )}
          </FormGroup>
        </Content>

        <Footer>
          <Button $variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </Footer>
      </Panel>
    </Overlay>
  );
};
