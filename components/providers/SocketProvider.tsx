'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { initializeSocket, disconnectSocket } from '@/lib/socket/socket.client';

/**
 * Ouvre et ferme la connexion temps réel en suivant l'état d'authentification.
 *
 * Cette responsabilité vivait auparavant dans le store d'auth, qui appelait
 * `initializeSocket` depuis `login` et depuis son callback de réhydratation.
 * Deux défauts :
 *
 * 1. le store importait le client socket, qui importe le store — un cycle
 *    d'imports dont l'ordre d'évaluation n'est pas garanti par le bundler ;
 * 2. la connexion dépendait d'un effet de bord de réhydratation, invisible et
 *    silencieux en cas d'échec.
 *
 * Ici l'abonnement suit le cycle de vie React et réagit à *chaque* changement
 * de jeton, renouvellement compris : la socket authentifie son handshake avec
 * un jeton frais au lieu de rester coupée après expiration.
 */
export default function SocketProvider() {
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      return;
    }
    initializeSocket();
  }, [token]);

  return null;
}
