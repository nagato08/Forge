import api from './client';
import { ChatPerson } from './chat.api';

export type CallStatus = 'RINGING' | 'ANSWERED' | 'MISSED' | 'REJECTED';

/** Interlocuteur d'un appel : l'identité suffit à l'afficher. */
export type CallPeer = Pick<ChatPerson, 'id' | 'firstName' | 'lastName' | 'avatar'>;

export interface Call {
  id: string;
  conversationId: string | null;
  callerId: string;
  calleeId: string;
  caller: CallPeer;
  callee: CallPeer;
  status: CallStatus;
  startedAt: string;
  /** Renseignée au décrochage : la durée se compte à partir d'ici. */
  answeredAt: string | null;
  endedAt: string | null;
}

/** Entrée du journal, enrichie du point de vue de celui qui consulte. */
export interface CallHistoryEntry extends Call {
  outgoing: boolean;
  durationSeconds: number;
}

const BASE_URL = '/calls';

export const callApi = {
  /**
   * Journal de mes appels, le plus récent en tête.
   * GET /calls (JWT requis)
   */
  listMine: async (): Promise<CallHistoryEntry[]> => {
    const response = await api.get<CallHistoryEntry[]>(BASE_URL);
    return response.data;
  },

  /**
   * Lancer un appel : le destinataire se met à sonner.
   * POST /calls (JWT requis)
   */
  start: async (data: {
    calleeId: string;
    conversationId?: string;
  }): Promise<Call> => {
    const response = await api.post<Call>(BASE_URL, data);
    return response.data;
  },

  /** PATCH /calls/:callId/answer — destinataire uniquement. */
  answer: async (callId: string): Promise<Call> => {
    const response = await api.patch<Call>(`${BASE_URL}/${callId}/answer`);
    return response.data;
  },

  /** PATCH /calls/:callId/reject — destinataire uniquement. */
  reject: async (callId: string): Promise<Call> => {
    const response = await api.patch<Call>(`${BASE_URL}/${callId}/reject`);
    return response.data;
  },

  /** PATCH /calls/:callId/end — des deux côtés. */
  end: async (callId: string): Promise<Call> => {
    const response = await api.patch<Call>(`${BASE_URL}/${callId}/end`);
    return response.data;
  },
};
