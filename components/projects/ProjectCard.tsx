'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Project } from '@/lib/types/project.types';
import { useUpdateProject } from '@/lib/hooks/useProjects';
import { getPriorityBadge } from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import {
  ListTodo,
  Play,
  Pause,
  CheckCircle2,
  Archive,
  ChevronDown,
} from 'lucide-react';

interface ProjectCardProps {
  project: Project;
}

const statusConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  PLANNING: { icon: ListTodo, label: 'Planification', color: 'bg-info/10 text-info' },
  ACTIVE: { icon: Play, label: 'Actif', color: 'bg-success/10 text-success' },
  ON_HOLD: { icon: Pause, label: 'Suspendu', color: 'bg-warning/10 text-warning' },
  COMPLETED: { icon: CheckCircle2, label: 'Terminé', color: 'bg-success/10 text-success' },
  ARCHIVED: { icon: Archive, label: 'Archivé', color: 'bg-border text-text-secondary' },
};

// Transitions valides selon le statut actuel
const validTransitions: Record<string, string[]> = {
  PLANNING: ['ACTIVE', 'ARCHIVED'],
  ACTIVE: ['ON_HOLD', 'COMPLETED', 'ARCHIVED'],
  ON_HOLD: ['ACTIVE', 'COMPLETED', 'ARCHIVED'],
  COMPLETED: ['ARCHIVED'],
  ARCHIVED: [],
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getDaysRemaining(endDate?: string): { text: string; urgent: boolean } | null {
  if (!endDate) return null;
  const now = new Date();
  const end = new Date(endDate);
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { text: `${Math.abs(diff)}j en retard`, urgent: true };
  if (diff === 0) return { text: "Aujourd'hui", urgent: true };
  if (diff <= 7) return { text: `${diff}j restants`, urgent: true };
  return { text: `${diff}j restants`, urgent: false };
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const updateProjectMutation = useUpdateProject();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmTransition, setConfirmTransition] = useState<string | null>(null);

  const status = statusConfig[project.status] || statusConfig['PLANNING'];
  const StatusIcon = status.icon;
  const nextStatuses = validTransitions[project.status] || [];

  // Calcul progression
  const tasksCount = project._count?.tasks ?? project.tasksCount ?? 0;
  const completedCount = project.completedTasksCount ?? 0;
  const completionPercent = tasksCount > 0 ? Math.round((completedCount / tasksCount) * 100) : 0;

  // Membres
  const membersCount = project._count?.members ?? project.members?.length ?? 0;
  const membersList = project.members ?? [];

  // Deadline
  const deadline = getDaysRemaining(project.endDate);

  // Owner
  const ownerName = project.owner
    ? `${project.owner.firstName} ${project.owner.lastName}`
    : null;

  const handleStatusChange = (newStatus: string) => {
    console.log(`🔄 Changing project status: ${project.status} → ${newStatus}`);
    updateProjectMutation.mutate(
      { projectId: project.id, data: { status: newStatus as any } },
      {
        onSuccess: () => {
          console.log(` Project status updated to ${newStatus}`);
          setConfirmTransition(null);
          setMenuOpen(false);
        },
        onError: (err) => {
          console.error(' Failed to update project status:', err);
        },
      }
    );
  };

  return (
    <>
      <Card
        clickable
        onClick={() => router.push(`/projects/${project.id}/kanban`)}
        className="space-y-3 hover:border-primary/50 transition-all duration-200 h-full"
      >
        {/* Header: Name + Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-text-primary truncate">
              {project.name}
            </h3>
            {project.description && (
              <p className="text-sm text-text-secondary line-clamp-2 mt-1">
                {project.description}
              </p>
            )}
          </div>
        </div>

        {/* Status badge with menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap transition-colors ${status.color} ${
              nextStatuses.length > 0
                ? 'cursor-pointer hover:opacity-80'
                : 'cursor-default'
            }`}
          >
            <StatusIcon className="w-3 h-3" />
            {status.label}
            {nextStatuses.length > 0 && (
              <ChevronDown className={`w-3 h-3 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            )}
          </button>

          {/* Dropdown menu */}
          {menuOpen && nextStatuses.length > 0 && (
            <div className="absolute top-full mt-1 left-0 bg-bg-surface border border-border rounded-lg shadow-md z-10">
              {nextStatuses.map((nextStatus) => {
                const nextConfig = statusConfig[nextStatus];
                const NextIcon = nextConfig.icon;
                return (
                  <button
                    key={nextStatus}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setConfirmTransition(nextStatus);
                      setMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-surface-hover transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center gap-2"
                  >
                    <NextIcon className="w-3.5 h-3.5" />
                    {nextConfig.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Badges: Priority + Deadline */}
        <div className="flex flex-wrap items-center gap-2">
          {getPriorityBadge(project.priority)}
          {deadline && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                deadline.urgent
                  ? 'bg-critical/10 text-critical'
                  : 'bg-border text-text-secondary'
              }`}
            >
              {deadline.text}
            </span>
          )}
        </div>

        {/* Dates */}
        <div className="flex items-center gap-3 text-xs text-text-weak">
          <span>Du {formatDate(project.startDate)}</span>
          {project.endDate && <span>au {formatDate(project.endDate)}</span>}
        </div>

        {/* Progress bar */}
        {tasksCount > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">
                {completedCount}/{tasksCount} tâches
              </span>
              <span className="font-medium text-text-primary">{completionPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  completionPercent === 100 ? 'bg-success' : 'bg-primary'
                }`}
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer: Members + Owner + Tasks count */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          {/* Members avatars */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {membersList.slice(0, 4).map((member) => {
                const user = member.user || member;
                return (
                  <div
                    key={member.id || (user as { id: string }).id}
                    className="w-6 h-6 rounded-full bg-primary/15 border-2 border-bg-surface flex items-center justify-center text-[10px] font-bold text-primary"
                    title={`${(user as { firstName: string }).firstName} ${(user as { lastName: string }).lastName}`}
                  >
                    {(user as { firstName: string }).firstName?.[0] || '?'}
                  </div>
                );
              })}
              {membersCount > 4 && (
                <div className="w-6 h-6 rounded-full bg-border border-2 border-bg-surface flex items-center justify-center text-[10px] font-medium text-text-secondary">
                  +{membersCount - 4}
                </div>
              )}
            </div>
            <span className="text-xs text-text-weak">
              {membersCount} {membersCount <= 1 ? 'membre' : 'membres'}
            </span>
          </div>

          {/* Owner */}
          {ownerName && (
            <span className="text-xs text-text-weak truncate max-w-[120px]" title={ownerName}>
              par {ownerName}
            </span>
          )}
        </div>
      </Card>

      {/* Confirmation modal for status change */}
      {confirmTransition && (
        <Modal
          isOpen={!!confirmTransition}
          onClose={() => setConfirmTransition(null)}
          title="Confirmer le changement de statut"
          size="sm"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setConfirmTransition(null)}>
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={updateProjectMutation.isPending}
                onClick={() => handleStatusChange(confirmTransition)}
              >
                Confirmer
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-text-primary">
              Passer le projet <span className="font-semibold">{project.name}</span> de{' '}
              <span className="font-semibold">{status.label}</span> à{' '}
              <span className="font-semibold">{statusConfig[confirmTransition]?.label}</span>?
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
