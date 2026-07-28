import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export enum Role {
  ADMIN = 'ADMIN',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  department?: string;
  jobTitle?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  role: Role | null;
  isLoading: boolean;
}

interface AuthActions {
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  refreshToken: (token: string) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      role: null,
      isLoading: false,

      login: (token, user) => {
        set({
          user,
          token,
          role: user.role,
          isLoading: false,
        });
        // La connexion temps reel est ouverte par SocketProvider, qui observe
        // le jeton : la rebrancher ici recreerait le cycle d'imports.
      },

      logout: () => {
        set({
          user: null,
          token: null,
          role: null,
          isLoading: false,
        });
        // Nettoyer le localStorage
        localStorage.removeItem('auth-store');
        // Supprimer le cookie
        if (typeof window !== 'undefined') {
          document.cookie = 'auth-token=; path=/; max-age=0';
        }
      },

      setUser: (user) => {
        set({ user, role: user.role });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      refreshToken: (token) => {
        set({ token });
        // Le cookie doit suivre le renouvellement : le proxy s'en sert pour
        // lire le rôle et décider des redirections. Sans cette ligne il
        // conserve indéfiniment le tout premier access token, périmé au bout
        // de 15 minutes, et le proxy raisonne sur une donnée morte.
        if (typeof window !== 'undefined') {
          const thirtyDays = 30 * 24 * 60 * 60;
          document.cookie = `auth-token=${token}; path=/; max-age=${thirtyDays}; SameSite=Lax`;
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        role: state.role,
      }),
    }
  )
);