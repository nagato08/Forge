'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '@/lib/api/messages.api';
import { CreateMessageRequest } from '@/lib/types/message.types';
import { useSocketEvent } from '@/lib/hooks/useSocket';
import { getApiError } from '@/lib/utils/api-error';

const CACHE_KEYS = {
  projectMessages: (projectId: string) => ['messages', 'project', projectId],
  messageById: (messageId: string) => ['messages', messageId],
};

/**
 * Hook pour récupérer les messages d'un projet
 */
export function useProjectMessages(projectId: string | null) {
  const queryClient = useQueryClient();

  // Écouter les nouveaux messages via WebSocket
  useSocketEvent('project:message:new', (message) => {
    if (message.projectId === projectId) {
      console.log('📨 New project message received via socket:', message.id);
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.projectMessages(projectId!),
      });
    }
  });

  return useQuery({
    queryKey: CACHE_KEYS.projectMessages(projectId || ''),
    queryFn: () => messagesApi.getProjectMessages(projectId!),
    enabled: !!projectId,
    staleTime: 0, // Toujours fresh (socket met à jour)
  });
}

/**
 * Hook pour envoyer un message
 */
export function useSendProjectMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: string;
      data: CreateMessageRequest;
    }) => messagesApi.sendMessage(projectId, data),
    onSuccess: (message) => {
      console.log('✅ Message sent successfully:', message.id);
      // Invalider la liste des messages
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.projectMessages(message.projectId),
      });
    },
    onError: (error) => {
      console.error('❌ Send message error:', getApiError(error));
    },
  });
}

/**
 * Hook pour supprimer un message
 */
export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => messagesApi.deleteMessage(messageId),
    onSuccess: () => {
      console.log('✅ Message deleted successfully');
      // Invalider toutes les listes de messages
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.projectMessages(''),
      });
    },
    onError: (error) => {
      console.error('❌ Delete message error:', getApiError(error));
    },
  });
}

/**
 * Hook pour récupérer un message par ID
 */
export function useMessageById(messageId: string | null) {
  return useQuery({
    queryKey: CACHE_KEYS.messageById(messageId || ''),
    queryFn: () => messagesApi.getMessageById(messageId!),
    enabled: !!messageId,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
