import api from './client';
import {
  User,
  CreateUserRequest,
  LoginRequest,
  AuthResponse,
  ResetPasswordRequest,
  VerifyResetTokenRequest,
  ResetPasswordWithTokenRequest,
} from '@/lib/types/user.types';

const BASE_URL = '/auth';

export const authApi = {
  /**
   * Inscription utilisateur
   * POST /auth/register
   */
  register: async (data: CreateUserRequest): Promise<AuthResponse> => {
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
   * Supprimer un utilisateur
   * DELETE /auth/:id (ADMIN seulement)
   */
  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${userId}`);
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
