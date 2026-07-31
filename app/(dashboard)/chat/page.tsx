'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProjects } from '@/lib/hooks/useProjects';
import {
  useDirectConversations,
  useChatDirectory,
  useOpenDirectConversation,
} from '@/lib/hooks/useDirectChat';
import ProjectChat from '@/components/chat/ProjectChat';
import DirectChat from '@/components/chat/DirectChat';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { ChatPerson } from '@/lib/api/chat.api';
import { getApiError } from '@/lib/utils/api-error';
import { toast } from '@/lib/stores/toast.store';
import { usePresence } from '@/lib/hooks/usePresence';
import {
  MessagesSquare,
  FolderOpen,
  Plus,
  Search,
  MessageCircle,
} from 'lucide-react';

/** Conversation ouverte : un canal de projet, ou un fil direct. */
type Selection =
  | { kind: 'project'; id: string }
  | { kind: 'direct'; id: string }
  | null;

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: conversations, isLoading: conversationsLoading } =
    useDirectConversations();
  const openMutation = useOpenDirectConversation();
  const { isOnline } = usePresence();

  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [directorySearch, setDirectorySearch] = useState('');
  const { data: directory } = useChatDirectory(directoryOpen);

  // L'URL fait autorité : elle rend la conversation ouverte partageable et
  // permet aux anciens liens `projects/:id/chat` d'arriver au bon endroit.
  const projectParam = searchParams.get('project');
  const conversationParam = searchParams.get('conversation');

  const [fallback, setFallback] = useState<Selection>(null);
  // Mémorisé : recréé à chaque rendu, l'objet ferait retomber les `useMemo`
  // qui en dépendent à chaque frappe dans la recherche de l'annuaire.
  const selection = useMemo<Selection>(
    () =>
      projectParam
        ? { kind: 'project', id: projectParam }
        : conversationParam
          ? { kind: 'direct', id: conversationParam }
          : fallback,
    [projectParam, conversationParam, fallback]
  );

  const select = (next: Selection) => {
    setFallback(next);
    if (!next) return router.replace('/chat');
    router.replace(
      next.kind === 'project'
        ? `/chat?project=${next.id}`
        : `/chat?conversation=${next.id}`
    );
  };

  const selectedConversation = useMemo(
    () =>
      selection?.kind === 'direct'
        ? (conversations ?? []).find((c) => c.id === selection.id) ?? null
        : null,
    [selection, conversations]
  );

  const filteredDirectory = useMemo(() => {
    const query = directorySearch.trim().toLowerCase();
    if (!query) return directory ?? [];
    return (directory ?? []).filter((person) =>
      `${person.firstName} ${person.lastName}`.toLowerCase().includes(query)
    );
  }, [directory, directorySearch]);

  const startConversation = (person: ChatPerson) => {
    openMutation.mutate(person.id, {
      onSuccess: (conversation) => {
        setDirectoryOpen(false);
        setDirectorySearch('');
        select({ kind: 'direct', id: conversation.id });
      },
      onError: (err) =>
        toast.error(getApiError(err), { title: 'Impossible d’ouvrir' }),
    });
  };

  const isLoading = projectsLoading || conversationsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessagesSquare className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Messages</h1>
          <p className="text-text-secondary text-sm">
            Les canaux de vos projets et vos conversations directes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 h-[calc(100vh-230px)]">
        {/* Colonne de gauche : choix de la conversation */}
        <Card className="p-0 overflow-y-auto">
          {isLoading ? (
            <div className="p-6">
              <Spinner size="sm" label="Chargement..." />
            </div>
          ) : (
            <div className="divide-y divide-border">
              <section>
                <h2 className="px-4 pt-4 pb-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Projets
                </h2>
                {(projects ?? []).length === 0 ? (
                  <p className="px-4 pb-4 text-sm text-text-weak">Aucun projet</p>
                ) : (
                  <div className="pb-2">
                    {(projects ?? []).map((project) => {
                      const active =
                        selection?.kind === 'project' && selection.id === project.id;
                      return (
                        <button
                          key={project.id}
                          onClick={() => select({ kind: 'project', id: project.id })}
                          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors ${
                            active
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover'
                          }`}
                        >
                          <FolderOpen className="w-4 h-4 shrink-0" />
                          <span className="truncate text-sm">{project.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              <section>
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Messages directs
                  </h2>
                  <button
                    onClick={() => setDirectoryOpen(true)}
                    aria-label="Nouvelle conversation"
                    title="Nouvelle conversation"
                    className="p-1 rounded text-text-secondary hover:text-primary hover:bg-bg-surface-hover transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {(conversations ?? []).length === 0 ? (
                  <p className="px-4 pb-4 text-sm text-text-weak">
                    Aucune conversation
                  </p>
                ) : (
                  <div className="pb-2">
                    {(conversations ?? []).map((conversation) => {
                      const active =
                        selection?.kind === 'direct' &&
                        selection.id === conversation.id;
                      const person = conversation.participant;
                      const name = person
                        ? `${person.firstName} ${person.lastName}`
                        : 'Compte supprimé';
                      return (
                        <button
                          key={conversation.id}
                          onClick={() =>
                            select({ kind: 'direct', id: conversation.id })
                          }
                          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors ${
                            active
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover'
                          }`}
                        >
                          <span className="relative shrink-0">
                            <span className="w-7 h-7 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center">
                              {person?.firstName?.[0] ?? '?'}
                              {person?.lastName?.[0] ?? ''}
                            </span>
                            {person && isOnline(person.id) && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-success border border-bg-surface" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm">{name}</span>
                            {conversation.lastMessage && (
                              <span className="block truncate text-xs text-text-weak">
                                {conversation.lastMessage.content}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}
        </Card>

        {/* Colonne de droite : la conversation ouverte */}
        <div className="min-h-0">
          {selection?.kind === 'project' ? (
            <ProjectChat key={selection.id} projectId={selection.id} />
          ) : selection?.kind === 'direct' ? (
            <DirectChat
              key={selection.id}
              conversationId={selection.id}
              participant={selectedConversation?.participant ?? null}
            />
          ) : (
            <Card className="h-full flex flex-col items-center justify-center gap-3 text-center">
              <MessageCircle className="w-10 h-10 text-text-weak" />
              <p className="text-text-secondary">
                Choisissez un projet ou une conversation à gauche
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDirectoryOpen(true)}
              >
                Démarrer une conversation
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Annuaire : sélection du correspondant */}
      <Modal
        isOpen={directoryOpen}
        onClose={() => setDirectoryOpen(false)}
        title="Nouvelle conversation"
      >
        <div className="space-y-3">
          <Input
            placeholder="Rechercher une personne..."
            value={directorySearch}
            onChange={(e) => setDirectorySearch(e.target.value)}
            autoFocus
          />
          <div className="max-h-72 overflow-y-auto divide-y divide-border">
            {filteredDirectory.length === 0 ? (
              <p className="py-6 text-sm text-text-weak text-center flex flex-col items-center gap-2">
                <Search className="w-5 h-5" />
                Personne ne correspond à cette recherche
              </p>
            ) : (
              filteredDirectory.map((person) => (
                <button
                  key={person.id}
                  onClick={() => startConversation(person)}
                  disabled={openMutation.isPending}
                  className="w-full flex items-center gap-3 py-2.5 px-1 text-left hover:bg-bg-surface-hover transition-colors disabled:opacity-50"
                >
                  <span className="w-8 h-8 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {person.firstName[0]}
                    {person.lastName[0]}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-text-primary truncate">
                      {person.firstName} {person.lastName}
                    </span>
                    {person.jobTitle && (
                      <span className="block text-xs text-text-secondary truncate">
                        {person.jobTitle}
                      </span>
                    )}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

/**
 * Messagerie : canaux de projet et conversations directes réunis.
 *
 * `useSearchParams` impose une frontière de suspense côté App Router.
 */
export default function ChatPage() {
  return (
    <Suspense fallback={<Spinner centered size="lg" label="Chargement..." />}>
      <ChatPageContent />
    </Suspense>
  );
}
