import api from './client';
import { Phase, Milestone, WorkloadData } from '@/lib/types/planning.types';

export type IssueSeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export interface ProjectIssue {
  id: string;
  projectId: string;
  taskId: string | null;
  task: { id: string; title: string } | null;
  title: string;
  description: string | null;
  severity: IssueSeverity;
  status: IssueStatus;
  correctiveAction: string | null;
  reportedById: string;
  reportedBy: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssueRequest {
  title: string;
  description?: string;
  severity?: IssueSeverity;
  taskId?: string;
}

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  severity?: IssueSeverity;
  status?: IssueStatus;
  correctiveAction?: string;
}

export interface QueryIssuesParams {
  taskId?: string;
  severity?: IssueSeverity;
  status?: IssueStatus;
}

/**
 * Synthèse imprimable du projet : avancement, feuille de route, charge et
 * difficultés en cours. Chaque section reflète ce que montrent les autres
 * vues du pilotage — rien n'est recalculé indépendamment.
 */
export interface StatusReport {
  generatedAt: string;
  project: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    priority: string;
    startDate: string;
    endDate: string | null;
    owner: { id: string; firstName: string; lastName: string } | null;
    taskCount: number;
    doneTaskCount: number;
    progressPercent: number;
  };
  phases: Phase[];
  milestones: Milestone[];
  workload: WorkloadData;
  issues: ProjectIssue[];
}

export const projectIssueApi = {
  /**
   * Journal des difficultés du projet, ouvertes en premier.
   * GET /projects/:projectId/issues (JWT requis, tout membre)
   */
  list: async (
    projectId: string,
    params?: QueryIssuesParams
  ): Promise<ProjectIssue[]> => {
    const response = await api.get<ProjectIssue[]>(
      `/projects/${projectId}/issues`,
      { params }
    );
    return response.data;
  },

  /**
   * Signaler une difficulté, éventuellement rattachée à une tâche précise.
   * POST /projects/:projectId/issues (contributeurs et au-dessus)
   */
  create: async (
    projectId: string,
    data: CreateIssueRequest
  ): Promise<ProjectIssue> => {
    const response = await api.post<ProjectIssue>(
      `/projects/${projectId}/issues`,
      data
    );
    return response.data;
  },

  /**
   * Suivre la résolution : statut et action corrective.
   * PATCH /projects/:projectId/issues/:issueId (gestionnaires du projet)
   */
  update: async (
    projectId: string,
    issueId: string,
    data: UpdateIssueRequest
  ): Promise<ProjectIssue> => {
    const response = await api.patch<ProjectIssue>(
      `/projects/${projectId}/issues/${issueId}`,
      data
    );
    return response.data;
  },

  /**
   * Retirer un signalement — son auteur ou un gestionnaire du projet.
   * DELETE /projects/:projectId/issues/:issueId
   */
  remove: async (projectId: string, issueId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}/issues/${issueId}`);
  },

  /**
   * Rapport d'état imprimable du projet.
   * GET /projects/:projectId/status-report (JWT requis, tout membre)
   */
  getStatusReport: async (
    projectId: string,
    issuesTaskId?: string
  ): Promise<StatusReport> => {
    const response = await api.get<StatusReport>(
      `/projects/${projectId}/status-report`,
      { params: issuesTaskId ? { issuesTaskId } : undefined }
    );
    return response.data;
  },
};
