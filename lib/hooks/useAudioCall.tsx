'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { callApi, Call, CallPeer } from '@/lib/api/call.api';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useSocketEvent } from '@/lib/hooks/useSocket';
import { emitSocketEvent } from '@/lib/socket/socket.client';
import { getApiError } from '@/lib/utils/api-error';
import { toast } from '@/lib/stores/toast.store';

/**
 * Serveurs STUN publics : ils permettent à chaque navigateur de découvrir son
 * adresse publique pour que les deux puissent se joindre directement.
 *
 * Sans serveur TURN en relais, un appel échoue derrière certains pare-feux
 * d'entreprise et NAT symétriques. En ajouter un suppose de l'héberger — c'est
 * la limite connue de cette implémentation.
 */
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

type Phase = 'idle' | 'outgoing' | 'incoming' | 'active' | 'ending';

interface AudioCallState {
  phase: Phase;
  call: Call | null;
  /** L'autre bout de la ligne, quel que soit le sens de l'appel. */
  peer: CallPeer | null;
  muted: boolean;
  /** Secondes écoulées depuis le décrochage. */
  elapsed: number;
  startCall: (calleeId: string, conversationId?: string) => Promise<void>;
  answerCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  hangUp: () => Promise<void>;
  toggleMute: () => void;
}

const AudioCallContext = createContext<AudioCallState | null>(null);

export function useAudioCall(): AudioCallState {
  const context = useContext(AudioCallContext);
  if (!context) {
    throw new Error('useAudioCall doit être utilisé dans AudioCallProvider');
  }
  return context;
}

/**
 * Pilote un appel audio de bout en bout : capture du micro, négociation
 * WebRTC, et cycle de vie côté serveur.
 *
 * Monté une seule fois, au-dessus de toute l'application : un appel doit
 * survivre au changement de page, et la sonnerie doit se déclencher où que
 * l'on se trouve.
 */
export function AudioCallProvider({ children }: { children: React.ReactNode }) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<Phase>('idle');
  const [call, setCall] = useState<Call | null>(null);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteAudio = useRef<HTMLAudioElement | null>(null);
  /**
   * Candidats reçus avant que la description distante ne soit posée.
   * Les ajouter trop tôt fait échouer la négociation : on les met de côté.
   */
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  /** Lu dans des abonnements socket qui ne doivent pas se réabonner. */
  const callRef = useRef<Call | null>(null);

  useEffect(() => {
    callRef.current = call;
  }, [call]);

  const peer: CallPeer | null = call
    ? call.callerId === currentUserId
      ? call.callee
      : call.caller
    : null;

  /**
   * Coupe tout : micro relâché, connexion fermée, état remis à zéro.
   *
   * Le micro est le point sensible — omettre `stop()` laisse la pastille
   * d'enregistrement du navigateur allumée après l'appel.
   */
  const teardown = useCallback(() => {
    localStream.current?.getTracks().forEach((track) => track.stop());
    localStream.current = null;

    peerConnection.current?.close();
    peerConnection.current = null;

    if (remoteAudio.current) {
      remoteAudio.current.srcObject = null;
    }
    pendingCandidates.current = [];

    setPhase('idle');
    setCall(null);
    setMuted(false);
    setElapsed(0);
    queryClient.invalidateQueries({ queryKey: ['calls'] });
  }, [queryClient]);

  const sendSignal = useCallback(
    (callId: string, signal: RTCSessionDescriptionInit | RTCIceCandidateInit) => {
      emitSocketEvent('call:signal', { callId, signal });
    },
    []
  );

  /** Prépare la connexion : micro capté, pistes ajoutées, ICE branché. */
  const createPeerConnection = useCallback(
    async (callId: string) => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      localStream.current = stream;

      const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      stream.getTracks().forEach((track) => connection.addTrack(track, stream));

      connection.onicecandidate = (event) => {
        if (event.candidate) sendSignal(callId, event.candidate.toJSON());
      };

      connection.ontrack = (event) => {
        if (remoteAudio.current) {
          remoteAudio.current.srcObject = event.streams[0];
          void remoteAudio.current.play().catch(() => {
            // La lecture automatique peut être refusée : sans geste préalable
            // de l'utilisateur, le navigateur bloque le son.
            toast.error('Autorisez la lecture audio pour entendre votre correspondant');
          });
        }
      };

      peerConnection.current = connection;
      return connection;
    },
    [sendSignal]
  );

  // --- Actions ---

  const startCall = useCallback(
    async (calleeId: string, conversationId?: string) => {
      if (phase !== 'idle') {
        toast.error('Un appel est déjà en cours');
        return;
      }

      try {
        const created = await callApi.start({ calleeId, conversationId });
        setCall(created);
        callRef.current = created;
        setPhase('outgoing');

        // L'offre part immédiatement : le destinataire la trouvera en place
        // au moment où il décroche, ce qui évite un aller-retour de plus.
        const connection = await createPeerConnection(created.id);
        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer);
        sendSignal(created.id, offer);
      } catch (err) {
        toast.error(getApiError(err), { title: 'Appel impossible' });
        teardown();
      }
    },
    [phase, createPeerConnection, sendSignal, teardown]
  );

  const answerCall = useCallback(async () => {
    const current = callRef.current;
    if (!current) return;

    try {
      await callApi.answer(current.id);
      // La connexion se prépare ici ; l'offre déjà reçue est appliquée par le
      // gestionnaire de signalisation.
      if (!peerConnection.current) await createPeerConnection(current.id);
      setPhase('active');
    } catch (err) {
      toast.error(getApiError(err), { title: 'Impossible de décrocher' });
      teardown();
    }
  }, [createPeerConnection, teardown]);

  const rejectCall = useCallback(async () => {
    const current = callRef.current;
    if (!current) return;
    try {
      await callApi.reject(current.id);
    } catch {
      // Le refus reste local si le serveur ne répond pas : mieux vaut couper
      // la sonnerie que la laisser tourner sur une erreur réseau.
    }
    teardown();
  }, [teardown]);

  const hangUp = useCallback(async () => {
    const current = callRef.current;
    if (!current) return;
    setPhase('ending');
    try {
      await callApi.end(current.id);
    } catch {
      // Idem : on raccroche localement quoi qu'il arrive.
    }
    teardown();
  }, [teardown]);

  const toggleMute = useCallback(() => {
    const stream = localStream.current;
    if (!stream) return;
    const next = !muted;
    // Couper la piste plutôt que le volume : rien ne part sur le réseau.
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
    setMuted(next);
  }, [muted]);

  /** Applique les candidats mis de côté avant la description distante. */
  async function drainCandidates(connection: RTCPeerConnection) {
    const queued = pendingCandidates.current;
    pendingCandidates.current = [];
    for (const candidate of queued) {
      await connection.addIceCandidate(candidate).catch(() => {
        // Un candidat périmé n'empêche pas les autres d'aboutir.
      });
    }
  }

  // --- Événements serveur ---

  useSocketEvent('call:incoming', (payload) => {
    // Un appel qui arrive pendant qu'on est occupé n'interrompt pas le premier.
    if (callRef.current) return;
    const incoming = payload as unknown as Call;
    setCall(incoming);
    callRef.current = incoming;
    setPhase('incoming');
  });

  useSocketEvent('call:answered', (payload) => {
    const answered = payload as unknown as Call;
    if (callRef.current?.id !== answered.id) return;
    setCall(answered);
    setPhase('active');
  });

  useSocketEvent('call:rejected', (payload) => {
    const rejected = payload as unknown as Call;
    if (callRef.current?.id !== rejected.id) return;
    toast.info('Appel refusé');
    teardown();
  });

  useSocketEvent('call:ended', (payload) => {
    const ended = payload as unknown as Call;
    if (callRef.current?.id !== ended.id) return;
    teardown();
  });

  useSocketEvent('call:signal', (payload) => {
    const { callId, signal } = payload;
    const current = callRef.current;
    if (!current || current.id !== callId) return;

    void (async () => {
      const connection = peerConnection.current;

      if ('sdp' in signal) {
        const description = signal as RTCSessionDescriptionInit;

        if (description.type === 'offer') {
          // L'offre arrive parfois avant le décrochage : la connexion n'existe
          // pas encore, on la crée pour pouvoir répondre dès l'acceptation.
          const target = connection ?? (await createPeerConnection(callId));
          await target.setRemoteDescription(description);
          await drainCandidates(target);
          const answer = await target.createAnswer();
          await target.setLocalDescription(answer);
          sendSignal(callId, answer);
          return;
        }

        if (connection && description.type === 'answer') {
          await connection.setRemoteDescription(description);
          await drainCandidates(connection);
        }
        return;
      }

      const candidate = signal as RTCIceCandidateInit;
      if (connection?.remoteDescription) {
        await connection.addIceCandidate(candidate);
      } else {
        pendingCandidates.current.push(candidate);
      }
    })();
  });

  // Minuteur de conversation, démarré au décrochage.
  useEffect(() => {
    if (phase !== 'active') return;
    const interval = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Filet de sécurité : fermer l'onglet en pleine conversation doit rendre le
  // micro, même si aucun raccrochage n'a été demandé.
  useEffect(() => {
    return () => {
      localStream.current?.getTracks().forEach((track) => track.stop());
      peerConnection.current?.close();
    };
  }, []);

  return (
    <AudioCallContext.Provider
      value={{
        phase,
        call,
        peer,
        muted,
        elapsed,
        startCall,
        answerCall,
        rejectCall,
        hangUp,
        toggleMute,
      }}
    >
      {children}
      {/* Sortie audio du correspondant : jamais visible, toujours montée. */}
      <audio ref={remoteAudio} autoPlay playsInline className="hidden" />
    </AudioCallContext.Provider>
  );
}
