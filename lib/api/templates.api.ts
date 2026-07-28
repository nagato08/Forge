import api from './client';
import { Project } from '@/lib/types/project.types';
import {
  ProjectTemplateDetail,
  ProjectTemplateSummary,
} from '@/lib/types/planning.types';

const BASE_URL = '/project-templates';

export const templatesApi = {
  /** Modèles partagés, plus ceux créés par l'utilisateur. */
  list: async (): Promise<ProjectTemplateSummary[]> => {
    const response = await api.get<ProjectTemplateSummary[]>(BASE_URL);
    return response.data;
  },

  getById: async (templateId: string): Promise<ProjectTemplateDetail> => {
    const response = await api.get<ProjectTemplateDetail>(
      `${BASE_URL}/${templateId}`
    );
    return response.data;
  },

  /** Capture un projet existant comme modèle réutilisable. */
  createFromProject: async (data: {
    projectId: string;
    name: string;
    description?: string;
    isShared?: boolean;
  }): Promise<ProjectTemplateSummary> => {
    const response = await api.post<ProjectTemplateSummary>(BASE_URL, data);
    return response.data;
  },

  /** Crée un projet à partir du modèle, replacé sur la date choisie. */
  instantiate: async (
    templateId: string,
    data: { name: string; startDate: string }
  ): Promise<Project & { taskCount: number }> => {
    const response = await api.post<Project & { taskCount: number }>(
      `${BASE_URL}/${templateId}/instantiate`,
      data
    );
    return response.data;
  },

  remove: async (templateId: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(
      `${BASE_URL}/${templateId}`
    );
    return response.data;
  },
};
