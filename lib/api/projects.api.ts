import api from './client';
import {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  JoinProjectByCodeRequest,
  JoinProjectByTokenRequest,
  AddProjectMemberRequest,
  UpdateMemberRoleRequest,
  TransferOwnershipRequest,
  ProjectMember,
  RegenerateTokenResponse,
} from '@/lib/types/project.types';

const BASE_URL = '/projects';

export const projectsApi = {
  /**
   * Créer un nouveau projet
   * POST /projects (JWT requis, ADMIN | PROJECT_MANAGER)
   */
  createProject: async (data: CreateProjectRequest): Promise<Project> => {
    const response = await api.post<Project>(`${BASE_URL}`, data);
    return response.data;
  },

  /**
   * Récupérer mes projets
   * GET /projects/my-projects (JWT requis)
   */
  getMyProjects: async (): Promise<Project[]> => {
    const response = await api.get<Project[]>(`${BASE_URL}/my-projects`);
    return response.data;
  },

  /**
   * Récupérer un projet par ID
   * GET /projects/:id (JWT requis)
   */
  getProjectById: async (projectId: string): Promise<Project> => {
    const response = await api.get<Project>(`${BASE_URL}/${projectId}`);
    return response.data;
  },

  /**
   * Mettre à jour un projet
   * PATCH /projects/:id (JWT requis)
   */
  updateProject: async (
    projectId: string,
    data: UpdateProjectRequest
  ): Promise<Project> => {
    const response = await api.patch<Project>(`${BASE_URL}/${projectId}`, data);
    return response.data;
  },

  /**
   * Supprimer un projet (soft delete)
   * DELETE /projects/:id (JWT requis)
   */
  deleteProject: async (projectId: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${projectId}`);
  },

  /**
   * Ajouter un membre au projet
   * POST /projects/:id/members (JWT requis)
   */
  addProjectMember: async (
    projectId: string,
    data: AddProjectMemberRequest
  ): Promise<Project> => {
    const response = await api.post<Project>(
      `${BASE_URL}/${projectId}/members`,
      data
    );
    return response.data;
  },

  /**
   * Retirer un membre du projet
   * DELETE /projects/:id/members (JWT requis)
   */
  removeProjectMember: async (
    projectId: string,
    userId: string
  ): Promise<Project> => {
    const response = await api.delete<Project>(
      `${BASE_URL}/${projectId}/members`,
      { data: { userId } }
    );
    return response.data;
  },

  /**
   * Changer le rôle projet d'un membre
   * PATCH /projects/:id/members/role (JWT requis, ADMIN projet)
   */
  updateMemberRole: async (
    projectId: string,
    data: UpdateMemberRoleRequest
  ): Promise<ProjectMember> => {
    const response = await api.patch<ProjectMember>(
      `${BASE_URL}/${projectId}/members/role`,
      data
    );
    return response.data;
  },

  /**
   * Transférer la propriété du projet à un autre membre
   * PATCH /projects/:id/transfer-ownership (JWT requis, OWNER)
   */
  transferOwnership: async (
    projectId: string,
    data: TransferOwnershipRequest
  ): Promise<Project> => {
    const response = await api.patch<Project>(
      `${BASE_URL}/${projectId}/transfer-ownership`,
      data
    );
    return response.data;
  },

  /**
   * Rejoindre un projet via code
   * POST /projects/join/code (JWT requis)
   */
  joinProjectByCode: async (
    data: JoinProjectByCodeRequest
  ): Promise<Project> => {
    const response = await api.post<Project>(`${BASE_URL}/join/code`, data);
    return response.data;
  },

  /**
   * Rejoindre un projet via token d'invitation
   * POST /projects/join/token (JWT requis)
   */
  joinProjectByToken: async (
    data: JoinProjectByTokenRequest
  ): Promise<Project> => {
    const response = await api.post<Project>(`${BASE_URL}/join/token`, data);
    return response.data;
  },

  /**
   * Régénérer le token d'invitation d'un projet
   * PATCH /projects/:id/regenerate-token (JWT requis)
   */
  regenerateInviteToken: async (
    projectId: string
  ): Promise<RegenerateTokenResponse> => {
    const response = await api.patch<RegenerateTokenResponse>(
      `${BASE_URL}/${projectId}/regenerate-token`
    );
    return response.data;
  },
};
