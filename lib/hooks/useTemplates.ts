'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { templatesApi } from '@/lib/api/templates.api';

const CACHE_KEYS = {
  all: ['project-templates'] as const,
  byId: (id: string) => ['project-templates', id] as const,
  myProjects: ['projects', 'my'],
};

export function useTemplates() {
  return useQuery({
    queryKey: CACHE_KEYS.all,
    queryFn: () => templatesApi.list(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTemplate(templateId: string | null) {
  return useQuery({
    queryKey: CACHE_KEYS.byId(templateId || ''),
    queryFn: () => templatesApi.getById(templateId!),
    enabled: !!templateId,
  });
}

export function useCreateTemplateFromProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      projectId: string;
      name: string;
      description?: string;
      isShared?: boolean;
    }) => templatesApi.createFromProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.all });
    },
  });
}

/** Crée un projet à partir du modèle : la liste des projets change. */
export function useInstantiateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      ...data
    }: {
      templateId: string;
      name: string;
      startDate: string;
    }) => templatesApi.instantiate(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myProjects });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => templatesApi.remove(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.all });
    },
  });
}
