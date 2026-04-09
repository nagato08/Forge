'use client';

import { useEffect } from 'react';
import { getSocket, onSocket, SocketEventMap } from '@/lib/socket/socket.client';

/**
 * Hook pour s'abonner à un événement socket
 * Se désabonne automatiquement au unmount
 *
 * Usage:
 * useSocketEvent('message:new', (data) => {
 *   console.log('Nouveau message:', data);
 * });
 */
export function useSocketEvent<K extends keyof SocketEventMap>(
  event: K,
  callback: SocketEventMap[K]
): void {
  useEffect(() => {
    const socket = getSocket();

    if (!socket?.connected) {
      console.warn(`Socket event '${event}': socket not connected`);
      return;
    }

    // S'abonner
    const unsubscribe = onSocket(event, callback);

    // Cleanup: se désabonner
    return () => {
      unsubscribe();
    };
  }, [event, callback]);
}

/**
 * Hook pour écouter plusieurs événements socket
 * Se désabonne automatiquement au unmount
 *
 * Usage:
 * useSocketEvents({
 *   'message:new': (data) => console.log('Message:', data),
 *   'notification:new': (data) => console.log('Notification:', data),
 * });
 */
export function useSocketEvents(
  events: Partial<{
    [K in keyof SocketEventMap]: SocketEventMap[K];
  }>
): void {
  useEffect(() => {
    const socket = getSocket();

    if (!socket?.connected) {
      console.warn('Socket: socket not connected');
      return;
    }

    const unsubscribers: Array<() => void> = [];

    // S'abonner à tous les événements
    Object.entries(events).forEach(([event, callback]) => {
      if (callback) {
        unsubscribers.push(onSocket(event as keyof SocketEventMap, callback as any));
      }
    });

    // Cleanup: se désabonner de tous
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [events]);
}

/**
 * Hook pour vérifier si le socket est connecté
 */
export function useSocketConnected(): boolean {
  const socket = getSocket();
  return socket?.connected ?? false;
}
