import api from './client';

export type ProjectMethodology = 'AGILE' | 'CLASSIC';
export type ChargeUnit = 'HOURS' | 'PERSON_DAYS';

export interface ProjectSettings {
  id: string;
  projectId: string;
  hoursPerDay: number;
  /** 0 = dimanche … 6 = samedi */
  workingDays: number[];
  publicHolidays: string[];
  machineCapacityPerDay: number;
  lateAlertThresholdDays: number;
  budgetAmount: number | null;
  currency: string;
  methodology: ProjectMethodology;
  chargeUnit: ChargeUnit;
  createdAt: string;
  updatedAt: string;
}

export type UpdateProjectSettingsRequest = Partial<
  Omit<ProjectSettings, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>
>;

export const projectSettingsApi = {
  /**
   * Calendrier ouvré, seuils d'alerte et configuration générale du projet.
   * GET /projects/:projectId/settings (JWT requis, tout membre)
   */
  getSettings: async (projectId: string): Promise<ProjectSettings> => {
    const response = await api.get<ProjectSettings>(
      `/projects/${projectId}/settings`
    );
    return response.data;
  },

  /**
   * Modifier les paramètres du projet.
   * PATCH /projects/:projectId/settings (gestionnaires du projet)
   */
  updateSettings: async (
    projectId: string,
    data: UpdateProjectSettingsRequest
  ): Promise<ProjectSettings> => {
    const response = await api.patch<ProjectSettings>(
      `/projects/${projectId}/settings`,
      data
    );
    return response.data;
  },
};
