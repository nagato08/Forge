'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { directChatApi, DirectMessage } from '@/lib/api/chat.api';
import { useSocketEvent } from '@/lib/hooks/useSocket';

const CACHE_KEYS = {
  conversations: ['chat', 'direct', 'conversations'],
  directory: ['chat', 'direct', 'directory'],
  messages: (conversationId: string) => ['chat', 'direct', conversationId],
};

export function useDirectConversations() {
  return useQuery({
    queryKey: CACHE_KEYS.conversations,
    queryFn: () => directChatApi.listConversations(),
  });
}

/** Annuaire : chargé à la demande, il n'est utile qu'au moment d'écrire à quelqu'un. */
export function useChatDirectory(enabled: boolean) {
  return useQuery({
    queryKey: CACHE_KEYS.directory,
    queryFn: () => directChatApi.listDirectory(),
    enabled,
    staleTime: 10 * 60 * 1000,
  });
}

export function useDirectMessages(conversationId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: CACHE_KEYS.messages(conversationId ?? ''),
    queryFn: () => directChatApi.getMessages(conversationId!),
    enabled: !!conversationId,
  });

  /**
   * Message reçu en direct : on l'ajoute au fil ouvert, et on rafraîchit la
   * liste des conversations pour que celle qui vient de bouger remonte —
   * y compris quand le fil concerné n'est pas celui affiché.
   */
  useSocketEvent('dm:new', (payload: DirectMessage) => {
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.conversations });
    if (!payload?.conversationId) return;

    queryClient.setQueryData<{
      messages: DirectMessage[];
      total: number;
      hasMore: boolean;
    }>(CACHE_KEYS.messages(payload.conversationId), (old) => {
      if (!old) return old;
      // L'émetteur reçoit aussi son propre message : sans ce garde-fou, il
      // le verrait deux fois, une par la réponse HTTP et une par le socket.
      if (old.messages.some((m) => m.id === payload.id)) return old;
      return { ...old, messages: [...old.messages, payload] };
    });
  });

  // Rejoint la room du fil ouvert pour ne rien manquer côté serveur.
  useEffect(() => {
    if (!conversationId) return;
    queryClient.invalidateQueries({
      queryKey: CACHE_KEYS.messages(conversationId),
    });
  }, [conversationId, queryClient]);

  return query;
}

export function useOpenDirectConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => directChatApi.openWith(userId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.conversations }),
  });
}

export function useSendDirectMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
    }) => directChatApi.sendMessage(conversationId, { content }),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.messages(conversationId),
      });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.conversations });
    },
  });
}
