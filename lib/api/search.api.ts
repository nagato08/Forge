import api from './client';
import {
  ProjectExportData,
  SearchResponse,
} from '@/lib/types/planning.types';

export const searchApi = {
  /**
   * Recherche transverse, limitée au périmètre visible de l'utilisateur.
   * GET /search?q= (JWT requis)
   */
  search: async (query: string): Promise<SearchResponse> => {
    const response = await api.get<SearchResponse>('/search', {
      params: { q: query },
    });
    return response.data;
  },

  /**
   * Données du projet à plat, prêtes à l'export fichier.
   * GET /projects/:projectId/export (JWT requis)
   */
  exportProject: async (projectId: string): Promise<ProjectExportData> => {
    const response = await api.get<ProjectExportData>(
      `/projects/${projectId}/export`
    );
    return response.data;
  },
};
