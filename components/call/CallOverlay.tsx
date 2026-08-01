'use client';

import { useAudioCall } from '@/lib/hooks/useAudioCall';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function Avatar({
  firstName,
  lastName,
  ringing,
}: {
  firstName: string;
  lastName: string;
  ringing?: boolean;
}) {
  return (
    <div className="relative">
      {/* Halo pulsé : dit « ça sonne » sans dépendre d'un son, que le
          navigateur peut avoir bloqué. */}
      {ringing && (
        <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
      )}
      <div className="relative w-20 h-20 rounded-full bg-primary text-white text-2xl font-semibold flex items-center justify-center">
        {firstName?.[0] ?? '?'}
        {lastName?.[0] ?? ''}
      </div>
    </div>
  );
}

/**
 * Sonnerie entrante et panneau d'appel en cours.
 *
 * Monté au-dessus de toute l'application : un appel doit s'afficher quelle que
 * soit la page ouverte, et survivre à la navigation.
 */
export default function CallOverlay() {
  const {
    phase,
    peer,
    muted,
    elapsed,
    answerCall,
    rejectCall,
    hangUp,
    toggleMute,
  } = useAudioCall();

  if (phase === 'idle' || !peer) return null;

  const name = `${peer.firstName} ${peer.lastName}`;

  // Appel entrant : plein écran assombri, on ne peut pas l'ignorer.
  if (phase === 'incoming') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
        <div className="bg-bg-surface rounded-2xl shadow-lg p-8 w-full max-w-sm mx-4 flex flex-col items-center gap-5">
          <Avatar firstName={peer.firstName} lastName={peer.lastName} ringing />
          <div className="text-center">
            <p className="text-xl font-semibold text-text-primary">{name}</p>
            <p className="text-sm text-text-secondary mt-1">
              Appel audio entrant…
            </p>
          </div>
          <div className="flex items-center gap-6 mt-2">
            <button
              onClick={() => void rejectCall()}
              aria-label="Refuser l’appel"
              className="w-14 h-14 rounded-full bg-critical text-white flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <button
              onClick={() => void answerCall()}
              aria-label="Décrocher"
              className="w-14 h-14 rounded-full bg-success text-white flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Appel sortant ou en cours : panneau discret, la navigation reste possible.
  const outgoing = phase === 'outgoing';
  return (
    <div className="fixed bottom-6 right-6 z-[100] bg-bg-surface border border-border rounded-xl shadow-lg p-4 w-72">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-full bg-primary text-white text-sm font-semibold flex items-center justify-center">
            {peer.firstName?.[0] ?? '?'}
            {peer.lastName?.[0] ?? ''}
          </div>
          {outgoing && (
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary truncate">{name}</p>
          <p className="text-xs text-text-secondary">
            {outgoing
              ? 'Sonnerie…'
              : phase === 'ending'
                ? 'Fin de l’appel…'
                : formatDuration(elapsed)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-4">
        <button
          onClick={toggleMute}
          disabled={outgoing}
          aria-label={muted ? 'Réactiver le micro' : 'Couper le micro'}
          title={muted ? 'Réactiver le micro' : 'Couper le micro'}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 ${
            muted
              ? 'bg-critical/15 text-critical'
              : 'bg-bg-surface-hover text-text-secondary hover:text-text-primary'
          }`}
        >
          {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <button
          onClick={() => void hangUp()}
          aria-label="Raccrocher"
          title="Raccrocher"
          className="w-10 h-10 rounded-full bg-critical text-white flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
