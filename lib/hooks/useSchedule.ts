'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { planningApi } from '@/lib/api/planning.api';

const CACHE_KEYS = {
  gantt: (projectId: string) => ['planning', 'gantt', projectId],
  pert: (projectId: string) => ['planning', 'pert', projectId],
  tasks: (projectId: string) => ['tasks', 'project', projectId],
};

/**
 * Déplace une tâche dans le Gantt.
 *
 * Pas de mise à jour optimiste : le serveur peut repousser d'autres tâches en
 * cascade, et deviner lesquelles côté client reviendrait à dupliquer la
 * logique de propagation. On attend donc sa réponse pour rafraîchir.
 */
export function useRescheduleTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      startDate,
      endDate,
    }: {
      projectId: string;
      taskId: string;
      startDate: string;
      endDate: string;
    }) => planningApi.rescheduleTask(taskId, startDate, endDate),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.gantt(projectId) });
      // Les dates alimentent aussi le PERT et le Kanban.
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.pert(projectId) });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.tasks(projectId) });
    },
  });
}

/** Fige les dates courantes comme référence de comparaison. */
export function useSetBaseline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => planningApi.setBaseline(projectId),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.gantt(projectId) });
    },
  });
}
