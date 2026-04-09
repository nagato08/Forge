import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { initializeSocket, disconnectSocket } from '@/lib/socket/socket.client';

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
        console.log('🔐 Auth store login() called:', {
          userId: user.id,
          role: user.role,
          tokenLength: token.length,
        });
        set({
          user,
          token,
          role: user.role,
          isLoading: false,
        });
        console.log('✅ Auth state updated, token stored in Zustand');
        // Initialiser socket après login
        if (typeof window !== 'undefined') {
          console.log('🔌 Initializing socket...');
          initializeSocket();
        }
      },

      logout: () => {
        console.log('🔐 Auth store logout() called');
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
          console.log('🍪 Cookie auth-token supprimé');
        }
        // Déconnecter socket
        if (typeof window !== 'undefined') {
          disconnectSocket();
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