import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
}

interface UIActions {
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      theme: 'light', // défaut sombre
      sidebarOpen: true,

      setTheme: (theme) => {
        set({ theme });
        // Appliquer le thème au document
        document.documentElement.setAttribute('data-theme', theme);
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({ theme: state.theme, sidebarOpen: state.sidebarOpen }),
    }
  )
);

// Appliquer le thème au chargement
if (typeof window !== 'undefined') {
  const theme = useUIStore.getState().theme;
  document.documentElement.setAttribute('data-theme', theme);
}