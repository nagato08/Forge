'use client';

import { useState } from 'react';
import { Archive } from 'lucide-react';
import { useProjects } from '@/lib/hooks/useProjects';
import { useAuthStore } from '@/lib/stores/auth.store';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectModal from '@/components/projects/ProjectModal';
import JoinProjectModal from '@/components/projects/JoinProjectModal';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';

const statusLabels: Record<string, string> = {
  PLANNING: 'Planification',
  ACTIVE: 'Actif',
  ON_HOLD: 'Suspendu',
  COMPLETED: 'Terminé',
};

export default function ProjectsPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [includeArchived, setIncludeArchived] = useState(false);

  const role = useAuthStore((state) => state.role);
  const canCreateProject = role === 'ADMIN' || role === 'PROJECT_MANAGER';

  const { data: projects, isLoading, error } = useProjects();

  const visibleProjects = (projects ?? []).filter((p) => {
    if (statusFilter === 'ARCHIVED') return p.status === 'ARCHIVED';
    if (!includeArchived && p.status === 'ARCHIVED') return false;
    return true;
  });

  const filteredProjects = statusFilter && statusFilter !== 'ARCHIVED'
    ? visibleProjects.filter((p) => p.status === statusFilter)
    : visibleProjects;

  const archivedCount = projects?.filter((p) => p.status === 'ARCHIVED').length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            Projets
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Gérez vos projets et collaborez avec votre équipe
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <Button
            variant="secondary"
            onClick={() => {
              console.log('🔗 Opening join project modal');
              setJoinModalOpen(true);
            }}
          >
            Rejoindre
          </Button>
          {canCreateProject && (
            <Button
              onClick={() => {
                console.log('➕ Opening create project modal');
                setCreateModalOpen(true);
              }}
            >
              Nouveau projet
            </Button>
          )}
        </div>
      </div>

      {/* Modals */}
      <ProjectModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
      <JoinProjectModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
      />

      {/* Error state */}
      {error && (
        <Alert
          type="error"
          title="Erreur"
          message="Impossible de charger les projets"
        />
      )}

      {/* Filter tabs + toggle archivés */}
      {!isLoading && projects && projects.length > 0 && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6">
            <button
              onClick={() => setStatusFilter(null)}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                statusFilter === null
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Tous ({visibleProjects.length})
            </button>
            {Object.entries(statusLabels).map(([status, label]) => {
              const count = visibleProjects.filter((p) => p.status === status).length;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
            {archivedCount > 0 && (
              <button
                onClick={() => {
                  setStatusFilter('ARCHIVED');
                  setIncludeArchived(true);
                }}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors flex items-center gap-1.5 ${
                  statusFilter === 'ARCHIVED'
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Archive className="w-4 h-4" />
                Archivés ({archivedCount})
              </button>
            )}
          </div>

          {statusFilter !== 'ARCHIVED' && archivedCount > 0 && (
            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="rounded"
              />
              Inclure les projets archivés ({archivedCount})
            </label>
          )}
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <Spinner centered size="lg" label="Chargement des projets..." />
      ) : !filteredProjects || filteredProjects.length === 0 ? (
        /* Empty state */
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📁</div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Aucun projet
          </h2>
          <p className="text-[var(--text-secondary)] mb-6">
            {statusFilter
              ? `Aucun projet ${statusLabels[statusFilter]?.toLowerCase()} pour le moment`
              : 'Créez un nouveau projet pour commencer'}
          </p>
          <div className="flex gap-3 justify-center">
            {statusFilter && (
              <Button
                variant="secondary"
                onClick={() => {
                  console.log('🔍 Clearing filter');
                  setStatusFilter(null);
                }}
              >
                Voir tous les projets
              </Button>
            )}
            {canCreateProject ? (
              <Button onClick={() => {
                console.log('➕ Opening create project modal (empty state)');
                setCreateModalOpen(true);
              }}>
                Créer un projet
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  console.log('🔗 Opening join project modal (empty state)');
                  setJoinModalOpen(true);
                }}
              >
                Rejoindre un projet
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* Projects list */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
