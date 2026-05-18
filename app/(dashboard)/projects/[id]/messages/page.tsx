'use client';

import { useRef, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useProjectMessages, useSendProjectMessage, useDeleteMessage } from '@/lib/hooks/useMessages';
import { useAuthStore } from '@/lib/stores/auth.store';
import { getApiError } from '@/lib/utils/api-error';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function ProjectMessagesPage() {
  const params = useParams();
  const projectId = params.id as string;
  const currentUser = useAuthStore((state) => state.user);

  const { data: messages, isLoading, error } = useProjectMessages(projectId);
  const sendMutation = useSendProjectMessage();
  const deleteMutation = useDeleteMessage();

  const [inputValue, setInputValue] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    console.log('📨 Project messages loaded for:', projectId, 'with', messages?.length || 0, 'messages');
  }, [projectId, messages?.length]);

  if (isLoading) {
    return <Spinner centered size="lg" label="Chargement des messages..." />;
  }

  if (error) {
    return (
      <Alert
        type="error"
        title="Erreur"
        message="Impossible de charger les messages"
      />
    );
  }

  const handleSend = () => {
    const content = inputValue.trim();
    if (!content) return;

    console.log('📨 Sending message to project:', projectId, 'content:', content);
    setApiError(null);
    setSuccessMessage(null);

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
          setSuccessMessage('Message envoyé');
          setTimeout(() => setSuccessMessage(null), 2000);
        },
        onError: (error) => {
          console.error(' Send message error:', getApiError(error));
          setApiError(getApiError(error));
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
        setSuccessMessage('Message supprimé');
        setTimeout(() => setSuccessMessage(null), 2000);
      },
      onError: (error) => {
        console.error(' Delete message error:', getApiError(error));
        setApiError(getApiError(error));
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

      {/* Alerts */}
      {successMessage && (
        <div className="mx-6 mt-4 p-3 bg-success/10 border border-success rounded-lg">
          <p className="text-sm text-success">{successMessage}</p>
        </div>
      )}

      {apiError && (
        <div className="mx-6 mt-4 p-3 bg-critical/10 border border-critical rounded-lg">
          <p className="text-sm text-critical">{apiError}</p>
        </div>
      )}

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
