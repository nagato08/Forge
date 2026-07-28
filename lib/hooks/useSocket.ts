'use client';

import { useEffect, useRef, useState } from 'react';
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
 * État de connexion du socket, réactif.
 *
 * Le socket est créé de façon asynchrone à la réhydratation du store d'auth :
 * au premier rendu d'une page il n'existe généralement pas encore. On attend
 * donc son apparition avant de s'abonner, sinon l'indicateur reste bloqué sur
 * « déconnecté » alors que la connexion est bien établie.
 */
export function useSocketConnected(): boolean {
  const [connected, setConnected] = useState(
    () => getSocket()?.connected ?? false
  );

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    const setup = (socket: any) => {
      const onConnect = () => setConnected(true);
      const onDisconnect = () => setConnected(false);
      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      cleanups.push(() => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
      });
      setConnected(socket.connected);
    };

    const socket = getSocket();
    if (socket) {
      setup(socket);
    } else {
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

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return connected;
}
