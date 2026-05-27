'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { timeEntriesApi } from '@/lib/api/time-entries.api';
import { projectsApi } from '@/lib/api/projects.api';
import { ProjectStatus } from '@/lib/types/project.types';

const CACHE_KEYS = {
  active: ['time-entries', 'active'],
  myEntries: ['time-entries', 'my'],
  myEntiresByTask: (taskId: string) => ['time-entries', 'my', 'task', taskId],
  myEntriesByProject: (projectId: string) => [
    'time-entries',
    'my',
    'project',
    projectId,
  ],
  myStats: ['time-entries', 'my-stats'],
  myStatsByProject: (projectId: string) => [
    'time-entries',
    'my-stats',
    projectId,
  ],
  projectStats: (projectId: string) => ['time-entries', 'project', projectId, 'stats'],
};

/**
 * Hook pour récupérer le chronomètre actif
 */
export function useActiveTimer() {
  return useQuery({
    queryKey: CACHE_KEYS.active,
    queryFn: () => timeEntriesApi.getActiveTimer(),
    staleTime: 0, // Toujours fresh
    refetchInterval: 1000, // Refetch toutes les 1s pour timer live
  });
}

/**
 * Hook pour démarrer un chronomètre
 */
export function useStartTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const entry = await timeEntriesApi.startTimer(taskId);

      // Auto-transition project from PLANNING to ACTIVE
      if (entry.task?.projectId) {
        try {
          const project = await projectsApi.getProjectById(entry.task.projectId);
          if (project.status === ProjectStatus.PLANNING) {
            await projectsApi.updateProject(entry.task.projectId, {
              status: ProjectStatus.ACTIVE,
            });
          }
        } catch (err) {
          console.error('Failed to auto-transition project:', err);
          // Silently fail — timer started, project transition is optional
        }
      }

      return entry;
    },
    onSuccess: () => {
      // Invalider le chronomètre actif
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.active });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myEntries });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myStats });
      // Invalider workload + planning queries
      queryClient.invalidateQueries({ queryKey: ['planning', 'workload'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

/**
 * Hook pour arrêter le chronomètre
 */
export function useStopTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => timeEntriesApi.stopTimer(),
    onSuccess: () => {
      // Invalider le chronomètre actif et les entrées
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.active });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myEntries });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myStats });
      // Invalider workload queries
      queryClient.invalidateQueries({ queryKey: ['planning', 'workload'] });
    },
  });
}

/**
 * Hook pour ajouter une entrée manuelle
 */
export function useAddManualEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      taskId: string;
      startTime: string;
      endTime?: string;
      duration?: number;
    }) => {
      const entry = await timeEntriesApi.addManualEntry(data);

      // Auto-transition project from PLANNING to ACTIVE
      if (entry.task?.projectId) {
        try {
          const project = await projectsApi.getProjectById(entry.task.projectId);
          if (project.status === ProjectStatus.PLANNING) {
            await projectsApi.updateProject(entry.task.projectId, {
              status: ProjectStatus.ACTIVE,
            });
          }
        } catch (err) {
          console.error('Failed to auto-transition project:', err);
          // Silently fail — entry added, project transition is optional
        }
      }

      return entry;
    },
    onSuccess: () => {
      // Invalider les entrées et stats
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myEntries });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myStats });
      // Invalider workload + planning queries
      queryClient.invalidateQueries({ queryKey: ['planning', 'workload'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

/**
 * Hook pour récupérer mes entrées de temps
 */
export function useMyEntries(params?: {
  taskId?: string;
  projectId?: string;
}) {
  return useQuery({
    queryKey: params?.taskId
      ? CACHE_KEYS.myEntiresByTask(params.taskId)
      : params?.projectId
        ? CACHE_KEYS.myEntriesByProject(params.projectId)
        : CACHE_KEYS.myEntries,
    queryFn: () => timeEntriesApi.getMyEntries(params),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

/**
 * Hook pour récupérer mes stats de temps
 */
export function useMyTimeStats(projectId?: string) {
  return useQuery({
    queryKey: projectId
      ? CACHE_KEYS.myStatsByProject(projectId)
      : CACHE_KEYS.myStats,
    queryFn: () => timeEntriesApi.getMyStats(projectId),
    staleTime: 10 * 60 * 1000, // 10 min
  });
}

/**
 * Hook pour récupérer les stats d'un projet
 */
export function useProjectTimeStats(projectId: string | null) {
  return useQuery({
    queryKey: CACHE_KEYS.projectStats(projectId || ''),
    queryFn: () => timeEntriesApi.getProjectStats(projectId!),
    enabled: !!projectId,
    staleTime: 10 * 60 * 1000, // 10 min
  });
}

/**
 * Hook pour supprimer une entrée de temps
 */
export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => timeEntriesApi.deleteTimeEntry(entryId),
    onSuccess: () => {
      // Invalider les entrées et stats
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myEntries });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myStats });
    },
  });
}
