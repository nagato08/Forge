'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useMessages, useSendMessage, useSendFileMessage } from '@/lib/hooks/useChat';
import { ChatAttachment } from '@/lib/api/chat.api';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useProjectById, useProjectRole } from '@/lib/hooks/useProjects';
import { useSocketConnected, useSocketEvent } from '@/lib/hooks/useSocket';
import { usePresence } from '@/lib/hooks/usePresence';
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

  if (isImageType(attachment.mimeType) && attachment.url) {
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

  if (isVideoType(attachment.mimeType) && attachment.url) {
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
      <FileIcon type={attachment.mimeType} className={`w-6 h-6 ${isOwn ? 'text-white/80' : 'text-text-secondary'}`} />
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

/**
 * Surligne les `@Prénom Nom` présents dans le texte.
 *
 * On reconstruit le rendu à partir des noms des membres mentionnés plutôt que
 * d'analyser le texte à l'aveugle : seul un nom réellement mentionné est mis
 * en valeur, écrire « @quelqu'un » au hasard ne produit aucun surlignage.
 */
function MessageContent({
  content,
  attachments,
  mentionNames,
  isOwn,
}: {
  content: string;
  attachments: ChatAttachment[];
  mentionNames: string[];
  isOwn: boolean;
}) {
  const renderText = () => {
    if (!content) return null;
    if (mentionNames.length === 0) {
      return <p className="whitespace-pre-wrap break-words">{content}</p>;
    }

    // Les noms les plus longs d'abord : « @Jean Dupont » doit primer sur « @Jean ».
    const sorted = [...mentionNames].sort((a, b) => b.length - a.length);
    const escaped = sorted.map((name) =>
      name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    const parts = content.split(new RegExp(`(@(?:${escaped.join('|')}))`, 'g'));

    return (
      <p className="whitespace-pre-wrap break-words">
        {parts.map((part, i) =>
          part.startsWith('@') && sorted.includes(part.slice(1)) ? (
            <span
              key={i}
              className={`font-medium rounded px-1 ${
                isOwn ? 'bg-white/25' : 'bg-primary/15 text-primary'
              }`}
            >
              {part}
            </span>
          ) : (
            part
          )
        )}
      </p>
    );
  };

  return (
    <div className="space-y-2">
      {renderText()}
      {attachments.map((att) => (
        <AttachmentCard key={att.id} attachment={att} isOwn={isOwn} />
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

  const currentUser = useAuthStore((state) => state.user);
  const { data: messages, isLoading, error } = useMessages(projectId);
  // Poster exige MEMBER minimum, comme côté serveur.
  const { canContribute: canContributeToProject } = useProjectRole(projectId);
  const { data: project } = useProjectById(projectId);

  // Membres du projet : cibles possibles d'une mention, et table de
  // correspondance identifiant → nom pour le rendu des messages reçus.
  const members = useMemo(
    () =>
      (project?.members ?? []).map((m) => ({
        id: m.userId,
        name: `${m.user.firstName} ${m.user.lastName}`,
      })),
    [project?.members]
  );

  const memberNameById = useMemo(
    () => new Map(members.map((m) => [m.id, m.name])),
    [members]
  );

  // Présence : on n'affiche que les membres de CE projet, pas tous les
  // connectés de l'application.
  const { isOnline } = usePresence();
  const onlineMembers = useMemo(
    () => members.filter((m) => m.id !== currentUser?.id && isOnline(m.id)),
    [members, isOnline, currentUser?.id]
  );
  const sendMutation = useSendMessage();
  const sendFileMutation = useSendFileMessage();

  const [inputValue, setInputValue] = useState('');
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  /** Texte saisi après un « @ », ou null si l'autocomplétion est fermée. */
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Membres proposés : on exclut l'auteur, personne ne se mentionne soi-même.
  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    const query = mentionQuery.toLowerCase();
    return members
      .filter((m) => m.id !== currentUser?.id)
      .filter((m) => m.name.toLowerCase().includes(query))
      .slice(0, 5);
  }, [mentionQuery, members, currentUser?.id]);

  // Le socket naissant apres le premier rendu, le hook attend son apparition.
  const socketConnected = useSocketConnected();

  // Rejoindre la room du projet + re-join à chaque reconnexion socket
  useEffect(() => {
    if (!currentUser?.id) return;

    const joinRoom = () => {
      emitSocketEvent('join-project-room', { projectId, userId: currentUser.id });
    };

    const socket = getSocket();

    if (socket) {
      if (socket.connected) {
        joinRoom();
      }
      // Re-join sur chaque connect (y compris reconnexion)
      socket.on('connect', joinRoom);
    } else {
      // Socket pas encore créé — poll jusqu'à disponible
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        const s = getSocket();
        if (s) {
          clearInterval(interval);
          if (s.connected) joinRoom();
          s.on('connect', joinRoom);
        }
        if (attempts >= 20) clearInterval(interval);
      }, 300);
      return () => clearInterval(interval);
    }

    return () => {
      const s = getSocket();
      if (s) {
        s.off('connect', joinRoom);
        if (s.connected) emitSocketEvent('leave-project-room', { projectId });
      }
    };
  }, [projectId, currentUser?.id]);

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

    // Les mentions sont déduites du texte au moment de l'envoi : l'utilisateur
    // peut avoir effacé un « @Nom » après l'avoir inséré.
    const mentions = extractMentionIds(content);

    for (const file of pendingFiles) {
      try {
        await sendFileMutation.mutateAsync({
          projectId,
          file,
          textContent: pendingFiles.length === 1 ? content : undefined,
          mentions: pendingFiles.length === 1 ? mentions : undefined,
        });
      } catch (err) {
        toast.error(getApiError(err), { title: 'Échec' });
        return;
      }
    }

    if (content && (pendingFiles.length === 0 || pendingFiles.length > 1)) {
      sendMutation.mutate(
        { projectId, content, mentions },
        {
          onError: (err) => toast.error(getApiError(err), { title: 'Échec' }),
        }
      );
    }

    setInputValue('');
    setPendingFiles([]);
    setMentionQuery(null);
  };

  /** Identifiants des membres dont le nom apparaît précédé de « @ ». */
  const extractMentionIds = (text: string): string[] =>
    members.filter((m) => text.includes(`@${m.name}`)).map((m) => m.id);

  /** Remplace le « @… » en cours de frappe par le nom complet du membre. */
  const applyMention = (member: { id: string; name: string }) => {
    const cursor = inputValue.lastIndexOf('@');
    if (cursor === -1) return;

    const next = `${inputValue.slice(0, cursor)}@${member.name} `;
    setInputValue(next);
    setMentionQuery(null);
    textareaRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Autocomplétion : on ouvre la liste dès qu'un « @ » est suivi d'un texte
    // sans saut de ligne. Le `@` doit débuter un mot pour ne pas se déclencher
    // au milieu d'une adresse email.
    const match = /(?:^|\s)@([^\s@]*)$/.exec(value);
    setMentionQuery(match ? match[1] : null);

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
    // Liste de mentions ouverte : Entrée valide la première proposition au
    // lieu d'envoyer le message, Échap referme sans rien insérer.
    if (mentionSuggestions.length > 0) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        applyMention(mentionSuggestions[0]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

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
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-text-primary">
            Chat du projet
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Membres connectés : pastille verte, nom au survol */}
          {onlineMembers.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-xs text-text-secondary">
                {onlineMembers.length} en ligne
              </span>
              <div className="flex -space-x-1.5">
                {onlineMembers.slice(0, 4).map((member) => (
                  <span
                    key={member.id}
                    title={member.name}
                    className="relative w-6 h-6 rounded-full bg-primary/15 border-2 border-bg-surface flex items-center justify-center text-[10px] font-bold text-primary"
                  >
                    {member.name[0]}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-success border border-bg-surface" />
                  </span>
                ))}
                {onlineMembers.length > 4 && (
                  <span className="w-6 h-6 rounded-full bg-bg-surface-hover border-2 border-bg-surface flex items-center justify-center text-[10px] text-text-secondary">
                    +{onlineMembers.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className={`flex items-center gap-1.5 text-xs font-medium ${socketConnected ? 'text-success' : 'text-critical'}`}>
            <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-success animate-pulse' : 'bg-critical'}`} />
            {socketConnected ? 'Connecté' : 'Déconnecté'}
          </div>
        </div>
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
                      <MessageContent
                        content={message.content}
                        attachments={message.attachments ?? []}
                        mentionNames={(message.mentions ?? [])
                          .map((id) => memberNameById.get(id))
                          .filter((name): name is string => Boolean(name))}
                        isOwn={isOwn}
                      />
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

      {/* Input area — masquée en lecture seule, le serveur refuse de toute façon */}
      {!canContributeToProject ? (
        <div className="border-t border-border p-4">
          <p className="text-sm text-text-secondary text-center">
            Votre rôle sur ce projet ne permet pas d&apos;écrire dans la discussion.
          </p>
        </div>
      ) : (
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

          <div className="flex-1 relative">
            {/* Suggestions de mention, au-dessus du champ */}
            {mentionSuggestions.length > 0 && (
              <ul className="absolute bottom-full mb-1 left-0 right-0 z-10 bg-bg-surface border border-border rounded-lg shadow-lg overflow-hidden">
                {mentionSuggestions.map((member) => (
                  <li key={member.id}>
                    <button
                      type="button"
                      onClick={() => applyMention(member)}
                      className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-surface-hover transition-colors"
                    >
                      {member.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ecrire un message... (@ pour mentionner, Entree pour envoyer)"
              className="w-full px-4 py-2 border border-border rounded-lg bg-bg-surface text-text-primary placeholder-text-weak text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={2}
            />
          </div>

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
      )}
    </div>
  );
}
