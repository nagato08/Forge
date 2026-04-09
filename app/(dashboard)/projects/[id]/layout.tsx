'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useProjectById } from '@/lib/hooks/useProjects';
import { useAuthStore } from '@/lib/stores/auth.store';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Badge, { getPriorityBadge } from '@/components/ui/Badge';

interface ProjectLayoutProps {
  children: React.ReactNode;
}

const tabs = [
  { href: '/kanban', label: 'Kanban', icon: '📋' },
  { href: '/gantt', label: 'Gantt', icon: '📊' },
  { href: '/pert', label: 'PERT', icon: '🔗' },
  { href: '/burndown', label: 'Burndown', icon: '📈' },
  { href: '/workload', label: 'Charge', icon: '⚙️' },
  { href: '/chat', label: 'Chat', icon: '💬' },
  { href: '/documents', label: 'Documents', icon: '📄' },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  PLANNING: { label: 'Planification', color: 'info' },
  ACTIVE: { label: 'Actif', color: 'success' },
  ON_HOLD: { label: 'Suspendu', color: 'warning' },
  COMPLETED: { label: 'Terminé', color: 'success' },
  CANCELLED: { label: 'Annulé', color: 'danger' },
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ProjectLayout({ children }: ProjectLayoutProps) {
  const params = useParams();
  const projectId = params.id as string;
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const userId = useAuthStore((state) => state.user?.id);

  const { data: project, isLoading, error } = useProjectById(projectId);
  const [showCode, setShowCode] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner centered size="lg" label="Chargement du projet..." />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-2xl">
        <Alert
          type="error"
          title="Erreur"
          message="Impossible de charger le projet"
        />
      </div>
    );
  }

  const isOwner = project.createdBy === userId;
  const status = statusConfig[project.status] || { label: project.status, color: 'info' };
  const membersCount = project._count?.members ?? project.members?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Project header */}
      <div className="space-y-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-text-primary">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-text-secondary mt-1 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
          {/* Share code button (owner only) */}
          {isOwner && (
            <button
              onClick={() => {
                console.log('📋 Toggling project code visibility');
                setShowCode(!showCode);
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
            >
              {showCode ? 'Masquer code' : 'Code invitation'}
            </button>
          )}
        </div>

        {/* Invite code panel (owner only) */}
        {showCode && isOwner && (
          <div className="p-3 rounded-lg bg-bg-surface-hover border border-border space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-secondary">Code projet :</span>
              <code className="text-sm font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {project.projectCode}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(project.projectCode);
                  console.log('📋 Project code copied:', project.projectCode);
                }}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Copier
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-secondary">Token invitation :</span>
              <code className="text-xs font-mono text-text-weak bg-border px-2 py-0.5 rounded truncate max-w-[200px]">
                {project.inviteToken}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(project.inviteToken);
                  console.log('📋 Invite token copied');
                }}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Copier
              </button>
            </div>
          </div>
        )}

        {/* Meta row: badges + dates + members */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Priority */}
          {getPriorityBadge(project.priority)}

          {/* Status */}
          <Badge variant={status.color as 'info' | 'success' | 'warning' | 'danger'} size="sm">
            {status.label}
          </Badge>

          {/* Separator */}
          <span className="text-border">|</span>

          {/* Dates */}
          <span className="text-xs text-text-secondary">
            {formatDate(project.startDate)}
            {project.endDate && ` → ${formatDate(project.endDate)}`}
          </span>

          {/* Separator */}
          <span className="text-border">|</span>

          {/* Members */}
          <span className="text-xs text-text-secondary">
            {membersCount} {membersCount <= 1 ? 'membre' : 'membres'}
          </span>

          {/* Owner badge */}
          {isOwner && (
            <Badge variant="info" size="sm">
              Propriétaire
            </Badge>
          )}
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="border-b border-border overflow-x-auto -mx-6 px-6">
        <div className="flex gap-1 min-w-min">
          {tabs.map((tab) => {
            const isActive = pathname.includes(tab.href);
            return (
              <Link
                key={tab.href}
                href={`/projects/${projectId}${tab.href}`}
                className={`
                  flex items-center gap-2 px-4 py-3 border-b-2 font-medium
                  transition-colors duration-200 whitespace-nowrap
                  ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Page content */}
      <div>{children}</div>
    </div>
  );
}
