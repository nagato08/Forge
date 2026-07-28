'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { planningApi } from '@/lib/api/planning.api';
import { SprintStatus } from '@/lib/types/planning.types';

const CACHE_KEYS = {
  sprints: (projectId: string) => ['planning', 'sprints', projectId],
  gantt: (projectId: string) => ['planning', 'gantt', projectId],
  burndown: () => ['planning', 'burndown'],
  tasks: (projectId: string) => ['tasks', 'project', projectId],
};

export function useSprints(projectId: string | null) {
  return useQuery({
    queryKey: CACHE_KEYS.sprints(projectId || ''),
    queryFn: () => planningApi.listSprints(projectId!),
    enabled: !!projectId,
  });
}

export function useCreateSprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      ...data
    }: {
      projectId: string;
      name: string;
      goal?: string;
      startDate: string;
      endDate: string;
    }) => planningApi.createSprint(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.sprints(projectId),
      });
    },
  });
}

export function useUpdateSprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      sprintId,
      ...data
    }: {
      projectId: string;
      sprintId: string;
      name?: string;
      goal?: string;
      startDate?: string;
      endDate?: string;
      status?: SprintStatus;
    }) => planningApi.updateSprint(projectId, sprintId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.sprints(projectId),
      });
      // Les dates du sprint bornent la courbe : elle doit se recalculer.
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.burndown(),
      });
    },
  });
}

export function useDeleteSprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      sprintId,
    }: {
      projectId: string;
      sprintId: string;
    }) => planningApi.deleteSprint(projectId, sprintId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.sprints(projectId),
      });
      // Les tâches retournent au backlog : leur affichage change.
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.tasks(projectId) });
    },
  });
}

/** Rattache des tâches à un sprint, ou les renvoie au backlog (`sprintId` nul). */
export function useAssignSprintTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      taskIds,
      sprintId,
    }: {
      projectId: string;
      taskIds: string[];
      sprintId: string | null;
    }) => planningApi.assignSprintTasks(projectId, taskIds, sprintId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.sprints(projectId),
      });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.tasks(projectId) });
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.burndown(),
      });
    },
  });
}
