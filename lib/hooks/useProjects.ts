'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api/projects.api';
import {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  JoinProjectByCodeRequest,
  JoinProjectByTokenRequest,
  AddProjectMemberRequest,
  UpdateMemberRoleRequest,
  TransferOwnershipRequest,
  InviteProjectMemberRequest,
} from '@/lib/types/project.types';
import { getApiError } from '@/lib/utils/api-error';
import {
  canContribute,
  canManage,
  canView,
  isOwner,
  resolveMyRole,
} from '@/lib/utils/project-permissions';
import { useAuthStore } from '@/lib/stores/auth.store';

const CACHE_KEYS = {
  all: ['projects'],
  myProjects: ['projects', 'my'],
  byId: (id: string) => ['projects', id],
  invitations: (id: string) => ['projects', id, 'invitations'],
};

/**
 * Hook pour récupérer mes projets
 */
export function useProjects() {
  return useQuery({
    queryKey: CACHE_KEYS.myProjects,
    queryFn: () => projectsApi.getMyProjects(),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

/**
 * Hook pour récupérer un projet par ID
 */
export function useProjectById(projectId: string | null) {
  return useQuery({
    queryKey: CACHE_KEYS.byId(projectId || ''),
    queryFn: () => projectsApi.getProjectById(projectId!),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

/**
 * Rôle de l'utilisateur courant sur un projet, avec les permissions dérivées.
 *
 * Source unique pour conditionner l'affichage des actions. Le serveur reste
 * l'autorité : ceci masque l'UI, ça ne remplace pas ses vérifications.
 */
export function useProjectRole(projectId: string | null) {
  const { data: project, isLoading } = useProjectById(projectId);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const role = project ? resolveMyRole(project, currentUserId) : null;

  return {
    role,
    isLoading,
    canView: canView(role),
    canContribute: canContribute(role),
    canManage: canManage(role),
    isOwner: isOwner(role),
  };
}

/**
 * Hook pour créer un projet
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectRequest) => projectsApi.createProject(data),
    onSuccess: () => {
      // Invalider liste projets
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myProjects });
    },
    onError: (error) => {
      console.error('Create project error:', getApiError(error));
    },
  });
}

/**
 * Hook pour mettre à jour un projet
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: string;
      data: UpdateProjectRequest;
    }) => projectsApi.updateProject(projectId, data),
    onSuccess: (_, { projectId }) => {
      // Invalider le projet ET la liste
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.byId(projectId) });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myProjects });
    },
  });
}

/**
 * Hook pour supprimer un projet
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => projectsApi.deleteProject(projectId),
    onSuccess: (_, projectId) => {
      // Invalider liste et projet
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myProjects });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.byId(projectId) });
    },
  });
}

/**
 * Hook pour ajouter un membre au projet
 */
export function useAddProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      userId,
      role,
    }: {
      projectId: string;
      userId: string;
      role?: AddProjectMemberRequest['role'];
    }) => projectsApi.addProjectMember(projectId, { userId, role }),
    onSuccess: (_, { projectId }) => {
      // Invalider le projet
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.byId(projectId) });
    },
  });
}

/**
 * Hook pour inviter par email : envoie le lien d'invitation du projet.
 * N'ajoute pas de membre immédiatement, donc pas d'invalidation nécessaire.
 */
export function useInviteProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      email,
      role,
    }: { projectId: string } & InviteProjectMemberRequest) =>
      projectsApi.inviteMember(projectId, { email, role }),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.invitations(projectId),
      });
    },
  });
}

/** Invitations du projet, affichées dans les paramètres. */
export function useProjectInvitations(projectId: string | null) {
  return useQuery({
    queryKey: CACHE_KEYS.invitations(projectId || ''),
    queryFn: () => projectsApi.listInvitations(projectId!),
    enabled: !!projectId,
  });
}

/** Révoque une invitation en attente : le lien envoyé cesse de fonctionner. */
export function useRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      invitationId,
    }: {
      projectId: string;
      invitationId: string;
    }) => projectsApi.revokeInvitation(projectId, invitationId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.invitations(projectId),
      });
    },
  });
}

/**
 * Détails publics d'une invitation. Ne requiert pas d'authentification :
 * la page d'atterrissage doit pouvoir s'afficher avant même la connexion.
 */
export function useInvitationPreview(token: string | null) {
  return useQuery({
    queryKey: ['invitations', 'preview', token],
    queryFn: () => projectsApi.previewInvitation(token!),
    enabled: !!token,
    retry: false,
  });
}

/** Accepte une invitation nominative et rejoint le projet. */
export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => projectsApi.acceptInvitation(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myProjects });
    },
  });
}

/**
 * Hook pour changer le rôle projet d'un membre
 */
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      userId,
      role,
    }: {
      projectId: string;
    } & UpdateMemberRoleRequest) =>
      projectsApi.updateMemberRole(projectId, { userId, role }),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.byId(projectId) });
    },
  });
}

/**
 * Hook pour transférer la propriété du projet.
 * Le rôle de l'utilisateur courant change : on invalide aussi la liste.
 */
export function useTransferOwnership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      newOwnerId,
    }: {
      projectId: string;
    } & TransferOwnershipRequest) =>
      projectsApi.transferOwnership(projectId, { newOwnerId }),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.byId(projectId) });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myProjects });
    },
  });
}

/**
 * Hook pour retirer un membre du projet
 */
export function useRemoveProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      userId,
    }: {
      projectId: string;
      userId: string;
    }) => projectsApi.removeProjectMember(projectId, userId),
    onSuccess: (_, { projectId }) => {
      // Invalider le projet
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.byId(projectId) });
    },
  });
}

/**
 * Hook pour rejoindre un projet via code
 */
export function useJoinProjectByCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JoinProjectByCodeRequest) =>
      projectsApi.joinProjectByCode(data),
    onSuccess: () => {
      // Invalider liste projets
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myProjects });
    },
  });
}

/**
 * Hook pour rejoindre un projet via token
 */
export function useJoinProjectByToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JoinProjectByTokenRequest) =>
      projectsApi.joinProjectByToken(data),
    onSuccess: () => {
      // Invalider liste projets
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myProjects });
    },
  });
}

/**
 * Hook pour régénérer le token d'invitation
 */
export function useRegenerateInviteToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) =>
      projectsApi.regenerateInviteToken(projectId),
    onSuccess: (_, projectId) => {
      // Invalider le projet
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.byId(projectId) });
    },
  });
}
