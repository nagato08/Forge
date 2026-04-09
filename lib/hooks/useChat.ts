'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/lib/api/chat.api';
import { useSocketEvent } from '@/lib/hooks/useSocket';
import { getApiError } from '@/lib/utils/api-error';

const CACHE_KEYS = {
  messages: (projectId: string) => ['chat', 'messages', projectId],
};

/**
 * Hook pour récupérer les messages d'un projet
 */
export function useMessages(projectId: string | null) {
  const queryClient = useQueryClient();

  // Écouter les nouveaux messages en temps réel
  useSocketEvent('message:new', (message) => {
    if (message.projectId === projectId) {
      console.log('💬 New message received via socket:', message.id);
      // Invalider pour refetch
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.messages(projectId!),
      });
    }
  });

  return useQuery({
    queryKey: CACHE_KEYS.messages(projectId || ''),
    queryFn: () => chatApi.getMessages(projectId!),
    enabled: !!projectId,
    staleTime: 0, // Toujours fresh (socket met à jour en temps réel)
  });
}

/**
 * Hook pour envoyer un message
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      content,
    }: {
      projectId: string;
      content: string;
    }) => chatApi.sendMessage(projectId, content),
    onSuccess: (message) => {
      console.log('✅ Message sent successfully:', message.id);
      // Invalider la liste des messages
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.messages(message.projectId),
      });
    },
    onError: (error) => {
      console.error('❌ Send message error:', getApiError(error));
    },
  });
}
