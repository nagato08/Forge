'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { planningApi } from '@/lib/api/planning.api';
import {
  GanttData,
  PertData,
  BurndownData,
  WorkloadData,
  DashboardStatusDonut,
  EisenhowerData,
} from '@/lib/types/planning.types';

const CACHE_KEYS = {
  gantt: (projectId: string) => ['planning', 'gantt', projectId],
  pert: (projectId: string) => ['planning', 'pert', projectId],
  burndown: (projectId: string, startDate?: string, endDate?: string) => [
    'planning',
    'burndown',
    projectId,
    startDate,
    endDate,
  ],
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

  useEffect(() => {
    if (query.data && query.data.tasks) {
      console.log('📊 Gantt data loaded:', query.data.tasks.length, 'tasks');
    }
  }, [query.data]);

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

  useEffect(() => {
    if (query.data && query.data.nodes && query.data.criticalPath) {
      console.log('🔗 PERT data loaded:', query.data.nodes.length, 'nodes,', query.data.criticalPath.length, 'in critical path');
    }
  }, [query.data]);

  return query;
}

/**
 * Hook pour récupérer données Burndown
 */
export function useBurndown(
  projectId: string | null,
  params?: { startDate?: string; endDate?: string }
) {
  const query = useQuery({
    queryKey: CACHE_KEYS.burndown(
      projectId || '',
      params?.startDate,
      params?.endDate
    ),
    queryFn: () => planningApi.getBurndown(projectId!, params),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 min
  });

  useEffect(() => {
    if (query.data && query.data.dates) {
      console.log('📈 Burndown data loaded:', query.data.dates.length, 'dates');
    }
  }, [query.data]);

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

  useEffect(() => {
    if (query.data && query.data.entries) {
      console.log('⚙️ Workload data loaded:', query.data.entries.length, 'entries, total:', query.data.totalHours, 'hours');
    }
  }, [query.data]);

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

  useEffect(() => {
    if (query.data && typeof query.data.TODO === 'number') {
      console.log('🍩 Status donut loaded: TODO:', query.data.TODO, 'DOING:', query.data.DOING, 'DONE:', query.data.DONE);
    }
  }, [query.data]);

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

  useEffect(() => {
    if (query.data && query.data.urgent_important) {
      console.log('⚔️ Eisenhower matrix loaded:', query.data.urgent_important.length, 'urgent+important,', query.data.urgent_not_important.length, 'urgent');
    }
  }, [query.data]);

  return query;
}
