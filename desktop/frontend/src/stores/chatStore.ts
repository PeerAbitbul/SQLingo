import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIProvider } from '../types/aiProvider';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sqlQuery?: string;
  queryResults?: {
    columns: string[];
    rows: any[][];
  };
  timestamp: Date;
}

export interface Chat {
  id: string;
  title: string;
  connectionId?: string;
  aiProvider?: AIProvider; // 'claude', 'openai', 'gemini', 'bedrock'
  messages: Message[];
  createdAt: Date;
}

interface ChatState {
  chats: Chat[];
  activeChat: string | null;
  lastUsedConnectionId: string | null;
  addChat: (chat: Chat) => void;
  removeChat: (chatId: string) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  setActiveChat: (chatId: string) => void;
  addMessage: (chatId: string, message: Message) => void;
  removeMessage: (chatId: string, messageId: string) => void;
  clearMessages: (chatId: string) => void;
  setLastUsedConnectionId: (connectionId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      chats: [],
      activeChat: null,
      lastUsedConnectionId: null,
      addChat: (chat) =>
        set((state) => ({
          chats: [...state.chats, chat],
          activeChat: chat.id,
        })),
      removeChat: (chatId) =>
        set((state) => ({
          chats: state.chats.filter((c) => c.id !== chatId),
          activeChat: state.activeChat === chatId ? null : state.activeChat,
        })),
      updateChat: (chatId, updates) =>
        set((state) => {
          // If updating messages, ensure no duplicate IDs
          if (updates.messages) {
            const uniqueMessages = updates.messages.filter((msg, index, self) =>
              index === self.findIndex(m => m.id === msg.id)
            );
            if (uniqueMessages.length !== updates.messages.length) {
              console.warn(`Removed ${updates.messages.length - uniqueMessages.length} duplicate messages`);
              updates = { ...updates, messages: uniqueMessages };
            }
          }

          // If updating connectionId, also update lastUsedConnectionId
          if (updates.connectionId) {
            return {
              chats: state.chats.map((chat) =>
                chat.id === chatId ? { ...chat, ...updates } : chat
              ),
              lastUsedConnectionId: updates.connectionId,
            };
          }
          return {
            chats: state.chats.map((chat) =>
              chat.id === chatId ? { ...chat, ...updates } : chat
            ),
          };
        }),
      setActiveChat: (chatId) => set({ activeChat: chatId }),
      addMessage: (chatId, message) =>
        set((state) => ({
          chats: state.chats.map((chat) => {
            if (chat.id === chatId) {
              // Check if message with this ID already exists
              const messageExists = chat.messages.some(m => m.id === message.id);
              if (messageExists) {
                console.warn(`Message with ID ${message.id} already exists, skipping`);
                return chat;
              }
              return { ...chat, messages: [...chat.messages, message] };
            }
            return chat;
          }),
        })),
      removeMessage: (chatId, messageId) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? { ...chat, messages: chat.messages.filter(m => m.id !== messageId) }
              : chat
          ),
        })),
      clearMessages: (chatId) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId ? { ...chat, messages: [] } : chat
          ),
        })),
      setLastUsedConnectionId: (connectionId) =>
        set({ lastUsedConnectionId: connectionId }),
    }),
    {
      name: 'chat-storage',
      version: 2, // Increment version to trigger migration
      migrate: (persistedState: any, version: number) => {
        // Clean up duplicate message IDs from old data
        if (version < 2 && persistedState.chats) {
          persistedState.chats = persistedState.chats.map((chat: Chat) => {
            if (chat.messages) {
              // Remove duplicate message IDs
              const uniqueMessages = chat.messages.filter((msg, index, self) =>
                index === self.findIndex(m => m.id === msg.id)
              );
              return { ...chat, messages: uniqueMessages };
            }
            return chat;
          });
        }
        return persistedState;
      },
    }
  )
);

