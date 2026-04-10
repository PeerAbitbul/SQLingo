import styled from 'styled-components';
import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language: string;
  onRun?: () => void;
  onFavorite?: (sql: string) => void;
}

const Container = styled.div`
  max-width: 80%;
  background-color: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${(props) => props.theme.spacing.xs} ${(props) => props.theme.spacing.sm};
  background-color: ${(props) => props.theme.colors.background};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
`;

const Language = styled.span`
  font-size: 12px;
  color: ${(props) => props.theme.colors.textSecondary};
  text-transform: uppercase;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing.xs};
`;

const Button = styled.button`
  background: none;
  border: none;
  color: ${(props) => props.theme.colors.primary};
  cursor: pointer;
  font-size: 12px;
  padding: ${(props) => props.theme.spacing.xs} ${(props) => props.theme.spacing.sm};
  border-radius: ${(props) => props.theme.borderRadius.sm};
  transition: all 0.2s;

  &:hover {
    background-color: ${(props) => props.theme.colors.surface};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RunButton = styled(Button)`
  background-color: ${(props) => props.theme.colors.primary};
  color: white;

  &:hover {
    opacity: 0.9;
    background-color: ${(props) => props.theme.colors.primary};
  }
`;

const StarButton = styled(Button)<{ $saved?: boolean }>`
  color: ${(props) => props.$saved ? '#f59e0b' : props.theme.colors.textSecondary};
  font-size: 14px;

  &:hover {
    color: #f59e0b;
  }
`;

const CodeContent = styled.pre`
  margin: 0;
  padding: ${(props) => props.theme.spacing.md};
  overflow-x: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  line-height: 1.5;
  color: ${(props) => props.theme.colors.text};

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${(props) => props.theme.colors.border};
    border-radius: 3px;
  }
`;

export const CodeBlock = ({ code, language, onRun, onFavorite }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCopy = async () => {
    try {
      // Try modern clipboard API
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback to old method if clipboard API fails
      try {
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        console.error('Failed to copy to clipboard:', fallbackError);
      }
    }
  };

  const handleFavorite = () => {
    if (onFavorite) {
      onFavorite(code);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <Container>
      <Header>
        <Language>{language}</Language>
        <ButtonGroup>
          <Button onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          {onFavorite && language.toLowerCase() === 'sql' && (
            <StarButton onClick={handleFavorite} $saved={saved}>
              {saved ? '★ Saved!' : '☆ Save'}
            </StarButton>
          )}
          {onRun && language.toLowerCase() === 'sql' && (
            <RunButton onClick={onRun}>
              Run Query
            </RunButton>
          )}
        </ButtonGroup>
      </Header>
      <CodeContent>{code}</CodeContent>
    </Container>
  );
};

