import api from './client';

/** Fichier joint à un message, désormais une entité à part entière. */
export interface ChatAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

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
  /** Identifiants des utilisateurs mentionnés (@). */
  mentions: string[];
  attachments: ChatAttachment[];
  createdAt: string;
}

/** Métadonnées d'un fichier à joindre, avant création du message. */
export interface ChatAttachmentInput {
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

const BASE_URL = '/chat';

export const chatApi = {
  /**
   * Envoyer un message dans le chat d'un projet
   * POST /chat/project/:projectId (JWT requis, MEMBER minimum)
   */
  sendMessage: async (
    projectId: string,
    content: string,
    options: {
      mentions?: string[];
      attachments?: ChatAttachmentInput[];
    } = {}
  ): Promise<ChatMessage> => {
    const response = await api.post<{ data: ChatMessage }>(
      `${BASE_URL}/project/${projectId}`,
      { content, ...options }
    );
    return response.data.data;
  },

  /**
   * Récupérer tous les messages d'un projet
   * GET /chat/project/:projectId (JWT requis)
   */
  getMessages: async (projectId: string): Promise<ChatMessage[]> => {
    const response = await api.get(`${BASE_URL}/project/${projectId}`);
    // L'API peut retourner un tableau directement ou un objet wrapper
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.messages)) return data.messages;
    return [];
  },

  /**
   * Téléverse un fichier puis publie un message qui le référence.
   *
   * Le fichier transite par le module Documents (stockage Cloudinary), puis
   * ses métadonnées sont transmises comme pièce jointe structurée — et non
   * plus encodées dans le texte du message.
   */
  sendFileMessage: async (
    projectId: string,
    file: File,
    textContent?: string,
    mentions?: string[]
  ): Promise<ChatMessage> => {
    // 1. Créer le document porteur
    const docRes = await api.post('/documents', {
      projectId,
      name: file.name,
    });
    const doc = docRes.data;

    // 2. Téléverser le contenu comme version
    const formData = new FormData();
    formData.append('file', file);
    const versionRes = await api.post(
      `/documents/${doc.id}/versions`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    const updatedDoc = versionRes.data;
    const latestVersion =
      updatedDoc.versions?.[updatedDoc.versions.length - 1] ||
      updatedDoc.versions?.[0];
    const fileUrl = latestVersion?.fileUrl || '';

    // 3. Publier le message avec la pièce jointe structurée
    return chatApi.sendMessage(projectId, textContent ?? '', {
      mentions,
      attachments: [
        {
          name: file.name,
          url: fileUrl,
          size: file.size,
          mimeType: file.type,
        },
      ],
    });
  },
};

// --- Messagerie directe ---

/** Identité minimale d'un correspondant : ce qu'il faut pour le reconnaître. */
export interface ChatPerson {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  jobTitle: string | null;
}

export interface DirectMessage extends Omit<ChatMessage, 'projectId'> {
  conversationId: string;
}

export interface DirectConversation {
  id: string;
  type: 'DIRECT';
  participant: ChatPerson | null;
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
  lastMessageAt: string | null;
}

export const directChatApi = {
  /**
   * Mes conversations directes, la plus récemment active en tête.
   * GET /chat/direct (JWT requis)
   */
  listConversations: async (): Promise<DirectConversation[]> => {
    const response = await api.get<DirectConversation[]>(`${BASE_URL}/direct`);
    return response.data;
  },

  /**
   * Annuaire des personnes à qui écrire (identité seule).
   * GET /chat/direct/directory (JWT requis)
   */
  listDirectory: async (): Promise<ChatPerson[]> => {
    const response = await api.get<ChatPerson[]>(
      `${BASE_URL}/direct/directory`
    );
    return response.data;
  },

  /**
   * Ouvre — ou retrouve — la conversation avec quelqu'un.
   * POST /chat/direct/with/:userId (JWT requis)
   */
  openWith: async (userId: string): Promise<DirectConversation> => {
    const response = await api.post<DirectConversation>(
      `${BASE_URL}/direct/with/${userId}`
    );
    return response.data;
  },

  /**
   * Messages d'une conversation directe.
   * GET /chat/direct/:conversationId (JWT requis, participant uniquement)
   */
  getMessages: async (
    conversationId: string
  ): Promise<{ messages: DirectMessage[]; total: number; hasMore: boolean }> => {
    const response = await api.get<{
      messages: DirectMessage[];
      total: number;
      hasMore: boolean;
    }>(`${BASE_URL}/direct/${conversationId}`);
    return response.data;
  },

  /**
   * Envoyer un message direct.
   * POST /chat/direct/:conversationId (JWT requis, participant uniquement)
   */
  sendMessage: async (
    conversationId: string,
    data: { content: string; attachments?: ChatAttachmentInput[] }
  ): Promise<{ data: DirectMessage }> => {
    const response = await api.post<{ data: DirectMessage }>(
      `${BASE_URL}/direct/${conversationId}`,
      data
    );
    return response.data;
  },
};
