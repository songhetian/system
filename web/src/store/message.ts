import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: number;
  type: 'workflow' | 'leave' | 'overtime' | 'expense' | 'system';
  title: string;
  content: string;
  data: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

interface MessageState {
  messages: Message[];
  addMessage: (message: Omit<Message, 'id'>) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  deleteMessage: (id: number) => void;
  getUnreadCount: () => number;
}

export const useMessageStore = create<MessageState>()(
  persist(
    (set, get) => ({
      messages: [],
      addMessage: (message) => {
        set((state) => ({
          messages: [{ ...message, id: Date.now() }, ...state.messages].slice(0, 100),
        }));
      },
      markAsRead: (id) => {
        set((state) => ({
          messages: state.messages.map((m) => (m.id === id ? { ...m, read: true } : m)),
        }));
      },
      markAllAsRead: () => {
        set((state) => ({
          messages: state.messages.map((m) => ({ ...m, read: true })),
        }));
      },
      deleteMessage: (id) => {
        set((state) => ({
          messages: state.messages.filter((m) => m.id !== id),
        }));
      },
      getUnreadCount: () => {
        return get().messages.filter((m) => !m.read).length;
      },
    }),
    {
      name: 'shop-message-storage',
    },
  ),
);