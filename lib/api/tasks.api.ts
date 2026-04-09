import api from './client';
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  UpdateTaskStatusRequest,
  AssignTaskRequest,
  AddTaskDependencyRequest,
  AddTaskCommentRequest,
  TaskComment,
} from '@/lib/types/task.types';

const BASE_URL = '/tasks';

export const tasksApi = {
  /**
   * Créer une nouvelle tâche
   * POST /tasks (JWT requis)
   */
  createTask: async (data: CreateTaskRequest): Promise<Task> => {
    const response = await api.post<Task>(`${BASE_URL}`, data);
    return response.data;
  },

  /**
   * Récupérer toutes les tâches d'un projet (Kanban)
   * GET /tasks/project/:projectId (JWT requis)
   */
  getProjectTasks: async (projectId: string): Promise<Task[]> => {
    const response = await api.get<Task[]>(`${BASE_URL}/project/${projectId}`);
    return response.data;
  },

  /**
   * Récupérer mes tâches assignées
   * GET /tasks/my-tasks (JWT requis)
   */
  getMyTasks: async (): Promise<Task[]> => {
    const response = await api.get<Task[]>(`${BASE_URL}/my-tasks`);
    return response.data;
  },

  /**
   * Récupérer une tâche par ID
   * GET /tasks/:id (JWT requis)
   */
  getTaskById: async (taskId: string): Promise<Task> => {
    const response = await api.get<Task>(`${BASE_URL}/${taskId}`);
    return response.data;
  },

  /**
   * Mettre à jour une tâche
   * PATCH /tasks/:id (JWT requis)
   */
  updateTask: async (
    taskId: string,
    data: UpdateTaskRequest
  ): Promise<Task> => {
    const response = await api.patch<Task>(`${BASE_URL}/${taskId}`, data);
    return response.data;
  },

  /**
   * Supprimer une tâche
   * DELETE /tasks/:id (JWT requis)
   */
  deleteTask: async (taskId: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${taskId}`);
  },

  /**
   * Mettre à jour le statut d'une tâche
   * PATCH /tasks/:id/status (JWT requis)
   */
  updateTaskStatus: async (
    taskId: string,
    data: UpdateTaskStatusRequest
  ): Promise<Task> => {
    const response = await api.patch<Task>(`${BASE_URL}/${taskId}/status`, data);
    return response.data;
  },

  /**
   * Assigner des utilisateurs à une tâche
   * POST /tasks/:id/assign (JWT requis)
   */
  assignTask: async (
    taskId: string,
    data: AssignTaskRequest
  ): Promise<Task> => {
    const response = await api.post<Task>(`${BASE_URL}/${taskId}/assign`, data);
    return response.data;
  },

  /**
   * Retirer un utilisateur d'une tâche
   * DELETE /tasks/:id/assign/:userId (JWT requis)
   */
  unassignTask: async (taskId: string, userId: string): Promise<Task> => {
    const response = await api.delete<Task>(
      `${BASE_URL}/${taskId}/assign/${userId}`
    );
    return response.data;
  },

  /**
   * Ajouter une dépendance (cette tâche bloque une autre)
   * POST /tasks/:id/dependencies (JWT requis)
   */
  addDependency: async (
    taskId: string,
    data: AddTaskDependencyRequest
  ): Promise<Task> => {
    const response = await api.post<Task>(
      `${BASE_URL}/${taskId}/dependencies`,
      data
    );
    return response.data;
  },

  /**
   * Retirer une dépendance
   * DELETE /tasks/:id/dependencies/:blockedTaskId (JWT requis)
   */
  removeDependency: async (
    taskId: string,
    blockedTaskId: string
  ): Promise<Task> => {
    const response = await api.delete<Task>(
      `${BASE_URL}/${taskId}/dependencies/${blockedTaskId}`
    );
    return response.data;
  },

  /**
   * Ajouter un commentaire à une tâche
   * POST /tasks/:id/comments (JWT requis)
   */
  addComment: async (
    taskId: string,
    data: AddTaskCommentRequest
  ): Promise<TaskComment> => {
    const response = await api.post<TaskComment>(
      `${BASE_URL}/${taskId}/comments`,
      data
    );
    return response.data;
  },

  /**
   * Supprimer un commentaire d'une tâche
   * DELETE /tasks/comments/:commentId (JWT requis)
   */
  deleteComment: async (commentId: string): Promise<void> => {
    await api.delete(`${BASE_URL}/comments/${commentId}`);
  },
};
