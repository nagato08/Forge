'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { usePresence } from '@/lib/hooks/usePresence';
import { useSocketConnected } from '@/lib/hooks/useSocket';
import { useAudioCall } from '@/lib/hooks/useAudioCall';
import {
  useDirectMessages,
  useSendDirectMessage,
} from '@/lib/hooks/useDirectChat';
import { ChatPerson } from '@/lib/api/chat.api';
import { getApiError } from '@/lib/utils/api-error';
import { toast } from '@/lib/stores/toast.store';
import Spinner from '@/components/ui/Spinner';
import { MessageCircle, Send, Phone } from 'lucide-react';

interface DirectChatProps {
  conversationId: string;
  participant: ChatPerson | null;
}

/**
 * Fil de discussion entre deux personnes.
 *
 * Délibérément plus simple que le canal de projet : ni mentions ni indicateur
 * de saisie. À deux, savoir qui est visé n'a pas d'objet, et l'essentiel —
 * temps réel et présence — reste acquis.
 */
export default function DirectChat({
  conversationId,
  participant,
}: DirectChatProps) {
  const currentUser = useAuthStore((state) => state.user);
  const { data, isLoading, error } = useDirectMessages(conversationId);
  const sendMutation = useSendDirectMessage();
  const socketConnected = useSocketConnected();
  const { isOnline } = usePresence();
  const { startCall, phase: callPhase } = useAudioCall();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = data?.messages ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    const content = inputValue.trim();
    if (!content) return;

    sendMutation.mutate(
      { conversationId, content },
      {
        onError: (err) => toast.error(getApiError(err), { title: 'Échec' }),
      }
    );
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const participantName = participant
    ? `${participant.firstName} ${participant.lastName}`
    : 'Conversation';
  const participantOnline = participant ? isOnline(participant.id) : false;

  if (isLoading) {
    return <Spinner centered size="lg" label="Chargement de la conversation..." />;
  }

  if (error) {
    return (
      <div className="p-6 text-text-secondary">
        Impossible de charger cette conversation
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-surface rounded-lg border border-border">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-primary text-white text-sm flex items-center justify-center font-semibold">
              {participant?.firstName?.[0] ?? '?'}
              {participant?.lastName?.[0] ?? ''}
            </div>
            {participantOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-bg-surface" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-text-primary truncate">
              {participantName}
            </h2>
            <p className="text-xs text-text-secondary truncate">
              {participant?.jobTitle ??
                (participantOnline ? 'En ligne' : 'Hors ligne')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {participant && (
            <button
              onClick={() => void startCall(participant.id, conversationId)}
              disabled={callPhase !== 'idle' || !socketConnected}
              aria-label={`Appeler ${participantName}`}
              title={
                socketConnected
                  ? `Appeler ${participantName}`
                  : 'Connexion perdue : appel indisponible'
              }
              className="w-9 h-9 rounded-full bg-success/15 text-success flex items-center justify-center hover:bg-success/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Phone className="w-4 h-4" />
            </button>
          )}

        <div
          className={`flex items-center gap-1.5 text-xs font-medium ${
            socketConnected ? 'text-success' : 'text-critical'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              socketConnected ? 'bg-success animate-pulse' : 'bg-critical'
            }`}
          />
          {socketConnected ? 'Connecté' : 'Déconnecté'}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <MessageCircle className="w-10 h-10 text-text-weak" />
            <p className="text-text-secondary text-center">
              Aucun message. Écrivez le premier à {participantName}.
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.userId === currentUser?.id;
            const previous = index > 0 ? messages[index - 1] : null;
            const isConsecutive = previous?.userId === message.userId;

            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex gap-3 max-w-md ${
                    isOwn ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {!isConsecutive ? (
                    <div className="w-8 h-8 rounded-full bg-primary text-white text-xs flex items-center justify-center shrink-0 font-semibold">
                      {message.user?.firstName?.[0] ?? '?'}
                      {message.user?.lastName?.[0] ?? ''}
                    </div>
                  ) : (
                    <div className="w-8 h-8 shrink-0" />
                  )}

                  <div className="flex flex-col gap-1">
                    {!isConsecutive && (
                      <span className="text-xs text-text-weak">
                        {new Date(message.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isOwn
                          ? 'bg-primary text-white rounded-br-sm'
                          : 'bg-bg-surface-hover text-text-primary rounded-bl-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-end gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Écrire à ${participantName}...`}
            rows={1}
            aria-label="Votre message"
            className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-bg-surface text-text-primary placeholder-text-weak resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 max-h-32"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || sendMutation.isPending}
            aria-label="Envoyer le message"
            className="p-2.5 rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
