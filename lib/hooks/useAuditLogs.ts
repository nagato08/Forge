'use client';

import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/lib/api/audit.api';
import { AuditLogFilters, AuditLogListParams } from '@/lib/types/audit.types';

const CACHE_KEYS = {
  all: ['audit-logs'] as const,
  list: (params: AuditLogListParams) => ['audit-logs', 'list', params] as const,
  filterOptions: ['audit-logs', 'filter-options'] as const,
  stats: (filters: AuditLogFilters) =>
    ['audit-logs', 'stats', filters] as const,
};

/**
 * Page courante du journal.
 *
 * `placeholderData` conserve la page précédente pendant le chargement de la
 * suivante : le tableau ne clignote pas à chaque changement de filtre.
 */
export function useAuditLogs(params: AuditLogListParams) {
  return useQuery({
    queryKey: CACHE_KEYS.list(params),
    queryFn: () => auditApi.list(params),
    placeholderData: (previous) => previous,
    staleTime: 30 * 1000,
  });
}

/** Valeurs distinctes des filtres. Change rarement : cache long. */
export function useAuditFilterOptions() {
  return useQuery({
    queryKey: CACHE_KEYS.filterOptions,
    queryFn: () => auditApi.filterOptions(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Indicateurs de synthèse, calculés sur le périmètre des filtres courants :
 * l'en-tête et le tableau parlent ainsi du même sous-ensemble.
 */
export function useAuditStats(filters: AuditLogFilters) {
  return useQuery({
    queryKey: CACHE_KEYS.stats(filters),
    queryFn: () => auditApi.stats(filters),
    placeholderData: (previous) => previous,
    staleTime: 60 * 1000,
  });
}
