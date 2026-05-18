import api from './client';
import {
  GanttTask,
  PertData,
  BurndownData,
  WorkloadData,
  DashboardStatusDonut,
  EisenhowerData,
} from '@/lib/types/planning.types';

const BASE_URL = '/planning';

export const planningApi = {
  /**
   * Récupérer données Gantt d'un projet
   * GET /planning/projects/:projectId/gantt (JWT requis)
   */
  getGantt: async (projectId: string): Promise<GanttTask[]> => {
    const response = await api.get<GanttTask[]>(
      `${BASE_URL}/projects/${projectId}/gantt`
    );
    return response.data;
  },

  /**
   * Récupérer réseau PERT d'un projet
   * GET /planning/projects/:projectId/pert (JWT requis)
   */
  getPert: async (projectId: string): Promise<PertData> => {
    const response = await api.get<PertData>(
      `${BASE_URL}/projects/${projectId}/pert`
    );
    return response.data;
  },

  /**
   * Récupérer données Burndown d'un projet
   * GET /planning/projects/:projectId/burndown (JWT requis)
   * Query: startDate?, endDate?
   */
  getBurndown: async (
    projectId: string,
    params?: { startDate?: string; endDate?: string }
  ): Promise<BurndownData> => {
    const response = await api.get<BurndownData>(
      `${BASE_URL}/projects/${projectId}/burndown`,
      { params }
    );
    return response.data;
  },

  /**
   * Récupérer données de charge de travail
   * GET /planning/workload (JWT requis)
   * Query: startDate (req), endDate (req), projectId?, groupBy?: 'day'|'week'
   */
  getWorkload: async (params: {
    startDate: string;
    endDate: string;
    projectId?: string;
    groupBy?: 'day' | 'week';
  }): Promise<WorkloadData> => {
    const response = await api.get<WorkloadData>(`${BASE_URL}/workload`, {
      params,
    });
    return response.data;
  },

  /**
   * Récupérer statut des tâches (donut chart)
   * GET /planning/projects/:projectId/dashboard/status-donut (JWT requis)
   */
  getStatusDonut: async (projectId: string): Promise<DashboardStatusDonut> => {
    const response = await api.get<DashboardStatusDonut>(
      `${BASE_URL}/projects/${projectId}/dashboard/status-donut`
    );
    return response.data;
  },

  /**
   * Récupérer matrice Eisenhower
   * GET /planning/projects/:projectId/dashboard/eisenhower (JWT requis)
   */
  getEisenhower: async (projectId: string): Promise<EisenhowerData> => {
    const response = await api.get<EisenhowerData>(
      `${BASE_URL}/projects/${projectId}/dashboard/eisenhower`
    );
    return response.data;
  },
};
