'use client';

import { useEffect, useRef } from 'react';
import { getSocket, SocketEventMap } from '@/lib/socket/socket.client';

/**
 * Hook pour s'abonner à un événement socket
 * Gère le cas où le socket n'est pas encore connecté (rehydratation)
 * Se réabonne automatiquement quand le socket se connecte
 */
export function useSocketEvent<K extends keyof SocketEventMap>(
  event: K,
  callback: SocketEventMap[K]
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    const handler = (...args: any[]) => {
      (callbackRef.current as (...a: any[]) => void)(...args);
    };

    const subscribe = (socket: any) => {
      socket.on(event, handler);
      cleanups.push(() => socket.off(event, handler));
    };

    const setup = (socket: any) => {
      if (socket.connected) {
        subscribe(socket);
      }
      // Écouter connect/reconnect pour se réabonner
      const onConnect = () => subscribe(socket);
      socket.on('connect', onConnect);
      cleanups.push(() => socket.off('connect', onConnect));
    };

    const socket = getSocket();
    if (socket) {
      setup(socket);
    } else {
      // Socket pas encore créé — poll jusqu'à ce qu'il apparaisse
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        const s = getSocket();
        if (s) {
          clearInterval(interval);
          setup(s);
        }
        if (attempts >= 15) clearInterval(interval);
      }, 200);
      cleanups.push(() => clearInterval(interval));
    }

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [event]);
}

/**
 * Hook pour écouter plusieurs événements socket
 */
export function useSocketEvents(
  events: Partial<{
    [K in keyof SocketEventMap]: SocketEventMap[K];
  }>
): void {
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    const subscribe = (socket: any) => {
      Object.entries(eventsRef.current).forEach(([evt, cb]) => {
        if (cb) {
          socket.on(evt, cb);
          cleanups.push(() => socket.off(evt, cb));
        }
      });
    };

    const setup = (socket: any) => {
      if (socket.connected) {
        subscribe(socket);
      }
      const onConnect = () => subscribe(socket);
      socket.on('connect', onConnect);
      cleanups.push(() => socket.off('connect', onConnect));
    };

    const socket = getSocket();
    if (socket) {
      setup(socket);
    }

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, []);
}

/**
 * Hook pour vérifier si le socket est connecté
 */
export function useSocketConnected(): boolean {
  const socket = getSocket();
  return socket?.connected ?? false;
}
