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

/** Format pour les pièces jointes dans le contenu du message */
export interface ChatAttachment {
  name: string;
  url: string;
  size: number;
  type: string; // MIME type
}

const ATTACHMENT_REGEX = /\[attachment:(.*?):(.*?):(.*?):(.*?)\]/g;

/** Encoder une pièce jointe dans le contenu du message */
export function encodeAttachment(attachment: ChatAttachment): string {
  return `[attachment:${attachment.name}:${attachment.url}:${attachment.size}:${attachment.type}]`;
}

/** Extraire les pièces jointes d'un contenu de message */
export function parseAttachments(content: string): {
  text: string;
  attachments: ChatAttachment[];
} {
  const attachments: ChatAttachment[] = [];
  let match;
  const regex = new RegExp(ATTACHMENT_REGEX);
  while ((match = regex.exec(content)) !== null) {
    attachments.push({
      name: match[1],
      url: match[2],
      size: parseInt(match[3], 10),
      type: match[4],
    });
  }
  const text = content.replace(ATTACHMENT_REGEX, '').trim();
  return { text, attachments };
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
    const response = await api.get(
      `${BASE_URL}/project/${projectId}`
    );
    // L'API peut retourner un tableau directement ou un objet wrapper
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.messages)) return data.messages;
    return [];
  },

  /**
   * Uploader un fichier via l'API documents puis envoyer un message avec le lien
   * 1. Créer un document dans le projet
   * 2. Uploader le fichier comme version
   * 3. Envoyer un message chat avec l'attachment encodé
   */
  sendFileMessage: async (
    projectId: string,
    file: File,
    textContent?: string
  ): Promise<ChatMessage> => {
    // 1. Créer le document
    const docRes = await api.post('/documents', {
      projectId,
      name: file.name,
    });
    const doc = docRes.data;

    // 2. Uploader le fichier
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

    // 3. Envoyer le message avec l'attachment encodé
    const attachment = encodeAttachment({
      name: file.name,
      url: fileUrl,
      size: file.size,
      type: file.type,
    });
    const content = textContent
      ? `${textContent}\n${attachment}`
      : attachment;

    const msgRes = await api.post<ChatMessage>(
      `${BASE_URL}/project/${projectId}`,
      { content }
    );
    return msgRes.data;
  },
};
