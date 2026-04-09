import api from './client';

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Document {
  id: string;
  name: string;
  projectId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  versions: DocumentVersion[];
  comments?: DocumentComment[];
}

export interface DocumentComment {
  id: string;
  content: string;
  documentId: string;
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

const BASE_URL = '/documents';

export const documentsApi = {
  /**
   * Créer un nouveau document
   * POST /documents (JWT requis)
   */
  createDocument: async (
    projectId: string,
    name: string
  ): Promise<Document> => {
    const response = await api.post<Document>(`${BASE_URL}`, {
      projectId,
      name,
    });
    return response.data;
  },

  /**
   * Récupérer les documents d'un projet
   * GET /documents/project/:projectId (JWT requis)
   */
  getProjectDocuments: async (projectId: string): Promise<Document[]> => {
    const response = await api.get<Document[]>(
      `${BASE_URL}/project/${projectId}`
    );
    return response.data;
  },

  /**
   * Récupérer mes documents
   * GET /documents/my-documents (JWT requis)
   */
  getMyDocuments: async (): Promise<Document[]> => {
    const response = await api.get<Document[]>(`${BASE_URL}/my-documents`);
    return response.data;
  },

  /**
   * Récupérer un document par ID (avec versions)
   * GET /documents/:id (JWT requis)
   */
  getDocumentById: async (documentId: string): Promise<Document> => {
    const response = await api.get<Document>(`${BASE_URL}/${documentId}`);
    return response.data;
  },

  /**
   * Mettre à jour le nom d'un document
   * PATCH /documents/:id (JWT requis)
   */
  updateDocument: async (
    documentId: string,
    name: string
  ): Promise<Document> => {
    const response = await api.patch<Document>(`${BASE_URL}/${documentId}`, {
      name,
    });
    return response.data;
  },

  /**
   * Supprimer un document
   * DELETE /documents/:id (JWT requis)
   */
  deleteDocument: async (documentId: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${documentId}`);
  },

  /**
   * Uploader une nouvelle version d'un document
   * POST /documents/:id/versions (JWT requis, multipart/form-data)
   */
  uploadVersion: async (
    documentId: string,
    file: File
  ): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<Document>(
      `${BASE_URL}/${documentId}/versions`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Récupérer les versions d'un document
   * GET /documents/:id/versions (JWT requis)
   */
  getDocumentVersions: async (
    documentId: string
  ): Promise<DocumentVersion[]> => {
    const response = await api.get<DocumentVersion[]>(
      `${BASE_URL}/${documentId}/versions`
    );
    return response.data;
  },

  /**
   * Récupérer une version spécifique d'un document
   * GET /documents/:id/versions/:version (JWT requis)
   */
  getDocumentVersion: async (
    documentId: string,
    version: number
  ): Promise<DocumentVersion> => {
    const response = await api.get<DocumentVersion>(
      `${BASE_URL}/${documentId}/versions/${version}`
    );
    return response.data;
  },

  /**
   * Ajouter un commentaire sur un document
   * POST /documents/:id/comments (JWT requis)
   */
  addComment: async (
    documentId: string,
    content: string
  ): Promise<DocumentComment> => {
    const response = await api.post<DocumentComment>(
      `${BASE_URL}/${documentId}/comments`,
      { content }
    );
    return response.data;
  },

  /**
   * Supprimer un commentaire sur un document
   * DELETE /documents/comments/:commentId (JWT requis)
   */
  deleteComment: async (commentId: string): Promise<void> => {
    await api.delete(`${BASE_URL}/comments/${commentId}`);
  },
};
