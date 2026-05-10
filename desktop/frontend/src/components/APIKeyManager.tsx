import styled from 'styled-components';
import { useState, useRef, useEffect } from 'react';
import { useAPIKeyStore } from '../stores/apiKeyStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useCLIStore } from '../stores/cliStore';
import { apiClient } from '../utils/api';
import { showToast } from '../stores/toastStore';

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
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd">
    <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" />
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

const TabsWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: stretch;
  background: ${(props) => props.theme.colors.background};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
`;

const TabScrollArrow = styled.button<{ $visible: boolean }>`
  flex-shrink: 0;
  width: 24px;
  border: none;
  background: ${(p) => p.theme.colors.background};
  color: ${(p) => p.theme.colors.textSecondary};
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  opacity: ${(p) => p.$visible ? 1 : 0};
  pointer-events: ${(p) => p.$visible ? 'auto' : 'none'};
  transition: opacity 0.15s;
  &:hover { color: ${(p) => p.theme.colors.text}; }
`;

const TabsContainer = styled.div`
  display: flex;
  padding: 0 4px;
  gap: 4px;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const Tab = styled.button<{ $active: boolean; $provider: string }>`
  flex: 0 0 auto;
  padding: 14px 10px;
  background: none;
  border: none;
  border-bottom: 2px solid ${(props) => props.$active ?
    (props.$provider === 'claude' ? '#D97757' :
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
    props.$provider === 'claude' ? '#D97757' :
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

const OAuthSection = styled.div`
  margin-bottom: 20px;
`;

const OAuthButton = styled.button<{ $connected: boolean }>`
  width: 100%;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid ${(props) => props.$connected ? '#10B981' : props.theme.colors.border};
  background: ${(props) => props.$connected ? '#10B98122' : props.theme.colors.surface};
  color: ${(props) => props.$connected ? '#10B981' : props.theme.colors.text};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;

  &:hover {
    opacity: 0.85;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const OAuthDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0;

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${(props) => props.theme.colors.border};
  }

  span {
    font-size: 11px;
    color: ${(props) => props.theme.colors.textSecondary};
    white-space: nowrap;
  }
`;

const InstallBox = styled.div`
  margin-top: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #F59E0B44;
  background: #F59E0B11;
  font-size: 12px;
  color: ${(props) => props.theme.colors.text};
  line-height: 1.6;
`;

const InstallTitle = styled.div`
  font-weight: 600;
  color: #F59E0B;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const InstallCode = styled.code`
  display: block;
  margin: 8px 0;
  padding: 8px 10px;
  background: ${(props) => props.theme.colors.surface};
  border-radius: 6px;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 12px;
  color: ${(props) => props.theme.colors.text};
  border: 1px solid ${(props) => props.theme.colors.border};
  user-select: all;
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
  openrouter: {
    name: 'OpenRouter',
    company: 'OpenRouter',
    placeholder: 'sk-or-v1-...',
    tokenPlaceholder: '',
    docsUrl: 'https://openrouter.ai/keys',
    tokenDocsUrl: '',
    tokenHint: '',
    modelDocsUrl: 'https://openrouter.ai/models',
    logo: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#6D28D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
};

type Provider = 'claude' | 'openai' | 'gemini' | 'bedrock' | 'openrouter';

export const APIKeyManager = ({ isOpen, onClose }: APIKeyManagerProps) => {
  const {
    claudeKey, openaiKey, geminiKey, openrouterKey,
    claudeModel, openaiModel, geminiModel, bedrockModel, openrouterModel,
    setClaudeKey, setOpenaiKey, setGeminiKey, setOpenrouterKey,
    setClaudeModel, setOpenaiModel, setGeminiModel, setBedrockModel, setOpenrouterModel,
  } = useAPIKeyStore();

  const {
    bedrockAccessKey,
    bedrockSecretKey,
    bedrockRegion,
    setBedrockCredentials,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<Provider>('openai');
  const [tabCanScrollLeft, setTabCanScrollLeft] = useState(false);
  const [tabCanScrollRight, setTabCanScrollRight] = useState(false);
  const tabScrollRef = useRef<HTMLDivElement>(null);

  const updateTabArrows = () => {
    const el = tabScrollRef.current;
    if (!el) return;
    setTabCanScrollLeft(el.scrollLeft > 0);
    setTabCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    const el = tabScrollRef.current;
    if (!el) return;
    updateTabArrows();
    el.addEventListener('scroll', updateTabArrows);
    const ro = new ResizeObserver(updateTabArrows);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', updateTabArrows); ro.disconnect(); };
  }, []);

  const [localKeys, setLocalKeys] = useState({
    claude: claudeKey,
    openai: openaiKey,
    gemini: geminiKey,
    bedrock: bedrockAccessKey,
    openrouter: openrouterKey,
  });

  const [localBedrockSecretKey, setLocalBedrockSecretKey] = useState(bedrockSecretKey);
  const [localBedrockRegion, setLocalBedrockRegion] = useState(bedrockRegion);

  const { claudeCliMode, setClaudeCliMode } = useCLIStore();
  const [localClaudeCliMode, setLocalClaudeCliMode] = useState(claudeCliMode);
  const [claudeCliAvailable, setClaudeCliAvailable] = useState<boolean | null>(null);
  const [claudeCliChecking, setClaudeCliChecking] = useState(false);

  useEffect(() => {
    if (!isOpen || activeTab !== 'claude') return;
    setClaudeCliChecking(true);
    apiClient.getCliStatus()
      .then((status) => setClaudeCliAvailable(status.claude_cli))
      .catch(() => setClaudeCliAvailable(false))
      .finally(() => setClaudeCliChecking(false));
  }, [isOpen, activeTab]);


  const [localModels, setLocalModels] = useState({
    claude: claudeModel,
    openai: openaiModel,
    gemini: geminiModel,
    bedrock: bedrockModel,
    openrouter: openrouterModel,
  });

  const validateApiKey = (provider: string, key: string): boolean => {
    // Skip validation for empty keys (user might want to clear it)
    if (!key || key.trim() === '') return true;

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
        if (!key.startsWith('AKIA')) {
          showToast.error('Invalid AWS Access Key format. Should start with "AKIA"');
          return false;
        }
        if (key.length !== 20) {
          showToast.error('AWS Access Key should be exactly 20 characters');
          return false;
        }
        break;

      case 'openrouter':
        if (!key.startsWith('sk-or-')) {
          showToast.error('Invalid OpenRouter API key. Should start with "sk-or-"');
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
    if (!validateApiKey('openrouter', localKeys.openrouter)) return;

    // Save the keys
    setClaudeKey(localKeys.claude);
    setOpenaiKey(localKeys.openai);
    setGeminiKey(localKeys.gemini);
    setOpenrouterKey(localKeys.openrouter);
    setClaudeModel(localModels.claude);
    setOpenaiModel(localModels.openai);
    setGeminiModel(localModels.gemini);
    setBedrockModel(localModels.bedrock);
    setOpenrouterModel(localModels.openrouter);

    // Save Bedrock credentials (Access Key, Secret Key, Region)
    setBedrockCredentials(localKeys.bedrock, localBedrockSecretKey, localBedrockRegion);

    // Sync keys to backend so the background observer can use them
    apiClient.saveObserverConfig(
      { claude: localKeys.claude, openai: localKeys.openai, gemini: localKeys.gemini },
      { claude: localModels.claude, openai: localModels.openai, gemini: localModels.gemini }
    ).catch(() => {}); // fire-and-forget, non-critical

    showToast.success('Settings saved successfully');
    onClose();
  };

  const config = providerConfig[activeTab];
  const currentKey = localKeys[activeTab];
  const currentModel = localModels[activeTab];
  const isCliMode = activeTab === 'claude' && localClaudeCliMode;

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

        <TabsWrapper>
          <TabScrollArrow $visible={tabCanScrollLeft} onClick={() => tabScrollRef.current?.scrollBy({ left: -120, behavior: 'smooth' })}>‹</TabScrollArrow>
          <TabsContainer ref={tabScrollRef}>
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
          <TabScrollArrow $visible={tabCanScrollRight} onClick={() => tabScrollRef.current?.scrollBy({ left: 120, behavior: 'smooth' })}>›</TabScrollArrow>
        </TabsWrapper>

        <Content>
          {activeTab === 'claude' && (
            <OAuthSection>
              <Label>Claude CLI Mode</Label>
              <OAuthButton
                $connected={localClaudeCliMode}
                disabled={claudeCliChecking || claudeCliAvailable === false}
                onClick={() => {
                  if (claudeCliAvailable === false) return;
                  const next = !localClaudeCliMode;
                  setLocalClaudeCliMode(next);
                  setClaudeCliMode(next);
                  if (next) showToast.success('Claude CLI Mode enabled — uses your Claude Pro / Max subscription');
                  else showToast.success('Claude CLI Mode disabled');
                }}
              >
                <ClaudeLogo />
                {claudeCliChecking
                  ? 'Checking Claude CLI...'
                  : localClaudeCliMode
                    ? 'CLI Mode ON — Click to use API Key instead'
                    : 'Use Claude CLI (Pro / Max subscription)'}
              </OAuthButton>
              {claudeCliAvailable === false && (
                <InstallBox>
                  <InstallTitle>⚠ Claude CLI not found</InstallTitle>
                  Install Claude Code CLI to use this mode. Run in your terminal:
                  <InstallCode>npm install -g @anthropic-ai/claude-code</InstallCode>
                  Then log in once with <code>claude</code>, and come back here to enable CLI mode.{' '}
                  <HelpLink href="https://docs.anthropic.com/en/docs/claude-code" target="_blank">
                    Learn more <ExternalLinkIcon />
                  </HelpLink>
                </InstallBox>
              )}
              {localClaudeCliMode && claudeCliAvailable !== false && (
                <OAuthDivider><span>CLI handles auth automatically</span></OAuthDivider>
              )}
              {!localClaudeCliMode && claudeCliAvailable !== false && (
                <OAuthDivider><span>or use API Key</span></OAuthDivider>
              )}
            </OAuthSection>
          )}

          <FormGroup>
            <Label>
              {activeTab === 'bedrock' ? 'AWS Access Key' : 'API Key'}
            </Label>
            <InputWrapper>
              <Input
                type="password"
                placeholder={config.placeholder}
                value={currentKey}
                onChange={(e) =>
                  setLocalKeys({ ...localKeys, [activeTab]: e.target.value })
                }
                $hasValue={!!currentKey}
                disabled={isCliMode}
              />
              <StatusIcon $hasValue={!!currentKey || isCliMode}>
                {(currentKey || isCliMode) ? <CheckIcon /> : <CircleIcon />}
              </StatusIcon>
            </InputWrapper>
            {!isCliMode && (
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
