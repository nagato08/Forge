import api from './client';
import {
  User,
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  ResetPasswordRequest,
  VerifyResetTokenRequest,
  ResetPasswordWithTokenRequest,
} from '@/lib/types/user.types';

const BASE_URL = '/auth';

export interface UserImpact {
  user: { id: string; firstName: string; lastName: string; email: string };
  projectsOwned: { id: string; name: string; status: string }[];
  tasksAssigned: {
    id: string;
    title: string;
    status: string;
    projectId: string;
    project: { id: string; name: string };
  }[];
  projectsMember: { id: string; name: string }[];
  hasImpact: boolean;
}

export const authApi = {
  /**
   * Inscription utilisateur
   * POST /auth/register
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(`${BASE_URL}/register`, data);
    return response.data;
  },

  /**
   * Connexion utilisateur
   * POST /auth/login
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(`${BASE_URL}/login`, data);
    return response.data;
  },

  /**
   * Renouveler l'access token via le refresh cookie (httpOnly)
   * POST /auth/refresh
   */
  refresh: async (): Promise<{ access_token: string }> => {
    const response = await api.post<{ access_token: string }>(
      `${BASE_URL}/refresh`
    );
    return response.data;
  },

  /**
   * Déconnexion : révoque le refresh token courant côté serveur
   * POST /auth/logout
   */
  logout: async (): Promise<void> => {
    await api.post(`${BASE_URL}/logout`);
  },

  /**
   * Déconnexion de tous les appareils (JWT requis)
   * POST /auth/logout-all
   */
  logoutAll: async (): Promise<{ revoked: number }> => {
    const response = await api.post<{ revoked: number }>(
      `${BASE_URL}/logout-all`
    );
    return response.data;
  },

  /**
   * Récupérer profil de l'utilisateur connecté
   * GET /auth/profile (JWT requis)
   */
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>(`${BASE_URL}/profile`);
    return response.data;
  },

  /**
   * Récupérer tous les utilisateurs
   * GET /auth/users (ADMIN seulement)
   */
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>(`${BASE_URL}/users`);
    return response.data;
  },

  /**
   * Récupérer l'impact d'une suppression utilisateur
   * GET /auth/users/:id/impact (ADMIN seulement)
   */
  getUserImpact: async (userId: string): Promise<UserImpact> => {
    const response = await api.get<UserImpact>(
      `${BASE_URL}/users/${userId}/impact`,
    );
    return response.data;
  },

  /**
   * Supprimer un utilisateur (avec réassignation optionnelle)
   * DELETE /auth/:id (ADMIN seulement)
   */
  deleteUser: async (
    userId: string,
    reassignTo?: string,
  ): Promise<void> => {
    await api.delete(`${BASE_URL}/${userId}`, {
      data: reassignTo ? { reassignTo } : undefined,
    });
  },

  /**
   * RGPD — exporte mes propres données personnelles en JSON.
   * GET /auth/profile/export (JWT requis)
   */
  exportMyData: async (): Promise<Record<string, unknown>> => {
    const response = await api.get(`${BASE_URL}/profile/export`);
    return response.data as Record<string, unknown>;
  },

  /**
   * RGPD — demande la suppression de mon propre compte.
   *
   * Échoue en 400 si je possède des projets actifs sans remplaçant désigné :
   * le message renvoyé par le serveur explique alors la marche à suivre.
   * DELETE /auth/profile (JWT requis)
   */
  deleteMyAccount: async (reassignTo?: string): Promise<void> => {
    await api.delete(`${BASE_URL}/profile`, {
      data: reassignTo ? { reassignTo } : undefined,
    });
  },

  /**
   * Demander réinitialisation de mot de passe
   * POST /auth/request-reset-password
   */
  requestPasswordReset: async (
    data: ResetPasswordRequest
  ): Promise<{ message: string; token: string }> => {
    const response = await api.post<{ message: string; token: string }>(
      `${BASE_URL}/request-reset-password`,
      data
    );
    return response.data;
  },

  /**
   * Vérifier si un token de réinitialisation est valide
   * GET /auth/verify-reset-password-token?token=xxx
   */
  verifyResetPasswordToken: async (
    data: VerifyResetTokenRequest
  ): Promise<{ valid: boolean }> => {
    const response = await api.get<{ valid: boolean }>(
      `${BASE_URL}/verify-reset-password-token`,
      { params: { token: data.token } }
    );
    return response.data;
  },

  /**
   * Réinitialiser mot de passe avec token
   * POST /auth/reset-password
   */
  resetPassword: async (
    data: ResetPasswordWithTokenRequest
  ): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(
      `${BASE_URL}/reset-password`,
      data
    );
    return response.data;
  },

  /**
   * Mettre à jour le profil de l'utilisateur connecté
   * PATCH /auth/profile (JWT requis)
   */
  updateProfile: async (
    data: Partial<User>
  ): Promise<User> => {
    const response = await api.patch<User>(`${BASE_URL}/profile`, data);
    return response.data;
  },

  /**
   * Uploader un avatar
   * POST /auth/profile/avatar (JWT requis)
   */
  uploadAvatar: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<User>(
      `${BASE_URL}/profile/avatar`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Récupérer les valeurs enum des départements
   * GET /auth/enums/departments
   */
  getDepartmentEnums: async (): Promise<string[]> => {
    const response = await api.get<string[]>(`${BASE_URL}/enums/departments`);
    return response.data;
  },
};
