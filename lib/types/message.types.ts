// Types pour les messages de projet (distinct du chat)

import { User } from './user.types';

export interface Message {
  id: string;
  content: string;
  projectId: string;
  userId: string;
  user: User;
  mentions?: string[];  // IDs des utilisateurs mentionnés
  createdAt: string;
  updatedAt: string;
}

export interface CreateMessageRequest {
  content: string;
  mentions?: string[];  // Mentions @user
}

export interface SendMessageRequest {
  projectId: string;
  content: string;
  mentions?: string[];
}
