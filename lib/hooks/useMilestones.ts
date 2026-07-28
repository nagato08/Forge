'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { planningApi } from '@/lib/api/planning.api';

const CACHE_KEYS = {
  milestones: (projectId: string) => ['planning', 'milestones', projectId],
  gantt: (projectId: string) => ['planning', 'gantt', projectId],
  pert: (projectId: string) => ['planning', 'pert', projectId],
};

/** Les jalons apparaissent aussi sur le Gantt et le PERT : on invalide les trois. */
function invalidateAll(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string
) {
  queryClient.invalidateQueries({ queryKey: CACHE_KEYS.milestones(projectId) });
  queryClient.invalidateQueries({ queryKey: CACHE_KEYS.gantt(projectId) });
  queryClient.invalidateQueries({ queryKey: CACHE_KEYS.pert(projectId) });
}

export function useMilestones(projectId: string | null) {
  return useQuery({
    queryKey: CACHE_KEYS.milestones(projectId || ''),
    queryFn: () => planningApi.listMilestones(projectId!),
    enabled: !!projectId,
  });
}

export function useCreateMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      ...data
    }: {
      projectId: string;
      name: string;
      description?: string;
      date: string;
    }) => planningApi.createMilestone(projectId, data),
    onSuccess: (_, { projectId }) => invalidateAll(queryClient, projectId),
  });
}

export function useUpdateMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      milestoneId,
      ...data
    }: {
      projectId: string;
      milestoneId: string;
      name?: string;
      description?: string;
      date?: string;
      reached?: boolean;
    }) => planningApi.updateMilestone(projectId, milestoneId, data),
    onSuccess: (_, { projectId }) => invalidateAll(queryClient, projectId),
  });
}

export function useDeleteMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      milestoneId,
    }: {
      projectId: string;
      milestoneId: string;
    }) => planningApi.deleteMilestone(projectId, milestoneId),
    onSuccess: (_, { projectId }) => invalidateAll(queryClient, projectId),
  });
}
