'use client';

import { useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProjectById } from '@/lib/hooks/useProjects';
import { useAuthStore } from '@/lib/stores/auth.store';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Badge, { getPriorityBadge } from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import {
  LayoutGrid,
  TrendingUp,
  Network,
  BarChart3,
  Zap,
  MessageSquare,
  FileText,
  Settings,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  Pause,
  Plus,
} from 'lucide-react';

interface ProjectLayoutProps {
  children: React.ReactNode;
}

interface Tab {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  ownerOnly?: boolean;
}

const tabs: Tab[] = [
  { href: '/kanban', label: 'Kanban', icon: LayoutGrid },
  { href: '/gantt', label: 'Gantt', icon: TrendingUp },
  { href: '/pert', label: 'PERT', icon: Network },
  { href: '/burndown', label: 'Burndown', icon: BarChart3 },
  { href: '/workload', label: 'Charge', icon: Zap },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/settings', label: 'Paramètres', icon: Settings, ownerOnly: true },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  PLANNING: { label: 'Planification', color: 'info', icon: AlertCircle },
  ACTIVE: { label: 'Actif', color: 'success', icon: CheckCircle2 },
  ON_HOLD: { label: 'Suspendu', color: 'warning', icon: Pause },
  COMPLETED: { label: 'Terminé', color: 'success', icon: CheckCircle2 },
  CANCELLED: { label: 'Annulé', color: 'danger', icon: AlertCircle },
};

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getDaysRemaining(endDate: string | null | undefined): { text: string; urgent: boolean } {
  if (!endDate) return { text: '-', urgent: false };
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return { text: '-', urgent: false };
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: `${Math.abs(diffDays)}j de retard`, urgent: true };
  if (diffDays === 0) return { text: "Aujourd'hui", urgent: true };
  if (diffDays === 1) return { text: 'Demain', urgent: true };
  if (diffDays <= 7) return { text: `${diffDays}j restants`, urgent: true };
  return { text: `${diffDays}j restants`, urgent: false };
}

export default function ProjectLayout({ children }: ProjectLayoutProps) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const projectId = params.id as string;
  const userId = useAuthStore((state) => state.user?.id);

  const { data: project, isLoading, error } = useProjectById(projectId);
  const [showCode, setShowCode] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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

  const isOwner = project.createdBy === userId || project.ownerId === userId;
  console.log('🔍 Debug isOwner:', {
    userId,
    createdBy: project.createdBy,
    ownerId: project.ownerId,
    owner: project.owner,
    isOwner,
  });
  const status = statusConfig[project.status] || { label: project.status, color: 'info', icon: '📁' };
  const members = project.members || [];
  const membersCount = project._count?.members ?? members.length ?? 0;
  const tasksCount = project._count?.tasks ?? project.tasksCount ?? 0;
  const completedCount = project.completedTasksCount ?? 0;
  const progressPercent = tasksCount > 0 ? Math.round((completedCount / tasksCount) * 100) : 0;
  const deadline = project.endDate ? getDaysRemaining(project.endDate) : null;

  return (
    <div className="space-y-6">
      {/* Project header card */}
      <Card className="p-6 space-y-4">
        {/* Row 1: Title + actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-text-primary">
                {project.name}
              </h1>
              <Badge variant={status.color as 'info' | 'success' | 'warning' | 'danger'} size="sm" className="flex items-center gap-1">
                <status.icon className="w-3.5 h-3.5" />
                {status.label}
              </Badge>
              {getPriorityBadge(project.priority)}
              {isOwner && (
                <Badge variant="info" size="sm">
                  Propriétaire
                </Badge>
              )}
            </div>
            {project.description && (
              <p className="text-text-secondary mt-2 text-sm leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => router.push(`/projects/${projectId}/kanban?createTask=true`)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1.5"
              title="Créer une nouvelle tâche"
            >
              <Plus className="w-4 h-4" />
              Nouvelle tâche
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-bg-surface-hover text-text-secondary hover:text-text-primary hover:bg-border transition-colors"
            >
              {showDetails ? 'Moins' : 'Détails'}
            </button>
            {isOwner && (
              <button
                onClick={() => {
                  console.log('📋 Toggling project code visibility');
                  setShowCode(!showCode);
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
              >
                {showCode ? 'Masquer code' : 'Inviter'}
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Stats summary */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          {/* Dates */}
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Clock className="w-4 h-4" />
            <span>{formatDate(project.startDate)}</span>
            {project.endDate && (
              <>
                <span className="text-text-weak">→</span>
                <span>{formatDate(project.endDate)}</span>
              </>
            )}
          </div>

          {/* Deadline countdown */}
          {deadline && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
              deadline.urgent
                ? 'bg-critical/10 text-critical'
                : 'bg-success/10 text-success'
            }`}>
              <AlertCircle className="w-3 h-3" />
              {deadline.text}
            </span>
          )}

          {/* Members */}
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Users className="w-4 h-4" />
            <span>{membersCount} {membersCount <= 1 ? 'membre' : 'membres'}</span>
          </div>

          {/* Tasks count */}
          {tasksCount > 0 && (
            <div className="flex items-center gap-1.5 text-text-secondary">
              <LayoutGrid className="w-4 h-4" />
              <span>{completedCount}/{tasksCount} tâches</span>
            </div>
          )}

          {/* Progress bar (inline) */}
          {tasksCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-bg-surface-hover rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    progressPercent === 100 ? 'bg-success' : 'bg-primary'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-medium text-text-secondary">{progressPercent}%</span>
            </div>
          )}
        </div>

        {/* Expandable: Objectives + Members */}
        {showDetails && (
          <div className="pt-4 border-t border-border space-y-4">
            {/* Objectives */}
            {project.objectives && (
              <div>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Objectifs
                </h3>
                <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                  {project.objectives}
                </p>
              </div>
            )}

            {/* Members list */}
            {members.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Membres de l'équipe
                </h3>
                <div className="flex flex-wrap gap-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-surface-hover text-sm"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center shrink-0 font-semibold">
                        {member.user?.firstName?.[0] || '?'}
                        {member.user?.lastName?.[0] || ''}
                      </div>
                      <span className="text-text-primary font-medium">
                        {member.user?.firstName} {member.user?.lastName}
                      </span>
                      {member.userId === project.createdBy && (
                        <span className="text-xs text-primary font-medium">Chef</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dates detail */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-bg-surface-hover">
                <p className="text-xs text-text-secondary mb-1">Créé le</p>
                <p className="text-sm font-medium text-text-primary">{formatDate(project.createdAt)}</p>
              </div>
              <div className="p-3 rounded-lg bg-bg-surface-hover">
                <p className="text-xs text-text-secondary mb-1">Début</p>
                <p className="text-sm font-medium text-text-primary">{formatDate(project.startDate)}</p>
              </div>
              {project.endDate && (
                <div className="p-3 rounded-lg bg-bg-surface-hover">
                  <p className="text-xs text-text-secondary mb-1">Échéance</p>
                  <p className="text-sm font-medium text-text-primary">{formatDate(project.endDate)}</p>
                </div>
              )}
              <div className="p-3 rounded-lg bg-bg-surface-hover">
                <p className="text-xs text-text-secondary mb-1">Mis à jour</p>
                <p className="text-sm font-medium text-text-primary">{formatDate(project.updatedAt)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Invite code panel (owner only) */}
        {showCode && isOwner && (
          <div className="pt-4 border-t border-border space-y-3">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Invitation
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 p-3 rounded-lg bg-bg-surface-hover space-y-1">
                <p className="text-xs text-text-secondary">Code projet</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono font-bold text-primary">
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
              </div>
              <div className="flex-1 p-3 rounded-lg bg-bg-surface-hover space-y-1">
                <p className="text-xs text-text-secondary">Token d'invitation</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-text-weak truncate max-w-[200px]">
                    {project.inviteToken}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(project.inviteToken);
                      console.log('📋 Invite token copied');
                    }}
                    className="text-xs text-primary hover:text-primary/80 transition-colors shrink-0"
                  >
                    Copier
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Navigation tabs */}
      <div className="border-b border-border overflow-x-auto -mx-6 px-6">
        <div className="flex gap-1 min-w-min">
          {tabs
            .filter((tab) => !tab.ownerOnly || isOwner)
            .map((tab) => {
              const TabIcon = tab.icon;
              const isActive = pathname.includes(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={`/projects/${projectId}${tab.href}`}
                  className={`
                    flex items-center gap-2 px-4 py-3 border-b-2 font-medium
                    transition-colors duration-200 whitespace-nowrap text-sm
                    ${
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-text-secondary hover:text-text-primary'
                    }
                  `}
                >
                  <TabIcon className="w-4 h-4" />
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
