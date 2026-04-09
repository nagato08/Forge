'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@/lib/api/documents.api';

const CACHE_KEYS = {
  projectDocuments: (projectId: string) => ['documents', 'project', projectId],
  myDocuments: ['documents', 'my'],
  byId: (id: string) => ['documents', id],
  versions: (id: string) => ['documents', id, 'versions'],
};

/**
 * Hook pour récupérer les documents d'un projet
 */
export function useProjectDocuments(projectId: string | null) {
  return useQuery({
    queryKey: CACHE_KEYS.projectDocuments(projectId || ''),
    queryFn: () => documentsApi.getProjectDocuments(projectId!),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

/**
 * Hook pour récupérer mes documents
 */
export function useMyDocuments() {
  return useQuery({
    queryKey: CACHE_KEYS.myDocuments,
    queryFn: () => documentsApi.getMyDocuments(),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

/**
 * Hook pour récupérer un document par ID
 */
export function useDocumentById(documentId: string | null) {
  return useQuery({
    queryKey: CACHE_KEYS.byId(documentId || ''),
    queryFn: () => documentsApi.getDocumentById(documentId!),
    enabled: !!documentId,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

/**
 * Hook pour récupérer les versions d'un document
 */
export function useDocumentVersions(documentId: string | null) {
  return useQuery({
    queryKey: CACHE_KEYS.versions(documentId || ''),
    queryFn: () => documentsApi.getDocumentVersions(documentId!),
    enabled: !!documentId,
    staleTime: 10 * 60 * 1000, // 10 min
  });
}

/**
 * Hook pour créer un document
 */
export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      name,
    }: {
      projectId: string;
      name: string;
    }) => documentsApi.createDocument(projectId, name),
    onSuccess: (document) => {
      // Invalider liste documents du projet
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.projectDocuments(document.projectId),
      });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.myDocuments });
    },
  });
}

/**
 * Hook pour mettre à jour un document
 */
export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      name,
    }: {
      documentId: string;
      name: string;
    }) => documentsApi.updateDocument(documentId, name),
    onSuccess: (document, { documentId }) => {
      // Invalider le document
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.byId(documentId) });
      // Invalider liste du projet
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.projectDocuments(document.projectId),
      });
    },
  });
}

/**
 * Hook pour supprimer un document
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => documentsApi.deleteDocument(documentId),
    onSuccess: () => {
      // Invalider toutes les listes de documents
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

/**
 * Hook pour uploader une version de document
 */
export function useUploadVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      file,
    }: {
      documentId: string;
      file: File;
    }) => documentsApi.uploadVersion(documentId, file),
    onSuccess: (document, { documentId }) => {
      // Invalider le document
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.byId(documentId) });
      // Invalider les versions
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.versions(documentId),
      });
      // Invalider liste du projet
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.projectDocuments(document.projectId),
      });
    },
  });
}

/**
 * Hook pour ajouter un commentaire sur un document
 */
export function useAddDocumentComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      content,
    }: {
      documentId: string;
      content: string;
    }) => documentsApi.addComment(documentId, content),
    onSuccess: (_, { documentId }) => {
      // Invalider le document (commentaires inclus)
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.byId(documentId) });
    },
  });
}

/**
 * Hook pour supprimer un commentaire
 */
export function useDeleteDocumentComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) =>
      documentsApi.deleteComment(commentId),
    onSuccess: () => {
      // Invalider tous les documents (on ne sait pas lequel)
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}
