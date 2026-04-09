import api from './client';

export interface TimeEntry {
  id: string;
  taskId: string;
  task?: {
    id: string;
    title: string;
    projectId: string;
  };
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number; // en minutes
  createdAt: string;
  updatedAt: string;
}

export interface TimeStats {
  totalMinutes: number;
  byTask: Array<{
    taskId: string;
    taskTitle: string;
    totalMinutes: number;
  }>;
  byProject: Array<{
    projectId: string;
    projectName: string;
    totalMinutes: number;
  }>;
}

const BASE_URL = '/time-entries';

export const timeEntriesApi = {
  /**
   * Démarrer un chronomètre pour une tâche
   * POST /time-entries/start (JWT requis)
   */
  startTimer: async (taskId: string): Promise<TimeEntry> => {
    const response = await api.post<TimeEntry>(`${BASE_URL}/start`, {
      taskId,
    });
    return response.data;
  },

  /**
   * Arrêter le chronomètre actif
   * POST /time-entries/stop (JWT requis)
   */
  stopTimer: async (): Promise<TimeEntry> => {
    const response = await api.post<TimeEntry>(`${BASE_URL}/stop`);
    return response.data;
  },

  /**
   * Récupérer le chronomètre actif
   * GET /time-entries/active (JWT requis)
   */
  getActiveTimer: async (): Promise<TimeEntry | null> => {
    try {
      const response = await api.get<TimeEntry>(`${BASE_URL}/active`);
      return response.data;
    } catch (error) {
      // Pas de chronomètre actif
      return null;
    }
  },

  /**
   * Ajouter une entrée de temps manuellement
   * POST /time-entries/manual (JWT requis)
   */
  addManualEntry: async (data: {
    taskId: string;
    startTime: string;
    endTime?: string;
    duration?: number; // en minutes
  }): Promise<TimeEntry> => {
    const response = await api.post<TimeEntry>(`${BASE_URL}/manual`, data);
    return response.data;
  },

  /**
   * Récupérer mes entrées de temps
   * GET /time-entries/my-entries (JWT requis)
   * Query: taskId?, projectId?
   */
  getMyEntries: async (params?: {
    taskId?: string;
    projectId?: string;
  }): Promise<TimeEntry[]> => {
    const response = await api.get<TimeEntry[]>(`${BASE_URL}/my-entries`, {
      params,
    });
    return response.data;
  },

  /**
   * Récupérer mes stats de temps
   * GET /time-entries/my-stats (JWT requis)
   * Query: projectId?
   */
  getMyStats: async (projectId?: string): Promise<TimeStats> => {
    const response = await api.get<TimeStats>(`${BASE_URL}/my-stats`, {
      params: projectId ? { projectId } : {},
    });
    return response.data;
  },

  /**
   * Récupérer les stats de temps d'un projet
   * GET /time-entries/project/:projectId/stats (JWT requis)
   */
  getProjectStats: async (projectId: string): Promise<TimeStats> => {
    const response = await api.get<TimeStats>(
      `${BASE_URL}/project/${projectId}/stats`
    );
    return response.data;
  },

  /**
   * Supprimer une entrée de temps
   * DELETE /time-entries/:id (JWT requis)
   */
  deleteTimeEntry: async (entryId: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${entryId}`);
  },
};
