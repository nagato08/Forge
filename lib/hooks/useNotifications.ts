'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/notifications.api';
import { useSocketEvent } from '@/lib/hooks/useSocket';

const CACHE_KEYS = {
  all: ['notifications'],
  unread: ['notifications', 'unread'],
  unreadCount: ['notifications', 'unread-count'],
};

/**
 * Hook pour récupérer les notifications
 */
export function useNotifications(unreadOnly?: boolean) {
  const queryClient = useQueryClient();

  // Écouter les nouvelles notifications en temps réel
  useSocketEvent('notification:new', () => {
    // Invalider la liste pour refetch
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.all });
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.unreadCount });
  });

  return useQuery({
    queryKey: [...CACHE_KEYS.all, unreadOnly],
    queryFn: () => notificationsApi.getNotifications(unreadOnly),
    staleTime: 1 * 60 * 1000, // 1 min
  });
}

/**
 * Hook pour récupérer le nombre de notifications non lues
 */
export function useUnreadCount() {
  const queryClient = useQueryClient();

  // Écouter les nouvelles notifications
  useSocketEvent('notification:new', () => {
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.unreadCount });
  });

  return useQuery({
    queryKey: CACHE_KEYS.unreadCount,
    queryFn: () => notificationsApi.getUnreadCount(),
    staleTime: 0, // Toujours fresh
    refetchInterval: 30 * 1000, // Refetch toutes les 30s
  });
}

/**
 * Hook pour marquer une notification comme lue
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsApi.markNotificationAsRead(notificationId),
    onSuccess: () => {
      // Invalider les notifications
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.unreadCount });
    },
  });
}

/**
 * Hook pour marquer toutes les notifications comme lues
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllNotificationsAsRead(),
    onSuccess: () => {
      // Invalider les notifications
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.unreadCount });
    },
  });
}

/**
 * Hook pour supprimer une notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsApi.deleteNotification(notificationId),
    onSuccess: () => {
      // Invalider les notifications
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.unreadCount });
    },
  });
}

/**
 * Hook pour récupérer les paramètres de notification
 */
export function useNotificationSettings() {
  return useQuery({
    queryKey: ['notification-settings'],
    queryFn: () => notificationsApi.getNotificationSettings(),
    staleTime: 30 * 60 * 1000, // 30 min
  });
}

/**
 * Hook pour mettre à jour les paramètres de notification
 */
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: { email?: boolean; realtime?: boolean }) =>
      notificationsApi.updateNotificationSettings(settings),
    onSuccess: () => {
      // Invalider les settings
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
    },
  });
}
