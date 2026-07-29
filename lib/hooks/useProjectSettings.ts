'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  projectSettingsApi,
  UpdateProjectSettingsRequest,
} from '@/lib/api/project-settings.api';

const CACHE_KEYS = {
  settings: (projectId: string) => ['projects', projectId, 'settings'],
};

export function useProjectSettings(projectId: string | null) {
  return useQuery({
    queryKey: CACHE_KEYS.settings(projectId || ''),
    queryFn: () => projectSettingsApi.getSettings(projectId!),
    enabled: !!projectId,
  });
}

export function useUpdateProjectSettings(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProjectSettingsRequest) =>
      projectSettingsApi.updateSettings(projectId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(CACHE_KEYS.settings(projectId), updated);
      // La charge (workload) et, plus tard, les alertes lisent ces reglages
      // cote serveur : leur cache doit refleter le changement au prochain
      // rendu, pas rester sur une valeur perimee.
      queryClient.invalidateQueries({ queryKey: ['planning', 'workload'] });
    },
  });
}
