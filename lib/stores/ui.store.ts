import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  theme: 'light' | 'dark';
  /** Panneau off-canvas mobile : montré/caché, sans rapport avec le collapse desktop. */
  sidebarOpen: boolean;
  /** Largeur réduite (icônes seules) sur desktop — préférence persistante. */
  sidebarCollapsed: boolean;
}

interface UIActions {
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      theme: 'light', // défaut sombre
      sidebarOpen: true,
      sidebarCollapsed: false,

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

      toggleSidebarCollapsed: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

// Appliquer le thème au chargement
if (typeof window !== 'undefined') {
  const theme = useUIStore.getState().theme;
  document.documentElement.setAttribute('data-theme', theme);
}