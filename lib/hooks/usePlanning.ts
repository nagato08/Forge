'use client';

import { useQuery } from '@tanstack/react-query';
import { planningApi } from '@/lib/api/planning.api';
import {
  GanttTask,
  PertData,
  BurndownData,
  WorkloadData,
  DashboardStatusDonut,
  EisenhowerData,
} from '@/lib/types/planning.types';

const CACHE_KEYS = {
  gantt: (projectId: string) => ['planning', 'gantt', projectId],
  pert: (projectId: string) => ['planning', 'pert', projectId],
  burndown: (
    projectId: string,
    startDate?: string,
    endDate?: string,
    sprintId?: string
  ) => ['planning', 'burndown', projectId, startDate, endDate, sprintId],
  workload: (startDate: string, endDate: string, projectId?: string) => [
    'planning',
    'workload',
    startDate,
    endDate,
    projectId,
  ],
  statusDonut: (projectId: string) => ['planning', 'statusDonut', projectId],
  eisenhower: (projectId: string) => ['planning', 'eisenhower', projectId],
};

/**
 * Hook pour récupérer données Gantt
 */
export function useGantt(projectId: string | null) {
  const query = useQuery({
    queryKey: CACHE_KEYS.gantt(projectId || ''),
    queryFn: () => planningApi.getGantt(projectId!),
    enabled: !!projectId,
    staleTime: 10 * 60 * 1000, // 10 min
  });


  return query;
}

/**
 * Hook pour récupérer réseau PERT
 */
export function usePert(projectId: string | null) {
  const query = useQuery({
    queryKey: CACHE_KEYS.pert(projectId || ''),
    queryFn: () => planningApi.getPert(projectId!),
    enabled: !!projectId,
    staleTime: 10 * 60 * 1000, // 10 min
  });


  return query;
}

/**
 * Hook pour récupérer données Burndown
 */
export function useBurndown(
  projectId: string | null,
  params?: { startDate?: string; endDate?: string; sprintId?: string }
) {
  const query = useQuery({
    queryKey: CACHE_KEYS.burndown(
      projectId || '',
      params?.startDate,
      params?.endDate,
      params?.sprintId
    ),
    queryFn: () => planningApi.getBurndown(projectId!, params),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 min
  });


  return query;
}

/**
 * Hook pour récupérer données Workload
 */
export function useWorkload(params: {
  startDate: string;
  endDate: string;
  projectId?: string;
  groupBy?: 'day' | 'week';
}) {
  const query = useQuery({
    queryKey: CACHE_KEYS.workload(
      params.startDate,
      params.endDate,
      params.projectId
    ),
    queryFn: () => planningApi.getWorkload(params),
    staleTime: 10 * 60 * 1000, // 10 min
  });


  return query;
}

/**
 * Hook pour récupérer statut des tâches (donut)
 */
export function useStatusDonut(projectId: string | null) {
  const query = useQuery({
    queryKey: CACHE_KEYS.statusDonut(projectId || ''),
    queryFn: () => planningApi.getStatusDonut(projectId!),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 min
  });


  return query;
}

/**
 * Hook pour récupérer matrice Eisenhower
 */
export function useEisenhower(projectId: string | null) {
  const query = useQuery({
    queryKey: CACHE_KEYS.eisenhower(projectId || ''),
    queryFn: () => planningApi.getEisenhower(projectId!),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 min
  });


  return query;
}
