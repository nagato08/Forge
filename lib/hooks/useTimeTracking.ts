'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { timeEntriesApi } from '@/lib/api/time-entries.api';

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
    mutationFn: (taskId: string) => timeEntriesApi.startTimer(taskId),
    onSuccess: () => {
      // Invalider le chronomètre actif
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.active });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myEntries });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myStats });
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
    },
  });
}

/**
 * Hook pour ajouter une entrée manuelle
 */
export function useAddManualEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      taskId: string;
      startTime: string;
      endTime?: string;
      duration?: number;
    }) => timeEntriesApi.addManualEntry(data),
    onSuccess: () => {
      // Invalider les entrées et stats
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myEntries });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myStats });
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
