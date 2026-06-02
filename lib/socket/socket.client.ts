import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/lib/stores/auth.store';

let socket: Socket | null = null;

/**
 * Obtenir l'instance socket singleton
 * Retourne null si non connecté
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Initialiser la connexion socket avec JWT
 * Appeler après login
 */
export function initializeSocket(): void {
  const token = useAuthStore.getState().token;

  if (!token) {
    console.warn('Socket: No token available, cannot connect');
    return;
  }

  if (socket?.connected) {
    console.log('Socket already connected');
    return;
  }

  socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', {
    auth: {
      token: `Bearer ${token}`,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    reconnectionAttempts: Infinity, // Ne jamais abandonner
    timeout: 10000,
  });

  // Événements de connexion
  socket.on('connect', () => {
    console.log('✅ Socket connecté');
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket déconnecté');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });
}

/**
 * Déconnecter le socket
 * Appeler au logout
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket déconnecté');
  }
}

/**
 * S'abonner à un événement socket
 * Retourne une fonction pour se désabonner
 */
export function onSocketEvent(
  event: string,
  callback: (...args: any[]) => void
): () => void {
  if (!socket) {
    console.warn(`Socket: tried to listen to '${event}' but socket is not connected`);
    return () => {};
  }

  socket.on(event, callback);

  // Retourner fonction de désabonnement
  return () => {
    if (socket) {
      socket.off(event, callback);
    }
  };
}

/**
 * Émettre un événement socket
 */
export function emitSocketEvent(
  event: string,
  data?: any
): void {
  if (!socket?.connected) {
    console.warn(`Socket: tried to emit '${event}' but socket is not connected`);
    return;
  }

  socket.emit(event, data);
}

/**
 * Types d'événements socket disponibles
 */
export type SocketEventMap = {
  'message:new': (data: {
    id: string;
    content: string;
    projectId: string;
    userId: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    createdAt: string;
  }) => void;

  'project:message:new': (data: {
    id: string;
    content: string;
    projectId: string;
    userId: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    mentions?: string[];
    createdAt: string;
  }) => void;

  'user:typing': (data: {
    projectId: string;
    userId: string;
    userName: string;
  }) => void;

  'user:stopped-typing': (data: {
    projectId: string;
    userId: string;
  }) => void;

  'notification:new': (data: {
    id: string;
    type: string;
    content: string;
    userId: string;
    read: boolean;
    relatedTaskId?: string;
    relatedProjectId?: string;
    relatedDocumentId?: string;
    createdAt: string;
  }) => void;

  'task:updated': (data: {
    id: string;
    title: string;
    status: string;
    projectId: string;
    updatedAt: string;
  }) => void;

  'task:status-changed': (data: {
    taskId: string;
    oldStatus: string;
    newStatus: string;
    projectId: string;
    changedBy: string;
    changedAt: string;
  }) => void;
};

/**
 * Helper typé pour s'abonner aux événements
 */
export function onSocket<K extends keyof SocketEventMap>(
  event: K,
  callback: SocketEventMap[K]
): () => void {
  return onSocketEvent(event, callback as any);
}
