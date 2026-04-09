'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth.store';
import { authApi } from '@/lib/api/auth.api';
import {
  User,
  LoginRequest,
  CreateUserRequest,
  AuthResponse,
  ResetPasswordRequest,
} from '@/lib/types/user.types';
import { getApiError } from '@/lib/utils/api-error';

const CACHE_KEYS = {
  profile: ['auth', 'profile'],
  users: ['auth', 'users'],
};

/**
 * Hook pour se connecter
 */
export function useLogin() {
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: (data: LoginRequest) => {
      console.log('🔓 Login: calling API with', data.email);
      return authApi.login(data);
    },
    onSuccess: (response: AuthResponse) => {
      console.log('✅ Login API success:', {
        userId: response.user.id,
        role: response.user.role,
        tokenLength: response.access_token.length,
      });
      // Stocker token + user dans Zustand + localStorage
      login(response.access_token, response.user);
      console.log('✅ Zustand login() called, token stored');

      // 🍪 Créer un cookie pour le middleware (30 jours)
      if (typeof window !== 'undefined') {
        const thirtyDays = 30 * 24 * 60 * 60;
        document.cookie = `auth-token=${response.access_token}; path=/; max-age=${thirtyDays}; SameSite=Lax`;
        console.log('🍪 Cookie auth-token créé');
      }
    },
    onError: (error) => {
      console.error('❌ Login error:', getApiError(error));
    },
  });
}

/**
 * Hook pour s'inscrire
 */
export function useRegister() {
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: (data: CreateUserRequest) => {
      console.log('📝 Register: calling API with', data.email);
      return authApi.register(data);
    },
    onSuccess: (response: AuthResponse) => {
      console.log('✅ Register API success:', {
        userId: response.user.id,
        role: response.user.role,
      });
      // Auto-login après inscription
      login(response.access_token, response.user);
      console.log('✅ Zustand login() called after registration');

      // 🍪 Créer un cookie pour le middleware (30 jours)
      if (typeof window !== 'undefined') {
        const thirtyDays = 30 * 24 * 60 * 60;
        document.cookie = `auth-token=${response.access_token}; path=/; max-age=${thirtyDays}; SameSite=Lax`;
        console.log('🍪 Cookie auth-token créé');
      }
    },
    onError: (error) => {
      console.error('❌ Register error:', getApiError(error));
    },
  });
}

/**
 * Hook pour se déconnecter
 */
export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('🔓 Logout: clearing session...');
      return Promise.resolve();
    },
    onSuccess: () => {
      // Déconnecter Zustand (qui déconnecte aussi socket + supprime cookie)
      logout();
      // Invalider tous les caches
      queryClient.clear();
      console.log('✅ Logout complete, caches cleared');
    },
  });
}

/**
 * Hook pour récupérer le profil connecté
 */
export function useProfile() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: CACHE_KEYS.profile,
    queryFn: () => authApi.getProfile(),
    enabled: !!token, // Seulement si connecté
    staleTime: 10 * 60 * 1000, // 10 min
  });
}

/**
 * Hook pour récupérer tous les utilisateurs (ADMIN seulement)
 */
export function useUsers() {
  const role = useAuthStore((state) => state.role);

  return useQuery({
    queryKey: CACHE_KEYS.users,
    queryFn: () => authApi.getAllUsers(),
    enabled: role === 'ADMIN',
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

/**
 * Hook pour supprimer un utilisateur
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => {
      console.log('🗑️ Deleting user (soft delete):', userId);
      return authApi.deleteUser(userId);
    },
    onSuccess: () => {
      console.log('✅ User deleted successfully');
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.users });
    },
    onError: (error) => {
      console.error('❌ Delete user error:', getApiError(error));
    },
  });
}

/**
 * Hook pour mettre à jour le profil
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: Partial<User>) => authApi.updateProfile(data),
    onSuccess: (updatedUser) => {
      // Mettre à jour le store auth
      setUser(updatedUser);
      // Invalider le profil
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.profile });
    },
  });
}

/**
 * Hook pour demander réinitialisation de mot de passe
 */
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (data: ResetPasswordRequest) =>
      authApi.requestPasswordReset(data),
  });
}

/**
 * Hook pour vérifier un token de réinitialisation
 */
export function useVerifyResetToken() {
  return useMutation({
    mutationFn: (token: string) =>
      authApi.verifyResetPasswordToken({ token }),
  });
}

/**
 * Hook pour réinitialiser le mot de passe
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: (data: { token: string; password: string }) =>
      authApi.resetPassword(data),
  });
}

/**
 * Hook pour créer un utilisateur (par admin)
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserRequest) => authApi.register(data),
    onSuccess: () => {
      // Invalider la liste des utilisateurs
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.users });
    },
  });
}
