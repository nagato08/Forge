'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useMessages, useSendMessage, useSendFileMessage } from '@/lib/hooks/useChat';
import { parseAttachments, ChatAttachment } from '@/lib/api/chat.api';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useSocketEvent } from '@/lib/hooks/useSocket';
import { getSocket, emitSocketEvent } from '@/lib/socket/socket.client';
import { getApiError } from '@/lib/utils/api-error';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import { toast } from '@/lib/stores/toast.store';
import {
  MessageCircle,
  Paperclip,
  Send,
  Image,
  Video,
  FileText,
  File,
  Archive,
  Download,
} from 'lucide-react';

// --- Helpers ---

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function isImageType(type: string): boolean {
  return type.startsWith('image/');
}

function isVideoType(type: string): boolean {
  return type.startsWith('video/');
}

function FileIcon({ type, className }: { type: string; className?: string }) {
  if (isImageType(type)) return <Image className={className} />;
  if (isVideoType(type)) return <Video className={className} />;
  if (type.includes('pdf')) return <FileText className={className} />;
  if (type.includes('word') || type.includes('document')) return <FileText className={className} />;
  if (type.includes('sheet') || type.includes('excel')) return <FileText className={className} />;
  if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return <Archive className={className} />;
  return <File className={className} />;
}

// --- Attachment renderer ---

function AttachmentCard({ attachment, isOwn }: { attachment: ChatAttachment; isOwn: boolean }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const fullUrl = attachment.url.startsWith('http') ? attachment.url : `${apiUrl}${attachment.url}`;

  if (isImageType(attachment.type) && attachment.url) {
    return (
      <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="block">
        <div className="rounded-lg overflow-hidden max-w-[280px] border border-border">
          <img
            src={fullUrl}
            alt={attachment.name}
            className="w-full h-auto max-h-[200px] object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="px-3 py-1.5 text-xs text-text-secondary flex items-center justify-between bg-bg-surface-hover">
            <span className="truncate">{attachment.name}</span>
            <span>{formatFileSize(attachment.size)}</span>
          </div>
        </div>
      </a>
    );
  }

  if (isVideoType(attachment.type) && attachment.url) {
    return (
      <div className="rounded-lg overflow-hidden max-w-[320px] border border-border">
        <video
          src={fullUrl}
          controls
          className="w-full max-h-[220px]"
          preload="metadata"
        />
        <div className="px-3 py-1.5 text-xs text-text-secondary flex items-center justify-between bg-bg-surface-hover">
          <span className="truncate flex items-center gap-1">
            <Video className="w-3 h-3" />
            {attachment.name}
          </span>
          <span>{formatFileSize(attachment.size)}</span>
        </div>
      </div>
    );
  }

  // Generic file
  return (
    <a
      href={fullUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors max-w-[280px] ${
        isOwn
          ? 'border-white/20 bg-white/10 hover:bg-white/20'
          : 'border-border bg-bg-surface hover:bg-bg-surface-hover'
      }`}
    >
      <FileIcon type={attachment.type} className={`w-6 h-6 ${isOwn ? 'text-white/80' : 'text-text-secondary'}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isOwn ? 'text-white' : 'text-text-primary'}`}>
          {attachment.name}
        </p>
        <p className={`text-xs ${isOwn ? 'text-white/70' : 'text-text-secondary'}`}>
          {formatFileSize(attachment.size)}
        </p>
      </div>
      <Download className={`w-4 h-4 ${isOwn ? 'text-white/70' : 'text-text-secondary'}`} />
    </a>
  );
}

// --- File preview (before sending) ---

function FilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isImageType(file.type)) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  return (
    <div className="relative inline-flex items-center gap-2 p-2 rounded-lg bg-bg-surface-hover border border-border">
      {preview ? (
        <img src={preview} alt={file.name} className="w-12 h-12 rounded object-cover" />
      ) : (
        <FileIcon type={file.type} className="w-6 h-6 text-text-secondary" />
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-text-primary truncate max-w-[150px]">{file.name}</p>
        <p className="text-xs text-text-secondary">{formatFileSize(file.size)}</p>
      </div>
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-critical text-white text-xs flex items-center justify-center hover:bg-critical/80"
      >
        x
      </button>
    </div>
  );
}

// --- Message bubble content ---

function MessageContent({ content, isOwn }: { content: string; isOwn: boolean }) {
  const { text, attachments } = parseAttachments(content);

  return (
    <div className="space-y-2">
      {text && <p className="whitespace-pre-wrap break-words">{text}</p>}
      {attachments.map((att, i) => (
        <AttachmentCard key={i} attachment={att} isOwn={isOwn} />
      ))}
    </div>
  );
}

// --- Main page ---

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 Mo
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'video/mp4', 'video/webm', 'video/quicktime',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip', 'application/x-rar-compressed',
  'text/plain', 'text/csv',
];

export default function ChatPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: messages, isLoading, error } = useMessages(projectId);
  const sendMutation = useSendMessage();
  const sendFileMutation = useSendFileMessage();
  const currentUser = useAuthStore((state) => state.user);

  const [inputValue, setInputValue] = useState('');
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rejoindre la room du projet
  useEffect(() => {
    const socket = getSocket();
    if (socket?.connected) {
      emitSocketEvent('join-project-room', { projectId });
    }
    return () => {
      emitSocketEvent('leave-project-room', { projectId });
    };
  }, [projectId]);

  const handleUserTyping = useCallback((data: any) => {
    if (data.projectId === projectId && data.userId !== currentUser?.id) {
      setTypingUsers((prev) => new Map(prev).set(data.userId, data.userName));
    }
  }, [projectId, currentUser?.id]);

  const handleUserStoppedTyping = useCallback((data: any) => {
    if (data.projectId === projectId) {
      setTypingUsers((prev) => {
        const updated = new Map(prev);
        updated.delete(data.userId);
        return updated;
      });
    }
  }, [projectId]);

  useSocketEvent('user:typing', handleUserTyping);
  useSocketEvent('user:stopped-typing', handleUserStoppedTyping);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isLoading && !error && messages) {
      console.log('Chat loaded:', messages.length, 'messages');
    }
  }, [projectId, messages, isLoading, error]);

  if (isLoading) {
    return <Spinner centered size="lg" label="Chargement du chat..." />;
  }

  if (error) {
    return (
      <div className="p-6 text-text-secondary">Impossible de charger le chat</div>
    );
  }

  const isSending = sendMutation.isPending || sendFileMutation.isPending;

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content && pendingFiles.length === 0) return;

    emitSocketEvent('user:stopped-typing', { projectId });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    for (const file of pendingFiles) {
      try {
        await sendFileMutation.mutateAsync({
          projectId,
          file,
          textContent: pendingFiles.length === 1 ? content : undefined,
        });
      } catch (err) {
        toast.error(getApiError(err), { title: 'Échec' });
        return;
      }
    }

    if (content && (pendingFiles.length === 0 || pendingFiles.length > 1)) {
      sendMutation.mutate(
        { projectId, content },
        {
          onError: (err) => toast.error(getApiError(err), { title: 'Échec' }),
        }
      );
    }

    setInputValue('');
    setPendingFiles([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.trim()) {
      if (!typingTimeoutRef.current) {
        emitSocketEvent('user:typing', {
          projectId,
          userId: currentUser?.id,
          userName: `${currentUser?.firstName} ${currentUser?.lastName}`,
        });
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name} depasse 25 Mo`);
      } else if (ALLOWED_TYPES.length > 0 && !ALLOWED_TYPES.includes(file.type) && file.type !== '') {
        errors.push(`${file.name} : type non supporte`);
      } else {
        valid.push(file);
      }
    }

    if (errors.length > 0) {
      toast.error(errors.join(', '));
    }
    if (valid.length > 0) {
      setPendingFiles((prev) => [...prev, ...valid]);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-bg-surface rounded-lg border border-border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-text-primary">
          Chat du projet
        </h2>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {!messages || !Array.isArray(messages) || messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <MessageCircle className="w-10 h-10 text-text-weak" />
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
            const isOptimistic = message.id.startsWith('optimistic-');

            const firstName = message.user?.firstName ?? 'Utilisateur';
            const lastName = message.user?.lastName ?? '';

            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
                  isOptimistic ? 'opacity-70' : ''
                }`}
              >
                <div
                  className={`flex gap-3 max-w-md ${
                    isOwn ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  {!isConsecutive ? (
                    <div
                      className="w-8 h-8 rounded-full bg-primary text-white text-xs flex items-center justify-center shrink-0 font-semibold"
                      title={`${firstName} ${lastName}`}
                    >
                      {firstName[0]}
                      {lastName?.[0] || ''}
                    </div>
                  ) : (
                    <div className="w-8 h-8 shrink-0" />
                  )}

                  {/* Message bubble */}
                  <div className="flex flex-col gap-1">
                    {!isConsecutive && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-text-primary">
                          {firstName} {lastName}
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
                      className={`px-4 py-2 rounded-lg text-sm ${
                        isOwn
                          ? 'bg-primary text-white'
                          : 'bg-bg-surface-hover text-text-primary'
                      }`}
                    >
                      <MessageContent content={message.content} isOwn={isOwn} />
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
        <div className="px-6 py-2 border-t border-border text-xs text-text-secondary italic">
          {Array.from(typingUsers.values()).join(', ')} est en train d&apos;ecrire...
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border p-4 space-y-2">
        {/* Pending files preview */}
        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2">
            {pendingFiles.map((file, i) => (
              <FilePreview key={i} file={file} onRemove={() => removePendingFile(i)} />
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end">
          {/* File upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            className="p-2.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-colors disabled:opacity-50"
            title="Joindre un fichier"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            multiple
            accept={ALLOWED_TYPES.join(',')}
            className="hidden"
          />

          <textarea
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ecrire un message... (Entree pour envoyer)"
            className="flex-1 px-4 py-2 border border-border rounded-lg bg-bg-surface text-text-primary placeholder-text-weak text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            rows={2}
          />

          <Button
            variant="primary"
            onClick={handleSend}
            isLoading={isSending}
            className="self-end flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Envoyer
          </Button>
        </div>

        <p className="text-xs text-text-weak">
          Images, videos, PDF, documents — max 25 Mo
        </p>
      </div>
    </div>
  );
}
