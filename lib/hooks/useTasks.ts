'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks.api';
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  UpdateTaskStatusRequest,
  AssignTaskRequest,
  AddTaskDependencyRequest,
  AddTaskCommentRequest,
} from '@/lib/types/task.types';
import { useSocketEvent } from '@/lib/hooks/useSocket';
import { getApiError } from '@/lib/utils/api-error';

const CACHE_KEYS = {
  all: ['tasks'],
  projectTasks: (projectId: string) => ['tasks', 'project', projectId],
  myTasks: ['tasks', 'my'],
  byId: (id: string) => ['tasks', id],
};

/**
 * Hook pour récupérer les tâches d'un projet (Kanban)
 */
export function useTasks(projectId: string | null) {
  const queryClient = useQueryClient();

  // Écouter les mises à jour en temps réel
  useSocketEvent('task:updated', () => {
    if (projectId) {
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.projectTasks(projectId),
      });
    }
  });

  return useQuery({
    queryKey: CACHE_KEYS.projectTasks(projectId || ''),
    queryFn: () => tasksApi.getProjectTasks(projectId!),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 min
  });
}

/**
 * Hook pour récupérer mes tâches assignées
 */
export function useMyTasks() {
  const queryClient = useQueryClient();

  // Écouter les mises à jour en temps réel
  useSocketEvent('task:updated', () => {
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myTasks });
  });

  return useQuery({
    queryKey: CACHE_KEYS.myTasks,
    queryFn: () => tasksApi.getMyTasks(),
    staleTime: 2 * 60 * 1000, // 2 min
  });
}

/**
 * Hook pour récupérer une tâche par ID
 */
export function useTaskById(taskId: string | null) {
  return useQuery({
    queryKey: CACHE_KEYS.byId(taskId || ''),
    queryFn: () => tasksApi.getTaskById(taskId!),
    enabled: !!taskId,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

/**
 * Hook pour créer une tâche
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskRequest) => tasksApi.createTask(data),
    onSuccess: (task) => {
      // Invalider liste tâches du projet
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.projectTasks(task.projectId),
      });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myTasks });
    },
    onError: (error) => {
      console.error('❌ Create task error:', getApiError(error));
    },
  });
}

/**
 * Hook pour mettre à jour une tâche
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      data,
    }: {
      taskId: string;
      data: UpdateTaskRequest;
    }) => tasksApi.updateTask(taskId, data),
    onSuccess: (task, { taskId }) => {
      // Mettre à jour immédiatement le cache
      queryClient.setQueryData(CACHE_KEYS.byId(taskId), task);
      // Invalider aussi les listes pour se rafraîchir
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.projectTasks(task.projectId),
      });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myTasks });
      // Le rattachement à une phase change son avancement calculé : sans
      // cette invalidation, la feuille de route resterait figée sur
      // l'ancien pourcentage jusqu'au prochain rechargement complet.
      queryClient.invalidateQueries({
        queryKey: ['planning', 'phases', task.projectId],
      });
    },
    onError: (error) => {
      console.error('❌ Update task error:', getApiError(error));
    },
  });
}

/**
 * Hook pour supprimer une tâche
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => {
      return tasksApi.deleteTask(taskId);
    },
    onSuccess: () => {
      // Invalider toutes les listes
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.all });
    },
    onError: (error) => {
      console.error('❌ Delete task error:', getApiError(error));
    },
  });
}

/**
 * Hook pour mettre à jour le statut d'une tâche
 */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      status,
    }: {
      taskId: string;
      status: UpdateTaskStatusRequest;
    }) => tasksApi.updateTaskStatus(taskId, status),
    onSuccess: (task, { taskId }) => {
      queryClient.setQueryData(CACHE_KEYS.byId(taskId), task);
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.projectTasks(task.projectId),
      });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myTasks });
      // Le statut du projet peut avoir changé (PLANNING → ACTIVE) → rafraîchir
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      // Terminer une tâche change l'avancement de sa phase, calculé côté
      // serveur : sans cette invalidation, cocher une tâche sur le Kanban
      // ne ferait bouger la feuille de route qu'au rechargement complet.
      queryClient.invalidateQueries({
        queryKey: ['planning', 'phases', task.projectId],
      });
    },
    onError: (error) => {
      console.error('❌ Update task status error:', getApiError(error));
    },
  });
}

/**
 * Hook pour assigner une tâche
 */
export function useAssignTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      userIds,
    }: {
      taskId: string;
      userIds: string[];
    }) => tasksApi.assignTask(taskId, { userIds }),
    onSuccess: async (task, { taskId }) => {
      // Forcer un refetch complet pour obtenir les relations
      await queryClient.refetchQueries({ queryKey: CACHE_KEYS.byId(taskId) });
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.projectTasks(task.projectId),
      });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myTasks });
    },
    onError: (error) => {
      console.error('❌ Assign task error:', getApiError(error));
    },
  });
}

/**
 * Hook pour retirer une assignation
 */
export function useUnassignTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      userId,
    }: {
      taskId: string;
      userId: string;
    }) => tasksApi.unassignTask(taskId, userId),
    onSuccess: async (task, { taskId }) => {
      // Forcer un refetch complet pour obtenir les relations
      await queryClient.refetchQueries({ queryKey: CACHE_KEYS.byId(taskId) });
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.projectTasks(task.projectId),
      });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myTasks });
    },
    onError: (error) => {
      console.error('❌ Unassign task error:', getApiError(error));
    },
  });
}

/**
 * Hook pour ajouter une dépendance
 */
export function useAddTaskDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      blockedTaskId,
    }: {
      taskId: string;
      blockedTaskId: string;
    }) =>
      tasksApi.addDependency(taskId, { blockedTaskId }),
    onSuccess: (task, { taskId, blockedTaskId }) => {
      // Mettre à jour immédiatement le cache de la tâche
      queryClient.setQueryData(CACHE_KEYS.byId(taskId), task);
      // Invalider la tâche bloquée
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.byId(blockedTaskId),
      });
    },
    onError: (error) => {
      console.error('❌ Add dependency error:', getApiError(error));
    },
  });
}

/**
 * Hook pour retirer une dépendance
 */
export function useRemoveTaskDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      blockedTaskId,
    }: {
      taskId: string;
      blockedTaskId: string;
    }) => tasksApi.removeDependency(taskId, blockedTaskId),
    onSuccess: (task, { taskId, blockedTaskId }) => {
      // Mettre à jour immédiatement le cache de la tâche
      queryClient.setQueryData(CACHE_KEYS.byId(taskId), task);
      // Invalider la tâche bloquée
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.byId(blockedTaskId) });
    },
    onError: (error) => {
      console.error('❌ Remove dependency error:', getApiError(error));
    },
  });
}

/**
 * Hook pour ajouter un commentaire
 */
export function useAddTaskComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      content,
      mentions,
    }: {
      taskId: string;
      content: string;
      mentions?: string[];
    }) => tasksApi.addComment(taskId, { content, mentions }),
    onSuccess: (_, { taskId }) => {
      // Invalider la tâche pour rafraîchir les commentaires
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.byId(taskId) });
    },
    onError: (error) => {
      console.error('❌ Add comment error:', getApiError(error));
    },
  });
}

/**
 * Hook pour supprimer un commentaire
 */
export function useDeleteTaskComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => tasksApi.deleteComment(commentId),
    onSuccess: () => {
      // Invalider toutes les tâches (on ne sait pas laquelle)
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.all });
    },
    onError: (error) => {
      console.error('❌ Delete comment error:', getApiError(error));
    },
  });
}
