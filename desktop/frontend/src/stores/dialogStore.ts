import { create } from 'zustand';

interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string | null; // null = alert mode (no cancel)
  variant: 'danger' | 'default';
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
}

interface DialogStore extends DialogState {
  confirm: (opts: {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'default';
  }) => Promise<boolean>;
  alert: (opts: { title?: string; message: string }) => Promise<void>;
  close: () => void;
}

const initial: DialogState = {
  isOpen: false,
  title: '',
  message: '',
  confirmLabel: 'OK',
  cancelLabel: 'Cancel',
  variant: 'default',
  onConfirm: null,
  onCancel: null,
};

export const useDialogStore = create<DialogStore>((set) => ({
  ...initial,

  confirm: (opts) =>
    new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        title: opts.title || '',
        message: opts.message,
        confirmLabel: opts.confirmLabel || 'OK',
        cancelLabel: opts.cancelLabel || 'Cancel',
        variant: opts.variant || 'default',
        onConfirm: () => {
          set(initial);
          resolve(true);
        },
        onCancel: () => {
          set(initial);
          resolve(false);
        },
      });
    }),

  alert: (opts) =>
    new Promise<void>((resolve) => {
      set({
        isOpen: true,
        title: opts.title || '',
        message: opts.message,
        confirmLabel: 'OK',
        cancelLabel: null,
        variant: 'default',
        onConfirm: () => {
          set(initial);
          resolve();
        },
        onCancel: null,
      });
    }),

  close: () => set(initial),
}));

// Shortcut helpers (usable outside React)
export const showDialog = {
  confirm: (opts: Parameters<DialogStore['confirm']>[0]) =>
    useDialogStore.getState().confirm(opts),
  alert: (opts: Parameters<DialogStore['alert']>[0]) =>
    useDialogStore.getState().alert(opts),
};
