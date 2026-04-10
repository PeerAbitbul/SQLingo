import styled from 'styled-components';
import { useEffect, useRef } from 'react';
import { Message } from '../stores/chatStore';
import { MessageItem } from './MessageItem';

interface ChatMessagesProps {
  messages: Message[];
  onRunQuery?: (sql: string) => void;
  onFavorite?: (sql: string) => void;
}

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${(props) => props.theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.md};

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${(props) => props.theme.colors.border};
    border-radius: 4px;
  }
`;

export const ChatMessages = ({ messages, onRunQuery, onFavorite }: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <MessagesContainer ref={containerRef}>
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          onRunQuery={onRunQuery}
          onFavorite={onFavorite}
        />
      ))}
      <div ref={messagesEndRef} />
    </MessagesContainer>
  );
};

