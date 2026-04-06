import styled from 'styled-components';
import { useState } from 'react';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  background: ${(props) => props.theme.colors.surface};
  color: ${(props) => props.theme.colors.textSecondary};
  border: 1px solid ${(props) => props.theme.colors.border};
`;

const StatusDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
`;

const Description = styled.p`
  font-size: 13px;
  color: ${(props) => props.theme.colors.textSecondary};
  margin: 0;
  line-height: 1.5;
`;

const CommandBlock = styled.div`
  position: relative;
  background: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 6px;
  padding: 12px 40px 12px 12px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  color: ${(props) => props.theme.colors.text};
  word-break: break-all;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: ${(props) => props.theme.colors.border};
  border: none;
  border-radius: 4px;
  color: ${(props) => props.theme.colors.textSecondary};
  font-size: 11px;
  padding: 2px 8px;
  cursor: pointer;
  &:hover {
    color: ${(props) => props.theme.colors.text};
  }
`;

const LinkButton = styled.button`
  background: none;
  border: 1px solid ${(props) => props.theme.colors.border};
  color: ${(props) => props.theme.colors.primary};
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  &:hover {
    background: ${(props) => props.theme.colors.surface};
  }
`;

const TabRow = styled.div`
  display: flex;
  gap: 4px;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  margin-bottom: 8px;
`;

const Tab = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  color: ${(p) =>
    p.$active ? p.theme.colors.primary : p.theme.colors.textSecondary};
  border-bottom: 2px solid
    ${(p) => (p.$active ? p.theme.colors.primary : 'transparent')};
  &:hover {
    color: ${(p) => p.theme.colors.text};
  }
`;

type Platform = 'darwin' | 'win32' | 'linux';

function detectPlatform(): Platform {
  const p = (window as any).electron?.platform as string | undefined;
  if (p === 'win32') return 'win32';
  if (p === 'linux') return 'linux';
  return 'darwin';
}

const installInfo: Record<Platform, { label: string; command: string; alt?: string }> = {
  darwin: {
    label: 'macOS',
    command: 'brew install ollama',
    alt: 'Or download from ollama.com',
  },
  win32: {
    label: 'Windows',
    command: 'Download installer from ollama.com',
  },
  linux: {
    label: 'Linux',
    command: 'curl -fsSL https://ollama.com/install.sh | sh',
  },
};

export const OllamaInstallGuide = () => {
  const [tab, setTab] = useState<Platform>(detectPlatform);
  const [copied, setCopied] = useState(false);

  const info = installInfo[tab];
  const isCommand = !info.command.startsWith('Download');

  const handleCopy = () => {
    navigator.clipboard.writeText(info.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenSite = () => {
    if ((window as any).electron?.openExternal) {
      (window as any).electron.openExternal('https://ollama.com/download');
    } else {
      window.open('https://ollama.com/download', '_blank');
    }
  };

  return (
    <Container>
      <StatusBadge>
        <StatusDot /> Ollama not detected
      </StatusBadge>

      <Description>
        Ollama lets you run AI models locally on your machine — no API key,
        no cost, full privacy. Install it, then start the server with{' '}
        <code>ollama serve</code>.
      </Description>

      <TabRow>
        {(['darwin', 'win32', 'linux'] as Platform[]).map((p) => (
          <Tab key={p} $active={tab === p} onClick={() => setTab(p)}>
            {installInfo[p].label}
          </Tab>
        ))}
      </TabRow>

      {isCommand ? (
        <CommandBlock>
          {info.command}
          <CopyButton onClick={handleCopy}>{copied ? 'Copied' : 'Copy'}</CopyButton>
        </CommandBlock>
      ) : (
        <Description>{info.command}</Description>
      )}

      {info.alt && (
        <Description style={{ fontSize: '12px' }}>{info.alt}</Description>
      )}

      <Description style={{ fontSize: '12px' }}>
        After installing, run: <code>ollama serve</code>
      </Description>

      <LinkButton onClick={handleOpenSite}>
        Open ollama.com
      </LinkButton>
    </Container>
  );
};
