'use client';

import { useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import Badge, { BadgeVariant } from '@/components/ui/Badge';
import { useStatusReport } from '@/lib/hooks/useProjectIssues';
import { useTasks } from '@/lib/hooks/useTasks';
import { IssueSeverity } from '@/lib/api/project-issue.api';
import { Printer, Milestone as MilestoneIcon, Layers, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  PLANNING: 'Planification',
  ACTIVE: 'Actif',
  ON_HOLD: 'Suspendu',
  COMPLETED: 'Terminé',
  ARCHIVED: 'Archivé',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Basse',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  CRITICAL: 'Critique',
};

const SEVERITY_BADGE: Record<IssueSeverity, { variant: BadgeVariant; label: string }> = {
  LOW: { variant: 'info', label: 'Faible' },
  MEDIUM: { variant: 'warning', label: 'Moyenne' },
  HIGH: { variant: 'danger', label: 'Élevée' },
};

function formatDate(iso: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface StatusReportViewProps {
  projectId: string;
}

/**
 * Rapport d'état : la synthèse qu'un propriétaire de projet imprime pour un
 * point d'avancement — avancement, feuille de route, charge et difficultés
 * réunis, sans jamais se mélanger avec le journal détaillé de l'autre vue.
 */
export default function StatusReportView({ projectId }: StatusReportViewProps) {
  const [issuesTaskId, setIssuesTaskId] = useState('');
  const { data: tasks } = useTasks(projectId);
  const { data: report, isLoading } = useStatusReport(
    projectId,
    issuesTaskId || undefined
  );

  const topContributors = useMemo(() => {
    if (!report) return [];
    const byUser = new Map<string, number>();
    for (const entry of report.workload.entries) {
      byUser.set(entry.userName, (byUser.get(entry.userName) ?? 0) + entry.hours);
    }
    return Array.from(byUser.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [report]);

  if (isLoading || !report) {
    return <Spinner centered size="lg" label="Génération du rapport..." />;
  }

  const { project, phases, milestones, issues } = report;
  const openIssuesCount = issues.filter((i) => i.status !== 'RESOLVED').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap print:hidden">
        <p className="text-sm text-text-secondary">
          Généré le {formatDate(report.generatedAt)} · document imprimable, à
          jour de l'avancement réel du projet
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.print()}
          className="flex items-center gap-1.5"
        >
          <Printer className="w-4 h-4" />
          Imprimer / Exporter en PDF
        </Button>
      </div>

      <div id="print-area" className="space-y-4">
        {/* En-tête projet */}
        <Card className="p-6 space-y-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-semibold text-text-primary">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-text-secondary mt-1">{project.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="info" size="sm">
                {STATUS_LABELS[project.status] ?? project.status}
              </Badge>
              <Badge variant="warning" size="sm">
                {PRIORITY_LABELS[project.priority] ?? project.priority}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-secondary">
            <span>
              {formatDate(project.startDate)} → {formatDate(project.endDate)}
            </span>
            {project.owner && (
              <span>Propriétaire : {project.owner.firstName} {project.owner.lastName}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-bg-surface-hover rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${project.progressPercent === 100 ? 'bg-success' : 'bg-primary'}`}
                style={{ width: `${project.progressPercent}%` }}
              />
            </div>
            <span className="text-sm font-medium text-text-primary shrink-0">
              {project.doneTaskCount}/{project.taskCount} tâches · {project.progressPercent}%
            </span>
          </div>
        </Card>

        {/* Feuille de route */}
        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Layers className="w-4 h-4 text-text-secondary" />
            Feuille de route
          </h2>
          {phases.length === 0 ? (
            <p className="text-sm text-text-weak">Aucune phase définie</p>
          ) : (
            <div className="space-y-2">
              {phases
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((phase) => (
                  <div key={phase.id} className="flex items-center gap-3 text-sm">
                    <span className="flex-1 text-text-primary truncate">{phase.name}</span>
                    {phase.isLate && <AlertTriangle className="w-3.5 h-3.5 text-critical shrink-0" />}
                    <div className="w-32 h-1.5 bg-bg-surface-hover rounded-full overflow-hidden shrink-0">
                      <div
                        className={`h-full rounded-full ${phase.isLate ? 'bg-critical' : 'bg-primary'}`}
                        style={{ width: `${phase.progressPercent}%` }}
                      />
                    </div>
                    <span className="text-text-secondary text-xs w-20 text-right shrink-0">
                      {phase.doneCount}/{phase.taskCount} · {phase.progressPercent}%
                    </span>
                  </div>
                ))}
            </div>
          )}
        </Card>

        {/* Jalons */}
        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <MilestoneIcon className="w-4 h-4 text-text-secondary" />
            Jalons
          </h2>
          {milestones.length === 0 ? (
            <p className="text-sm text-text-weak">Aucun jalon défini</p>
          ) : (
            <div className="space-y-1.5">
              {milestones.map((m) => (
                <div key={m.id} className="flex items-center gap-2 text-sm">
                  {m.reached ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  ) : m.overdue ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-critical shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-border shrink-0" />
                  )}
                  <span className="flex-1 text-text-primary">{m.name}</span>
                  <span className="text-text-secondary text-xs">{formatDate(m.date)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Charge (30 derniers jours) */}
        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Zap className="w-4 h-4 text-text-secondary" />
            Charge — 30 derniers jours ({report.workload.totalHours}h au total)
          </h2>
          {topContributors.length === 0 ? (
            <p className="text-sm text-text-weak">Aucune heure enregistrée sur la période</p>
          ) : (
            <div className="space-y-1.5">
              {topContributors.map(([name, hours]) => (
                <div key={name} className="flex items-center gap-3 text-sm">
                  <span className="flex-1 text-text-primary">{name}</span>
                  <span className="text-text-secondary text-xs">{hours}h</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Difficultés */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-text-secondary" />
              Difficultés {issuesTaskId ? 'sur la tâche sélectionnée' : 'du projet'} ({openIssuesCount} en cours)
            </h2>
            <Select
              options={(tasks ?? []).map((t) => ({ value: t.id, label: t.title }))}
              placeholder="Projet entier"
              value={issuesTaskId}
              onChange={(e) => setIssuesTaskId(e.target.value)}
              className="!w-auto min-w-[180px] print:hidden"
            />
          </div>
          {issues.length === 0 ? (
            <p className="text-sm text-text-weak">Aucune difficulté à signaler</p>
          ) : (
            <div className="space-y-2">
              {issues.map((issue) => (
                <div key={issue.id} className="flex items-start gap-2 text-sm border-t border-border pt-2 first:border-0 first:pt-0">
                  <Badge variant={SEVERITY_BADGE[issue.severity].variant} size="sm">
                    {SEVERITY_BADGE[issue.severity].label}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary">{issue.title}</p>
                    {issue.correctiveAction && (
                      <p className="text-xs text-text-secondary mt-0.5">
                        Action corrective : {issue.correctiveAction}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-text-secondary shrink-0">
                    {issue.status === 'RESOLVED' ? 'Résolue' : issue.status === 'IN_PROGRESS' ? 'En cours' : 'Ouverte'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
