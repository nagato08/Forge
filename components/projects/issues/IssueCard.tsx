'use client';

import { useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge, { BadgeVariant } from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { ProjectIssue, IssueStatus } from '@/lib/api/project-issue.api';
import { useUpdateIssue, useDeleteIssue } from '@/lib/hooks/useProjectIssues';
import { getApiError } from '@/lib/utils/api-error';
import { toast } from '@/lib/stores/toast.store';
import { LinkIcon, Trash2, ChevronDown } from 'lucide-react';

const SEVERITY_BADGE: Record<ProjectIssue['severity'], { variant: BadgeVariant; label: string }> = {
  LOW: { variant: 'info', label: 'Faible' },
  MEDIUM: { variant: 'warning', label: 'Moyenne' },
  HIGH: { variant: 'danger', label: 'Élevée' },
};

const STATUS_BADGE: Record<IssueStatus, { variant: BadgeVariant; label: string }> = {
  OPEN: { variant: 'warning', label: 'Ouverte' },
  IN_PROGRESS: { variant: 'info', label: 'En cours' },
  RESOLVED: { variant: 'success', label: 'Résolue' },
};

const STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: 'OPEN', label: 'Ouverte' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'RESOLVED', label: 'Résolue' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface IssueCardProps {
  issue: ProjectIssue;
  projectId: string;
  currentUserId: string | undefined;
  canManageProject: boolean;
}

/**
 * Une difficulté signalée. Le suivi (statut, action corrective) reste réservé
 * aux gestionnaires du projet — signaler est ouvert à tous, trancher ne l'est pas.
 */
export default function IssueCard({
  issue,
  projectId,
  currentUserId,
  canManageProject,
}: IssueCardProps) {
  const updateMutation = useUpdateIssue(projectId);
  const deleteMutation = useDeleteIssue(projectId);

  const [trackingOpen, setTrackingOpen] = useState(false);
  const [status, setStatus] = useState<IssueStatus>(issue.status);
  const [correctiveAction, setCorrectiveAction] = useState(
    issue.correctiveAction ?? ''
  );

  const isDirty =
    status !== issue.status ||
    correctiveAction !== (issue.correctiveAction ?? '');

  const canDelete = canManageProject || issue.reportedById === currentUserId;

  const handleSaveTracking = () => {
    updateMutation.mutate(
      { issueId: issue.id, status, correctiveAction: correctiveAction || undefined },
      {
        onSuccess: () => toast.success('Suivi mis à jour'),
        onError: (err) =>
          toast.error(getApiError(err), { title: 'Mise à jour impossible' }),
      }
    );
  };

  const handleDelete = () => {
    if (!confirm('Supprimer ce signalement ?')) return;
    deleteMutation.mutate(issue.id, {
      onSuccess: () => toast.success('Signalement supprimé'),
      onError: (err) =>
        toast.error(getApiError(err), { title: 'Suppression impossible' }),
    });
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-text-primary">{issue.title}</h3>
            <Badge variant={SEVERITY_BADGE[issue.severity].variant} size="sm">
              {SEVERITY_BADGE[issue.severity].label}
            </Badge>
            <Badge variant={STATUS_BADGE[issue.status].variant} size="sm">
              {STATUS_BADGE[issue.status].label}
            </Badge>
          </div>
          {issue.description && (
            <p className="text-sm text-text-secondary mt-1.5 whitespace-pre-wrap">
              {issue.description}
            </p>
          )}
        </div>
        {canDelete && (
          <button
            onClick={handleDelete}
            className="text-text-weak hover:text-critical transition-colors shrink-0"
            aria-label="Supprimer le signalement"
            title="Supprimer le signalement"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-xs text-text-secondary">
        <span>
          {issue.reportedBy.firstName} {issue.reportedBy.lastName} · {formatDate(issue.createdAt)}
        </span>
        {issue.task && (
          <Link
            href={`/projects/${projectId}/tasks/${issue.task.id}`}
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <LinkIcon className="w-3 h-3" />
            {issue.task.title}
          </Link>
        )}
        {issue.resolvedAt && (
          <span className="text-success">Résolue le {formatDate(issue.resolvedAt)}</span>
        )}
      </div>

      {issue.correctiveAction && !trackingOpen && (
        <div className="text-sm bg-bg-surface-hover rounded-lg p-3">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
            Action corrective
          </p>
          <p className="text-text-primary whitespace-pre-wrap">{issue.correctiveAction}</p>
        </div>
      )}

      {canManageProject && (
        <div className="pt-2 border-t border-border">
          <button
            onClick={() => setTrackingOpen(!trackingOpen)}
            className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${trackingOpen ? 'rotate-180' : ''}`}
            />
            Suivi de la résolution
          </button>

          {trackingOpen && (
            <div className="mt-3 space-y-3">
              <Select
                label="Statut"
                options={STATUS_OPTIONS}
                value={status}
                onChange={(e) => setStatus(e.target.value as IssueStatus)}
              />
              <Textarea
                label="Action corrective"
                placeholder="Ce qui a été fait ou décidé pour résoudre cette difficulté..."
                rows={3}
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
              />
              {isDirty && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleSaveTracking}
                    isLoading={updateMutation.isPending}
                  >
                    Enregistrer
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
