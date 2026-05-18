'use client';

import { useState } from 'react';
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
  CANCELLED: 'Annulé',
};

export default function ProjectsPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const role = useAuthStore((state) => state.role);
  const canCreateProject = role === 'ADMIN' || role === 'PROJECT_MANAGER';

  const { data: projects, isLoading, error } = useProjects();

  const filteredProjects = statusFilter
    ? projects?.filter((p) => p.status === statusFilter)
    : projects;

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

      {/* Filter tabs */}
      {!isLoading && projects && projects.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6">
          <button
            onClick={() => {
              console.log('🔍 Filter: All projects');
              setStatusFilter(null);
            }}
            className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
              statusFilter === null
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Tous ({projects?.length || 0})
          </button>
          {Object.entries(statusLabels).map(([status, label]) => {
            const count = projects?.filter((p) => p.status === status).length || 0;
            return (
              <button
                key={status}
                onClick={() => {
                  console.log('🔍 Filter: status =', status);
                  setStatusFilter(status);
                }}
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
