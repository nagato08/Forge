import api from './client';

export interface ChatMessage {
  id: string;
  content: string;
  projectId: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const BASE_URL = '/chat';

export const chatApi = {
  /**
   * Envoyer un message dans le chat d'un projet
   * POST /chat/project/:projectId (JWT requis)
   */
  sendMessage: async (
    projectId: string,
    content: string
  ): Promise<ChatMessage> => {
    const response = await api.post<ChatMessage>(
      `${BASE_URL}/project/${projectId}`,
      { content }
    );
    return response.data;
  },

  /**
   * Récupérer tous les messages d'un projet
   * GET /chat/project/:projectId (JWT requis)
   */
  getMessages: async (projectId: string): Promise<ChatMessage[]> => {
    const response = await api.get<ChatMessage[]>(
      `${BASE_URL}/project/${projectId}`
    );
    return response.data;
  },
};
