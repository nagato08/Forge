'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi, ChatMessage, encodeAttachment } from '@/lib/api/chat.api';
import { useSocketEvent } from '@/lib/hooks/useSocket';
import { useAuthStore } from '@/lib/stores/auth.store';
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
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.messages(projectId!),
      });
    }
  });

  return useQuery({
    queryKey: CACHE_KEYS.messages(projectId || ''),
    queryFn: () => chatApi.getMessages(projectId!),
    enabled: !!projectId,
    staleTime: 0,
  });
}

/**
 * Hook pour envoyer un message
 * Utilise un optimistic update pour afficher le message immédiatement
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore.getState().user;

  return useMutation({
    mutationFn: ({
      projectId,
      content,
    }: {
      projectId: string;
      content: string;
    }) => chatApi.sendMessage(projectId, content),

    // Optimistic update : ajouter le message localement avant la réponse API
    onMutate: async ({ projectId, content }) => {
      await queryClient.cancelQueries({
        queryKey: CACHE_KEYS.messages(projectId),
      });

      const previousMessages = queryClient.getQueryData<ChatMessage[]>(
        CACHE_KEYS.messages(projectId)
      );

      const optimisticMessage: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        content,
        projectId,
        userId: currentUser?.id || '',
        user: currentUser
          ? {
              id: currentUser.id,
              firstName: currentUser.firstName,
              lastName: currentUser.lastName,
              avatar: currentUser.avatar,
            }
          : { id: '', firstName: 'Moi', lastName: '' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<ChatMessage[]>(
        CACHE_KEYS.messages(projectId),
        (old) => [...(old || []), optimisticMessage]
      );

      return { previousMessages, projectId };
    },

    // En cas de succès : refetch pour avoir le vrai message avec l'ID serveur
    onSuccess: (_, variables) => {
      console.log('✅ Message sent, refetching...');
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.messages(variables.projectId),
      });
    },

    // En cas d'erreur : rollback à l'état précédent
    onError: (error, _, context) => {
      console.error('❌ Send message error:', getApiError(error));
      if (context?.previousMessages !== undefined) {
        queryClient.setQueryData(
          CACHE_KEYS.messages(context.projectId),
          context.previousMessages
        );
      }
    },
  });
}

/**
 * Hook pour envoyer un fichier dans le chat
 * Upload via documents API puis envoie un message avec le lien
 */
export function useSendFileMessage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore.getState().user;

  return useMutation({
    mutationFn: ({
      projectId,
      file,
      textContent,
    }: {
      projectId: string;
      file: File;
      textContent?: string;
    }) => chatApi.sendFileMessage(projectId, file, textContent),

    onMutate: async ({ projectId, file, textContent }) => {
      await queryClient.cancelQueries({
        queryKey: CACHE_KEYS.messages(projectId),
      });

      const previousMessages = queryClient.getQueryData<ChatMessage[]>(
        CACHE_KEYS.messages(projectId)
      );

      const attachment = encodeAttachment({
        name: file.name,
        url: '',
        size: file.size,
        type: file.type,
      });

      const optimisticMessage: ChatMessage = {
        id: `optimistic-file-${Date.now()}`,
        content: textContent ? `${textContent}\n${attachment}` : attachment,
        projectId,
        userId: currentUser?.id || '',
        user: currentUser
          ? {
              id: currentUser.id,
              firstName: currentUser.firstName,
              lastName: currentUser.lastName,
              avatar: currentUser.avatar,
            }
          : { id: '', firstName: 'Moi', lastName: '' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<ChatMessage[]>(
        CACHE_KEYS.messages(projectId),
        (old) => [...(old || []), optimisticMessage]
      );

      return { previousMessages, projectId };
    },

    onSuccess: (_, variables) => {
      console.log('✅ File message sent, refetching...');
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.messages(variables.projectId),
      });
    },

    onError: (error, _, context) => {
      console.error('❌ Send file message error:', getApiError(error));
      if (context?.previousMessages !== undefined) {
        queryClient.setQueryData(
          CACHE_KEYS.messages(context.projectId),
          context.previousMessages
        );
      }
    },
  });
}
