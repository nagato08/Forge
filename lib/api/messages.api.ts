import api from './client';
import { Message, CreateMessageRequest, SendMessageRequest } from '@/lib/types/message.types';

const BASE_URL = '/messages';

export const messagesApi = {
  /**
   * Envoyer un message dans un projet
   * POST /messages/project/:projectId (JWT requis)
   */
  sendMessage: async (
    projectId: string,
    data: CreateMessageRequest
  ): Promise<Message> => {
    const response = await api.post<Message>(
      `${BASE_URL}/project/${projectId}`,
      data
    );
    return response.data;
  },

  /**
   * Récupérer tous les messages d'un projet
   * GET /messages/project/:projectId (JWT requis)
   */
  getProjectMessages: async (projectId: string): Promise<Message[]> => {
    const response = await api.get<Message[]>(
      `${BASE_URL}/project/${projectId}`
    );
    return response.data;
  },

  /**
   * Récupérer un message par ID
   * GET /messages/:id (JWT requis)
   */
  getMessageById: async (messageId: string): Promise<Message> => {
    const response = await api.get<Message>(`${BASE_URL}/${messageId}`);
    return response.data;
  },

  /**
   * Supprimer un message
   * DELETE /messages/:id (JWT requis, seulement auteur ou admin)
   */
  deleteMessage: async (messageId: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${messageId}`);
  },
};
