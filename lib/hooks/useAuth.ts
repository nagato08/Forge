'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth.store';
import { authApi } from '@/lib/api/auth.api';
import {
  User,
  LoginRequest,
  RegisterRequest,
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
      return authApi.login(data);
    },
    onSuccess: (response: AuthResponse) => {
      // Stocker token + user dans Zustand + localStorage
      login(response.access_token, response.user);

      // 🍪 Créer un cookie pour le middleware (30 jours)
      if (typeof window !== 'undefined') {
        const thirtyDays = 30 * 24 * 60 * 60;
        document.cookie = `auth-token=${response.access_token}; path=/; max-age=${thirtyDays}; SameSite=Lax`;
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
    mutationFn: (data: RegisterRequest) => {
      return authApi.register(data);
    },
    onSuccess: (response: AuthResponse) => {
      // Auto-login après inscription
      login(response.access_token, response.user);

      // 🍪 Créer un cookie pour le middleware (30 jours)
      if (typeof window !== 'undefined') {
        const thirtyDays = 30 * 24 * 60 * 60;
        document.cookie = `auth-token=${response.access_token}; path=/; max-age=${thirtyDays}; SameSite=Lax`;
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
      // Révoque le refresh token en base + efface le cookie httpOnly.
      // On n'échoue jamais le logout local si l'appel serveur échoue.
      try {
        await authApi.logout();
      } catch {
        // session déjà invalide côté serveur : on continue le nettoyage local
      }
    },
    onSuccess: () => {
      // Déconnecter Zustand (qui déconnecte aussi socket + supprime cookie)
      logout();
      // Invalider tous les caches
      queryClient.clear();
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
 * Hook pour récupérer tous les utilisateurs (ADMIN seulement, mais tentative pour tous)
 */
export function useUsers() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: CACHE_KEYS.users,
    queryFn: () => authApi.getAllUsers(),
    enabled: !!token, // Essayer si connecté
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

/**
 * Hook pour récupérer l'impact d'une suppression utilisateur
 */
export function useUserImpact(userId: string | null) {
  return useQuery({
    queryKey: ['users', userId, 'impact'],
    queryFn: () => authApi.getUserImpact(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook pour supprimer un utilisateur (avec réassignation optionnelle)
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { userId: string; reassignTo?: string }) => {
      return authApi.deleteUser(params.userId, params.reassignTo);
    },
    onSuccess: () => {
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
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: () => {
      // Invalider la liste des utilisateurs
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.users });
    },
  });
}

/**
 * Hook pour uploader un avatar
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (file: File) => authApi.uploadAvatar(file),
    onSuccess: (updatedUser) => {
      // Mettre à jour le store auth
      setUser(updatedUser);
      // Invalider le profil
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.profile });
    },
    onError: (error) => {
      console.error('❌ Avatar upload error:', getApiError(error));
    },
  });
}

/**
 * Hook pour récupérer les enums des départements
 */
export function useGetDepartmentEnums() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['auth', 'enums', 'departments'],
    queryFn: () => authApi.getDepartmentEnums(),
    enabled: !!token,
    staleTime: Infinity, // Les enums ne changent pas
  });
}
