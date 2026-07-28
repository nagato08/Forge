'use client';

import { useEffect, useState } from 'react';
import { useSocketEvent } from '@/lib/hooks/useSocket';
import { emitSocketEvent, getSocket } from '@/lib/socket/socket.client';

/**
 * Utilisateurs actuellement connectés.
 *
 * Les événements `presence:online` / `presence:offline` ne décrivent que les
 * changements survenus après l'abonnement : on demande donc un instantané à
 * l'ouverture, sinon on ignore tous ceux qui étaient déjà là.
 */
export function usePresence() {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  // Instantané initial, rejoué à chaque reconnexion : pendant une coupure,
  // des arrivées et départs ont pu nous échapper.
  useEffect(() => {
    const requestSnapshot = () => emitSocketEvent('presence:list', undefined);

    requestSnapshot();

    const socket = getSocket();
    if (!socket) return;

    socket.on('connect', requestSnapshot);
    return () => {
      socket.off('connect', requestSnapshot);
    };
  }, []);

  useSocketEvent('presence:list', ({ userIds }) => {
    setOnlineUserIds(new Set(userIds));
  });

  useSocketEvent('presence:online', ({ userId }) => {
    setOnlineUserIds((prev) => new Set(prev).add(userId));
  });

  useSocketEvent('presence:offline', ({ userId }) => {
    setOnlineUserIds((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
  });

  return {
    onlineUserIds,
    isOnline: (userId: string) => onlineUserIds.has(userId),
  };
}
