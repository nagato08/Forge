'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useMessages, useSendMessage } from '@/lib/hooks/useChat';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useSocketEvent } from '@/lib/hooks/useSocket';
import { getSocket, emitSocketEvent } from '@/lib/socket/socket.client';
import { getApiError } from '@/lib/utils/api-error';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function ChatPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: messages, isLoading, error } = useMessages(projectId);
  const sendMutation = useSendMessage();
  const currentUser = useAuthStore((state) => state.user);

  const [inputValue, setInputValue] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Rejoindre la room du projet
  useEffect(() => {
    const socket = getSocket();
    if (socket?.connected) {
      console.log('🚪 Joining chat room:', projectId);
      emitSocketEvent('join-project-room', { projectId });
    }

    return () => {
      // Optionnel: quitter la room au démontage
      console.log('🚪 Leaving chat room:', projectId);
      emitSocketEvent('leave-project-room', { projectId });
    };
  }, [projectId]);

  // Callbacks mémorisés pour les événements socket
  const handleUserTyping = useCallback((data: any) => {
    if (data.projectId === projectId && data.userId !== currentUser?.id) {
      console.log('✏️ User typing:', data.userName);
      setTypingUsers((prev) => new Map(prev).set(data.userId, data.userName));
    }
  }, [projectId, currentUser?.id]);

  const handleUserStoppedTyping = useCallback((data: any) => {
    if (data.projectId === projectId) {
      console.log('⏹️ User stopped typing:', data.userId);
      setTypingUsers((prev) => {
        const updated = new Map(prev);
        updated.delete(data.userId);
        return updated;
      });
    }
  }, [projectId]);

  // Écouter les événements socket
  useSocketEvent('user:typing', handleUserTyping);
  useSocketEvent('user:stopped-typing', handleUserStoppedTyping);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Log quand le chat est chargé
  useEffect(() => {
    if (!isLoading && !error && messages) {
      console.log('💬 Chat loaded for project:', projectId, 'with', messages.length, 'messages');
    }
  }, [projectId, messages, isLoading, error]);

  if (isLoading) {
    return <Spinner centered size="lg" label="Chargement du chat..." />;
  }

  if (error) {
    return (
      <Alert
        type="error"
        title="Erreur"
        message="Impossible de charger le chat"
      />
    );
  }

  const handleSend = () => {
    const content = inputValue.trim();
    if (!content) return;

    console.log('📡 Sending message to project:', projectId, 'content:', content);
    setApiError(null);

    // Arrêter l'indicateur de saisie
    emitSocketEvent('user:stopped-typing', { projectId });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    sendMutation.mutate(
      { projectId, content },
      {
        onSuccess: () => {
          console.log('✅ Message sent successfully');
          setInputValue('');
        },
        onError: (error) => {
          console.error('❌ Send message error:', getApiError(error));
          setApiError(getApiError(error));
        },
      }
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Émettre typing indicator
    if (value.trim()) {
      if (!typingTimeoutRef.current) {
        console.log('✏️ Emitting typing indicator');
        emitSocketEvent('user:typing', {
          projectId,
          userId: currentUser?.id,
          userName: `${currentUser?.firstName} ${currentUser?.lastName}`,
        });
      }

      // Réinitialiser le timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        console.log('⏹️ Emitting stopped typing');
        emitSocketEvent('user:stopped-typing', { projectId });
        typingTimeoutRef.current = null;
      }, 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-bg-surface rounded-lg border border-border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-lg font-semibold text-text-primary">
          💬 Chat du projet
        </h2>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {!messages || messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-text-secondary">
              Aucun message pour le moment. Commence la conversation !
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.userId === currentUser?.id;
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const isConsecutive =
              prevMessage && prevMessage.userId === message.userId;

            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex gap-3 max-w-xs ${
                    isOwn ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  {!isConsecutive ? (
                    <div
                      className="w-8 h-8 rounded-full bg-primary text-white text-xs flex items-center justify-center shrink-0 font-semibold"
                      title={`${message.user.firstName} ${message.user.lastName}`}
                    >
                      {message.user.firstName[0]}
                      {message.user.lastName[0]}
                    </div>
                  ) : (
                    <div className="w-8 h-8 shrink-0" />
                  )}

                  {/* Message bubble */}
                  <div className="flex flex-col gap-1">
                    {!isConsecutive && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-text-primary">
                          {message.user.firstName} {message.user.lastName}
                        </span>
                        <span className="text-xs text-text-weak">
                          {new Date(message.createdAt).toLocaleTimeString(
                            'fr-FR',
                            { hour: '2-digit', minute: '2-digit' }
                          )}
                        </span>
                      </div>
                    )}
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        isOwn
                          ? 'bg-primary text-white'
                          : 'bg-bg-surface-hover text-text-primary'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.size > 0 && (
        <div className="px-6 py-2 border-t border-border text-xs text-text-secondary">
          {Array.from(typingUsers.values()).join(', ')} est en train d'écrire...
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border p-4 space-y-2">
        {apiError && (
          <Alert
            type="error"
            title="Erreur"
            message={apiError}
            onClose={() => setApiError(null)}
          />
        )}
        <div className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Écrire un message... (Entrée pour envoyer, Shift+Entrée pour nouvelle ligne)"
            className="flex-1 px-4 py-2 border border-border rounded-lg bg-bg-surface text-text-primary placeholder-text-weak text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
          />
          <Button
            variant="primary"
            onClick={handleSend}
            isLoading={sendMutation.isPending}
            className="self-end"
          >
            Envoyer
          </Button>
        </div>
      </div>
    </div>
  );
}
