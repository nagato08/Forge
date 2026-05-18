import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
}

interface ToastOptions {
  title?: string;
  /** Durée d'affichage en ms (0 = ne se ferme pas automatiquement) */
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  add: (toast: Omit<Toast, 'id'>) => string;
  remove: (id: string) => void;
  clear: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) => {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    return id;
  },
  remove: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

function show(type: ToastType, message: string, options?: ToastOptions) {
  return useToastStore.getState().add({
    type,
    message,
    title: options?.title,
    duration: options?.duration ?? 5000,
  });
}

/**
 * API impérative — appelable depuis n'importe où (hooks, callbacks, lib).
 * Exemple : toast.error("Email ou mot de passe incorrect")
 */
export const toast = {
  success: (message: string, options?: ToastOptions) => show('success', message, options),
  error: (message: string, options?: ToastOptions) => show('error', message, options),
  info: (message: string, options?: ToastOptions) => show('info', message, options),
  warning: (message: string, options?: ToastOptions) => show('warning', message, options),
  dismiss: (id: string) => useToastStore.getState().remove(id),
};
