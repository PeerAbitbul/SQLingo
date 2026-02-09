import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { ToastMessage, ToastType } from '../components/Toast';

interface ToastState {
  toasts: ToastMessage[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (type, message, duration) => {
    const id = uuidv4();
    const newToast: ToastMessage = {
      id,
      type,
      message,
      duration: Math.max(0, duration || 5000), // Validate duration is non-negative
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));

// Helper functions for easier usage
export const showToast = {
  success: (message: string, duration?: number) => {
    useToastStore.getState().addToast('success', message, duration);
  },
  error: (message: string, duration?: number) => {
    useToastStore.getState().addToast('error', message, duration);
  },
  warning: (message: string, duration?: number) => {
    useToastStore.getState().addToast('warning', message, duration);
  },
  info: (message: string, duration?: number) => {
    useToastStore.getState().addToast('info', message, duration);
  },
};
