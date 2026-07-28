'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { checklistApi } from '@/lib/api/tasks.api';
import { RecurrenceFrequency } from '@/lib/types/planning.types';

const CACHE_KEYS = {
  checklist: (taskId: string) => ['tasks', taskId, 'checklist'],
  task: (taskId: string) => ['tasks', taskId],
};

export function useChecklist(taskId: string | null) {
  return useQuery({
    queryKey: CACHE_KEYS.checklist(taskId || ''),
    queryFn: () => checklistApi.list(taskId!),
    enabled: !!taskId,
  });
}

export function useAddChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, label }: { taskId: string; label: string }) =>
      checklistApi.add(taskId, label),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.checklist(taskId) });
    },
  });
}

export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      ...data
    }: {
      taskId: string;
      itemId: string;
      label?: string;
      done?: boolean;
    }) => checklistApi.update(itemId, data),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.checklist(taskId) });
    },
  });
}

export function useDeleteChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId }: { taskId: string; itemId: string }) =>
      checklistApi.remove(itemId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.checklist(taskId) });
    },
  });
}

export function useSetRecurrence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      ...data
    }: {
      taskId: string;
      frequency: RecurrenceFrequency;
      interval?: number;
      until?: string;
      active?: boolean;
    }) => checklistApi.setRecurrence(taskId, data),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.task(taskId) });
    },
  });
}

export function useRemoveRecurrence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => checklistApi.removeRecurrence(taskId),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.task(taskId) });
    },
  });
}
