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

  // Une socket deja ouverte n'a rien a se voir remplacer.
  if (socket?.connected) {
    return;
  }

  // Une socket existante mais coupee est en boucle de reconnexion. La laisser
  // vivre pendant qu'on en cree une seconde donne deux clients concurrents
  // pour le meme compte : doublons de messages et presence faussee.
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', {
    // Callback plutôt qu'objet figé : il est rejoué à CHAQUE tentative de
    // connexion. Le serveur vérifie le JWT au handshake et l'access token ne
    // vit que 15 min — un jeton capturé une fois ferait échouer toutes les
    // reconnexions ultérieures.
    auth: (cb) => {
      cb({ token: `Bearer ${useAuthStore.getState().token ?? ''}` });
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    reconnectionAttempts: Infinity, // Ne jamais abandonner
    timeout: 10000,
  });

  // Ces deux traces sont volontaires : sans elles, une socket qui ne s'ouvre
  // jamais est indiscernable d'une socket qui s'ouvre puis se fait couper, et
  // le gateway ne journalise que les rejets.
  socket.on('connect', () => {
    console.info('[socket] connecte', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.info('[socket] deconnecte :', reason);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });
}

/**
 * Execute `callback` des que la socket existe, immediatement si elle est deja
 * la.
 *
 * La socket est ouverte par SocketProvider apres le premier rendu : un
 * composant qui appelle `getSocket()` a son montage recoit `null` et, s'il
 * abandonne la, ne s'abonne jamais. Ce piege a produit deux bugs distincts
 * (indicateur de connexion fige, liste de presence vide) — d'ou cet unique
 * point de passage.
 *
 * Renvoie une fonction d'annulation, a appeler au demontage.
 */
export function onSocketAvailable(
  callback: (socket: Socket) => void
): () => void {
  if (socket) {
    callback(socket);
    return () => {};
  }

  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    if (socket) {
      clearInterval(interval);
      callback(socket);
    } else if (attempts >= 25) {
      // 5 s sans socket : l'utilisateur n'est pas authentifie, inutile
      // d'occuper un timer indefiniment.
      clearInterval(interval);
    }
  }, 200);

  return () => clearInterval(interval);
}

/**
 * Déconnecter le socket
 * Appeler au logout
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
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

  /** Message d'une conversation directe, diffusé aux deux participants. */
  'dm:new': (data: {
    id: string;
    content: string;
    conversationId: string;
    userId: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    mentions: string[];
    attachments: {
      id: string;
      name: string;
      url: string;
      size: number;
      mimeType: string;
    }[];
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

  /** Un utilisateur vient d'ouvrir sa première connexion. */
  'presence:online': (data: { userId: string }) => void;

  /** Un utilisateur a fermé sa dernière connexion. */
  'presence:offline': (data: { userId: string }) => void;

  /** Instantané des connectés, en réponse à une demande explicite. */
  'presence:list': (data: { userIds: string[] }) => void;

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
