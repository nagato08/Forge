/* eslint-disable @typescript-eslint/no-explicit-any */
import api from './client';

export interface AIInterpretRequest {
  projectId: string;
  message: string;
}

export interface AIInterpretResponse {
  action: string;
  params?: Record<string, any>;
}

export interface AIExecuteRequest {
  projectId: string;
  action: 'create_task' | 'assign_task';
  params: Record<string, any>;
}

export interface AIActRequest {
  projectId: string;
  message: string;
}

export interface AIAnalysisResponse {
  analysis: string;
}

const BASE_URL = '/ai';

export const aiApi = {
  /**
   * Interpréter un message et obtenir une suggestion d'action
   * POST /ai/interpret (JWT requis)
   */
  interpret: async (data: AIInterpretRequest): Promise<AIInterpretResponse> => {
    const response = await api.post<AIInterpretResponse>(`${BASE_URL}/interpret`, data);
    return response.data;
  },

  /**
   * Exécuter une action suggérée
   * POST /ai/execute (JWT requis)
   */
  execute: async (data: AIExecuteRequest): Promise<any> => {
    const response = await api.post<any>(`${BASE_URL}/execute`, data);
    return response.data;
  },

  /**
   * Interpréter et exécuter en une seule requête
   * POST /ai/act (JWT requis)
   */
  act: async (data: AIActRequest): Promise<AIInterpretResponse> => {
    const response = await api.post<AIInterpretResponse>(`${BASE_URL}/act`, data);
    return response.data;
  },

  /**
   * Analyser le diagramme Gantt
   * GET /ai/analyze/gantt/:projectId (JWT requis)
   */
  analyzeGantt: async (projectId: string): Promise<AIAnalysisResponse> => {
    const response = await api.get<AIAnalysisResponse>(`${BASE_URL}/analyze/gantt/${projectId}`);
    return response.data;
  },

  /**
   * Analyser le diagramme PERT
   * GET /ai/analyze/pert/:projectId (JWT requis)
   */
  analyzePert: async (projectId: string): Promise<AIAnalysisResponse> => {
    const response = await api.get<AIAnalysisResponse>(`${BASE_URL}/analyze/pert/${projectId}`);
    return response.data;
  },

  /**
   * Analyser les retards potentiels
   * GET /ai/analyze/delays/:projectId (JWT requis)
   */
  analyzeDelays: async (projectId: string): Promise<AIAnalysisResponse> => {
    const response = await api.get<AIAnalysisResponse>(`${BASE_URL}/analyze/delays/${projectId}`);
    return response.data;
  },
};
