'use client';

import { useRef, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useProjectMessages, useSendProjectMessage, useDeleteMessage } from '@/lib/hooks/useMessages';
import { useAuthStore } from '@/lib/stores/auth.store';
import { getApiError } from '@/lib/utils/api-error';
import { getSocket } from '@/lib/socket/socket.client';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import { toast } from '@/lib/stores/toast.store';

export default function ProjectMessagesPage() {
  const params = useParams();
  const projectId = params.id as string;
  const currentUser = useAuthStore((state) => state.user);

  const { data: messages, isLoading, error } = useProjectMessages(projectId);
  const sendMutation = useSendProjectMessage();
  const deleteMutation = useDeleteMessage();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Join project room pour recevoir les messages en temps réel
  useEffect(() => {
    if (!projectId || !currentUser?.id) return;

    const joinRoom = () => {
      const socket = getSocket();
      if (!socket?.connected) return false;
      socket.emit('join-project-room', { projectId, userId: currentUser.id });
      return true;
    };

    if (joinRoom()) {
      return () => {
        const socket = getSocket();
        socket?.emit('leave-project-room', { projectId });
      };
    }

    // Socket pas connecté → poll jusqu'à connexion
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (joinRoom() || attempts >= 15) clearInterval(interval);
    }, 300);

    return () => {
      clearInterval(interval);
      const socket = getSocket();
      socket?.emit('leave-project-room', { projectId });
    };
  }, [projectId, currentUser?.id]);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return <Spinner centered size="lg" label="Chargement des messages..." />;
  }

  if (error) {
    return <div className="p-6 text-text-secondary">Impossible de charger les messages</div>;
  }

  const handleSend = () => {
    const content = inputValue.trim();
    if (!content) return;

    console.log('📨 Sending message to project:', projectId, 'content:', content);

    // Extraire les mentions (@username)
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    sendMutation.mutate(
      {
        projectId,
        data: {
          content,
          mentions: mentions.length > 0 ? mentions : undefined,
        },
      },
      {
        onSuccess: () => {
          console.log(' Message sent successfully');
          setInputValue('');
          toast.success('Message envoyé');
        },
        onError: (error) => {
          console.error(' Send message error:', getApiError(error));
          toast.error(getApiError(error), { title: 'Échec' });
        },
      }
    );
  };

  const handleDelete = (messageId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message?')) return;

    console.log(' Deleting message:', messageId);
    deleteMutation.mutate(messageId, {
      onSuccess: () => {
        console.log(' Message deleted');
        toast.success('Message supprimé');
      },
      onError: (error) => {
        console.error(' Delete message error:', getApiError(error));
        toast.error(getApiError(error), { title: 'Échec' });
      },
    });
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
        <h2 className="text-lg font-semibold text-text-primary">📨 Messages du projet</h2>
        <p className="text-xs text-text-secondary mt-1">Communication interne avec le projet (distinct du chat)</p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {!messages || messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-text-secondary">Aucun message pour le moment. Commence la conversation !</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.userId === currentUser?.id;

            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md p-4 rounded-lg border ${
                    isOwn
                      ? 'bg-primary/10 border-primary text-text-primary'
                      : 'bg-bg-surface-hover border-border text-text-primary'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      {!isOwn && (
                        <p className="text-xs font-semibold text-text-primary mb-1">
                          {message.user.firstName} {message.user.lastName}
                        </p>
                      )}
                      <p className="text-sm break-words">{message.content}</p>
                      {message.mentions && message.mentions.length > 0 && (
                        <p className="text-xs text-text-secondary mt-1">
                           @{message.mentions.join(', @')}
                        </p>
                      )}
                    </div>
                    {isOwn && (
                      <button
                        onClick={() => handleDelete(message.id)}
                        disabled={deleteMutation.isPending}
                        className="text-xs text-critical hover:text-critical/80 transition-colors"
                        title="Supprimer ce message"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary mt-2">
                    {new Date(message.createdAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border p-4 space-y-2">
        <div className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrire un message... (Entrée pour envoyer, Shift+Entrée pour nouvelle ligne). Mentions: @username"
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
        <p className="text-xs text-text-secondary">
          💡 Utilisez @username pour mentionner quelqu'un. Les utilisateurs mentionnés recevront une notification.
        </p>
      </div>
    </div>
  );
}
