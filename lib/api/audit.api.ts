import api from './client';
import {
  AuditLogExportResponse,
  AuditLogFilterOptions,
  AuditLogFilters,
  AuditLogListParams,
  AuditLogListResponse,
  AuditLogStats,
} from '@/lib/types/audit.types';

const BASE_URL = '/audit-logs';

/**
 * Retire les filtres vides et sérialise les tableaux en liste séparée par des
 * virgules, forme acceptée par le DTO côté serveur.
 */
function cleanParams<T extends object>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => {
        if (value === undefined || value === null || value === '') return false;
        if (Array.isArray(value)) return value.length > 0;
        return true;
      })
      .map(([key, value]) => [
        key,
        Array.isArray(value) ? value.join(',') : value,
      ])
  );
}

export const auditApi = {
  /**
   * Page du journal, du plus récent au plus ancien.
   * GET /audit-logs (JWT requis, ADMIN global)
   */
  list: async (params: AuditLogListParams): Promise<AuditLogListResponse> => {
    const response = await api.get<AuditLogListResponse>(BASE_URL, {
      params: cleanParams(params),
    });
    return response.data;
  },

  /**
   * Jeu complet correspondant aux filtres, pour génération de fichier.
   * GET /audit-logs/export (JWT requis, ADMIN global)
   */
  export: async (
    filters: AuditLogFilters
  ): Promise<AuditLogExportResponse> => {
    const response = await api.get<AuditLogExportResponse>(
      `${BASE_URL}/export`,
      { params: cleanParams(filters) }
    );
    return response.data;
  },

  /**
   * Valeurs distinctes pour alimenter les listes déroulantes de filtres.
   * GET /audit-logs/filter-options (JWT requis, ADMIN global)
   */
  filterOptions: async (): Promise<AuditLogFilterOptions> => {
    const response = await api.get<AuditLogFilterOptions>(
      `${BASE_URL}/filter-options`
    );
    return response.data;
  },

  /**
   * Indicateurs de synthèse affichés en tête de page.
   * GET /audit-logs/stats (JWT requis, ADMIN global)
   */
  stats: async (filters: AuditLogFilters = {}): Promise<AuditLogStats> => {
    const response = await api.get<AuditLogStats>(`${BASE_URL}/stats`, {
      params: cleanParams(filters),
    });
    return response.data;
  },
};
