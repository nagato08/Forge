import api from './client';
import {
  GanttData,
  PertData,
  BurndownData,
  WorkloadData,
  DashboardStatusDonut,
  EisenhowerData,
  Milestone,
  Phase,
  RescheduleResult,
  Sprint,
  SprintStatus,
} from '@/lib/types/planning.types';

const BASE_URL = '/planning';

export const planningApi = {
  /**
   * Récupérer données Gantt d'un projet
   * GET /planning/projects/:projectId/gantt (JWT requis)
   */
  getGantt: async (projectId: string): Promise<GanttData> => {
    const response = await api.get<GanttData>(
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
    params?: { startDate?: string; endDate?: string; sprintId?: string }
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

  // --- Replanification (Gantt interactif) ---

  /**
   * Déplace une tâche et répercute sur les tâches bloquées.
   * PATCH /planning/tasks/:taskId/schedule (ADMIN projet)
   */
  rescheduleTask: async (
    taskId: string,
    startDate: string,
    endDate: string
  ): Promise<RescheduleResult> => {
    const response = await api.patch<RescheduleResult>(
      `${BASE_URL}/tasks/${taskId}/schedule`,
      { startDate, endDate }
    );
    return response.data;
  },

  /** Fige les dates courantes comme référence. */
  setBaseline: async (
    projectId: string
  ): Promise<{ message: string; taskCount: number }> => {
    const response = await api.post<{ message: string; taskCount: number }>(
      `${BASE_URL}/projects/${projectId}/baseline`
    );
    return response.data;
  },

  // --- Sprints ---

  listSprints: async (projectId: string): Promise<Sprint[]> => {
    const response = await api.get<Sprint[]>(
      `${BASE_URL}/projects/${projectId}/sprints`
    );
    return response.data;
  },

  createSprint: async (
    projectId: string,
    data: { name: string; goal?: string; startDate: string; endDate: string }
  ): Promise<Sprint> => {
    const response = await api.post<Sprint>(
      `${BASE_URL}/projects/${projectId}/sprints`,
      data
    );
    return response.data;
  },

  updateSprint: async (
    projectId: string,
    sprintId: string,
    data: {
      name?: string;
      goal?: string;
      startDate?: string;
      endDate?: string;
      status?: SprintStatus;
    }
  ): Promise<Sprint> => {
    const response = await api.patch<Sprint>(
      `${BASE_URL}/projects/${projectId}/sprints/${sprintId}`,
      data
    );
    return response.data;
  },

  deleteSprint: async (
    projectId: string,
    sprintId: string
  ): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(
      `${BASE_URL}/projects/${projectId}/sprints/${sprintId}`
    );
    return response.data;
  },

  /** Rattache des tâches à un sprint. `sprintId` nul = retour au backlog. */
  assignSprintTasks: async (
    projectId: string,
    taskIds: string[],
    sprintId: string | null
  ): Promise<{ updated: number }> => {
    const response = await api.patch<{ updated: number }>(
      `${BASE_URL}/projects/${projectId}/sprints/tasks/assign`,
      { taskIds, sprintId }
    );
    return response.data;
  },

  // --- Jalons ---

  listMilestones: async (projectId: string): Promise<Milestone[]> => {
    const response = await api.get<Milestone[]>(
      `${BASE_URL}/projects/${projectId}/milestones`
    );
    return response.data;
  },

  createMilestone: async (
    projectId: string,
    data: { name: string; description?: string; date: string }
  ): Promise<Milestone> => {
    const response = await api.post<Milestone>(
      `${BASE_URL}/projects/${projectId}/milestones`,
      data
    );
    return response.data;
  },

  updateMilestone: async (
    projectId: string,
    milestoneId: string,
    data: {
      name?: string;
      description?: string;
      date?: string;
      reached?: boolean;
    }
  ): Promise<Milestone> => {
    const response = await api.patch<Milestone>(
      `${BASE_URL}/projects/${projectId}/milestones/${milestoneId}`,
      data
    );
    return response.data;
  },

  deleteMilestone: async (
    projectId: string,
    milestoneId: string
  ): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(
      `${BASE_URL}/projects/${projectId}/milestones/${milestoneId}`
    );
    return response.data;
  },

  // --- Phases (feuille de route) ---

  listPhases: async (projectId: string): Promise<Phase[]> => {
    const response = await api.get<Phase[]>(
      `${BASE_URL}/projects/${projectId}/phases`
    );
    return response.data;
  },

  createPhase: async (
    projectId: string,
    data: { name: string; description?: string; startDate: string; endDate: string; order?: number }
  ): Promise<Phase> => {
    const response = await api.post<Phase>(
      `${BASE_URL}/projects/${projectId}/phases`,
      data
    );
    return response.data;
  },

  updatePhase: async (
    projectId: string,
    phaseId: string,
    data: Partial<{ name: string; description: string; startDate: string; endDate: string; order: number }>
  ): Promise<Phase> => {
    const response = await api.patch<Phase>(
      `${BASE_URL}/projects/${projectId}/phases/${phaseId}`,
      data
    );
    return response.data;
  },

  deletePhase: async (
    projectId: string,
    phaseId: string
  ): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(
      `${BASE_URL}/projects/${projectId}/phases/${phaseId}`
    );
    return response.data;
  },
};
