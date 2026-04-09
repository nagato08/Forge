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
} from '@/lib/types/project.types';
import { getApiError } from '@/lib/utils/api-error';

const CACHE_KEYS = {
  all: ['projects'],
  myProjects: ['projects', 'my'],
  byId: (id: string) => ['projects', id],
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
    }: {
      projectId: string;
      userId: string;
    }) => projectsApi.addProjectMember(projectId, { userId }),
    onSuccess: (_, { projectId }) => {
      // Invalider le projet
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.byId(projectId) });
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
