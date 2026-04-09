'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { companySettingsApi, CompanySettings } from '@/lib/api/company-settings.api';

const CACHE_KEYS = {
  all: ['company-settings'],
};

/**
 * Hook pour récupérer les paramètres de l'entreprise
 */
export function useCompanySettings() {
  return useQuery({
    queryKey: CACHE_KEYS.all,
    queryFn: () => companySettingsApi.getCompanySettings(),
    staleTime: 30 * 60 * 1000, // 30 min
  });
}

/**
 * Hook pour mettre à jour les paramètres de l'entreprise
 */
export function useUpdateCompanySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<CompanySettings>) =>
      companySettingsApi.updateCompanySettings(settings),
    onSuccess: () => {
      // Invalider les settings
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.all });
    },
  });
}
