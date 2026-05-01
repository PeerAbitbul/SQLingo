import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Message } from '../stores/chatStore';
import { CodeBlock } from './CodeBlock';
import { QueryResults } from './QueryResults';

interface MessageItemProps {
  message: Message;
  onRunQuery?: (sql: string) => void;
  onFavorite?: (sql: string) => void;
}

const MessageContainer = styled.div<{ $isUser: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${(props) => (props.$isUser ? 'flex-end' : 'flex-start')};
  gap: ${(props) => props.theme.spacing.xs};
`;

const MessageBubble = styled.div<{ $isUser: boolean; $isAgentAlert?: boolean }>`
  max-width: 80%;
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.md};
  background-color: ${(props) =>
    props.$isUser ? props.theme.colors.primary : 
    props.$isAgentAlert ? 'rgba(156, 39, 176, 0.15)' : 
    props.theme.colors.surface};
  color: ${(props) =>
    props.$isUser ? '#ffffff' : props.theme.colors.text};
  border: ${(props) => props.$isAgentAlert ? '1px solid rgba(156, 39, 176, 0.4)' : 'none'};
  border-radius: ${(props) => props.theme.borderRadius.md};
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;

  /* Markdown styling */
  h1, h2, h3, h4, h5, h6 {
    margin-top: ${(props) => props.theme.spacing.md};
    margin-bottom: ${(props) => props.theme.spacing.xs};
    font-weight: 600;
    color: ${(props) => props.$isUser ? '#ffffff' : props.theme.colors.text};
  }

  h1 { font-size: 20px; }
  h2 { font-size: 18px; }
  h3 { font-size: 16px; }
  h4, h5, h6 { font-size: 14px; }

  p {
    margin: ${(props) => props.theme.spacing.xs} 0;
  }

  ul, ol {
    margin: ${(props) => props.theme.spacing.xs} 0;
    padding-left: ${(props) => props.theme.spacing.lg};
  }

  li {
    margin: ${(props) => props.theme.spacing.xs} 0;
  }

  code {
    background-color: ${(props) =>
      props.$isUser
        ? 'rgba(0, 0, 0, 0.2)'
        : props.theme.colors.background
    };
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
    font-size: 13px;
  }

  pre {
    background-color: ${(props) =>
      props.$isUser
        ? 'rgba(0, 0, 0, 0.2)'
        : props.theme.colors.background
    };
    padding: ${(props) => props.theme.spacing.sm};
    border-radius: ${(props) => props.theme.borderRadius.sm};
    overflow-x: auto;
    margin: ${(props) => props.theme.spacing.xs} 0;

    code {
      background-color: transparent;
      padding: 0;
    }
  }

  table {
    border-collapse: collapse;
    width: 100%;
    margin: ${(props) => props.theme.spacing.sm} 0;
    font-size: 13px;
  }

  th, td {
    border: 1px solid ${(props) =>
      props.$isUser
        ? 'rgba(255, 255, 255, 0.3)'
        : props.theme.colors.border
    };
    padding: ${(props) => props.theme.spacing.xs} ${(props) => props.theme.spacing.sm};
    text-align: left;
  }

  th {
    background-color: ${(props) =>
      props.$isUser
        ? 'rgba(0, 0, 0, 0.2)'
        : props.theme.colors.background
    };
    font-weight: 600;
  }

  blockquote {
    border-left: 3px solid ${(props) =>
      props.$isUser
        ? 'rgba(255, 255, 255, 0.5)'
        : props.theme.colors.primary
    };
    padding-left: ${(props) => props.theme.spacing.sm};
    margin: ${(props) => props.theme.spacing.sm} 0;
    color: ${(props) =>
      props.$isUser
        ? 'rgba(255, 255, 255, 0.9)'
        : props.theme.colors.textSecondary
    };
  }

  hr {
    border: none;
    border-top: 1px solid ${(props) =>
      props.$isUser
        ? 'rgba(255, 255, 255, 0.3)'
        : props.theme.colors.border
    };
    margin: ${(props) => props.theme.spacing.md} 0;
  }

  a {
    color: ${(props) =>
      props.$isUser
        ? '#ffffff'
        : props.theme.colors.primary
    };
    text-decoration: underline;
  }
`;

const Timestamp = styled.span`
  font-size: 11px;
  color: ${(props) => props.theme.colors.textSecondary};
`;

const AttachmentChip = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 6px;
`;

export const MessageItem = ({ message, onRunQuery, onFavorite }: MessageItemProps) => {
  const isUser = message.role === 'user';

  return (
    <MessageContainer $isUser={isUser}>
      <MessageBubble $isUser={isUser} $isAgentAlert={message.isAgentAlert} dir="auto">
        {isUser && message.attachmentName && (
          <AttachmentChip>
            📎 {message.attachmentName}
          </AttachmentChip>
        )}
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSanitize]}
        >
          {message.content}
        </ReactMarkdown>
      </MessageBubble>
      {message.sqlQuery && (
        <CodeBlock
          code={message.sqlQuery}
          language="sql"
          onRun={onRunQuery ? () => onRunQuery(message.sqlQuery!) : undefined}
          onFavorite={onFavorite}
        />
      )}
      {message.queryResults && (
        <QueryResults
          columns={message.queryResults.columns}
          rows={message.queryResults.rows}
        />
      )}
      <Timestamp>
        {new Date(message.timestamp).toLocaleTimeString()}
      </Timestamp>
    </MessageContainer>
  );
};
