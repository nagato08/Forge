'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjectById } from '@/lib/hooks/useProjects';
import { useStatusDonut, useEisenhower, useWorkload } from '@/lib/hooks/usePlanning';
import { usePhases, useMilestones } from '@/lib/hooks/useMilestones';
import { useProjectIssues } from '@/lib/hooks/useProjectIssues';
import Spinner from '@/components/ui/Spinner';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  CheckCircle2,
  Clock,
  AlertOctagon,
  Zap,
  AlertTriangle,
  Milestone as MilestoneIcon,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

const DONUT_COLORS = ['var(--text-weak)', 'var(--info)', 'var(--success)'];

function getDaysRemaining(endDate: string | null | undefined): { text: string; urgent: boolean } | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return null;
  const diffDays = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: `${Math.abs(diffDays)}j de retard`, urgent: true };
  if (diffDays === 0) return { text: "Aujourd'hui", urgent: true };
  return { text: `${diffDays}j restants`, urgent: diffDays <= 7 };
}

/** Anneau SVG fait main : 3 segments fixes (À faire/En cours/Terminé), pas de lib de charts pour si peu. */
function StatusDonut({ labels, values, total }: { labels: string[]; values: number[]; total: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-28 h-28 shrink-0 -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--bg-surface-hover)" strokeWidth="14" />
        {total > 0 &&
          values.map((value, i) => {
            if (value === 0) return null;
            const fraction = value / total;
            const dash = fraction * circumference;
            const offset = cumulative * circumference;
            cumulative += fraction;
            return (
              <circle
                key={labels[i]}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
                strokeWidth="14"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            );
          })}
      </svg>
      <div className="space-y-1.5">
        {labels.map((label, i) => (
          <div key={label} className="flex items-center gap-2 text-sm">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
            />
            <span className="text-text-secondary">{label}</span>
            <span className="font-medium text-text-primary">{values[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface KpiCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: 'default' | 'critical' | 'warning' | 'success';
}

function KpiCard({ icon: Icon, label, value, tone = 'default' }: KpiCardProps) {
  const toneClass = {
    default: 'text-primary',
    critical: 'text-critical',
    warning: 'text-warning',
    success: 'text-success',
  }[tone];

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={`w-4 h-4 ${toneClass}`} />
        <p className="text-xs text-text-secondary font-medium">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${toneClass}`}>{value}</p>
    </Card>
  );
}

const EISENHOWER_QUADRANTS: {
  key: 'urgentImportant' | 'urgentNotImportant' | 'notUrgentImportant' | 'notUrgentNotImportant';
  label: string;
  tone: 'critical' | 'warning' | 'info' | 'default';
}[] = [
  { key: 'urgentImportant', label: 'Urgent & important', tone: 'critical' },
  { key: 'urgentNotImportant', label: 'Urgent', tone: 'warning' },
  { key: 'notUrgentImportant', label: 'Important', tone: 'info' },
  { key: 'notUrgentNotImportant', label: 'Ni l’un ni l’autre', tone: 'default' },
];

export default function ProjectDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: project, isLoading: projectLoading } = useProjectById(projectId);
  const { data: donut, isLoading: donutLoading } = useStatusDonut(projectId);
  const { data: eisenhower, isLoading: eisenhowerLoading } = useEisenhower(projectId);
  const { data: phases, isLoading: phasesLoading } = usePhases(projectId);
  const { data: milestones, isLoading: milestonesLoading } = useMilestones(projectId);
  const { data: issues, isLoading: issuesLoading } = useProjectIssues(projectId);

  const workloadRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
  }, []);
  const { data: workload, isLoading: workloadLoading } = useWorkload({
    projectId,
    ...workloadRange,
    groupBy: 'week',
  });

  const isLoading =
    projectLoading || donutLoading || eisenhowerLoading || phasesLoading || milestonesLoading || issuesLoading || workloadLoading;

  if (isLoading || !project) {
    return <Spinner centered size="lg" label="Chargement du tableau de bord..." />;
  }

  const tasksCount = project._count?.tasks ?? project.tasksCount ?? 0;
  const completedCount = project.completedTasksCount ?? 0;
  const progressPercent = tasksCount > 0 ? Math.round((completedCount / tasksCount) * 100) : 0;
  const deadline = getDaysRemaining(project.endDate);

  const openIssues = (issues ?? []).filter((i) => i.status !== 'RESOLVED');
  const issuesBySeverity = {
    HIGH: openIssues.filter((i) => i.severity === 'HIGH').length,
    MEDIUM: openIssues.filter((i) => i.severity === 'MEDIUM').length,
    LOW: openIssues.filter((i) => i.severity === 'LOW').length,
  };

  const overloadedCount = (workload?.entries ?? []).filter((e) => e.isOverloaded).length;
  const machineOverCapacity = workload?.machine?.byPeriod.some((p) => p.overCapacity) ?? false;
  const chargeTone: KpiCardProps['tone'] = overloadedCount > 0 || machineOverCapacity ? 'critical' : 'success';
  const chargeValue =
    overloadedCount > 0
      ? `${overloadedCount} en surcharge`
      : machineOverCapacity
        ? 'Machine dépassée'
        : 'OK';

  const latePhases = (phases ?? []).filter((p) => p.isLate);
  const overdueMilestones = (milestones ?? []).filter((m) => m.overdue);

  const unitLabel = workload?.chargeUnit === 'PERSON_DAYS' ? 'j' : 'h';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Tableau de bord</h1>
        <p className="text-sm text-text-secondary mt-1">
          Vue d'ensemble du projet — avancement, délais, charge et risques en un coup d'œil.
        </p>
      </div>

      {/* KPI : lecture immédiate de l'état du projet */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={CheckCircle2} label="Tâches terminées" value={`${progressPercent}%`} tone={progressPercent === 100 ? 'success' : 'default'} />
        <KpiCard
          icon={Clock}
          label="Échéance"
          value={deadline ? deadline.text : '—'}
          tone={deadline?.urgent ? 'critical' : 'default'}
        />
        <KpiCard
          icon={AlertOctagon}
          label="Difficultés ouvertes"
          value={String(openIssues.length)}
          tone={openIssues.length > 0 ? 'warning' : 'success'}
        />
        <KpiCard icon={Zap} label="Charge d'équipe" value={chargeValue} tone={chargeTone} />
      </div>

      {/* Rangée 1 : avancement + indicateurs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-text-secondary" />
            Avancement
          </h2>
          {donut && donut.total > 0 ? (
            <StatusDonut labels={donut.labels} values={donut.values} total={donut.total} />
          ) : (
            <p className="text-sm text-text-weak">Aucune tâche pour l'instant</p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Indicateurs — matrice Eisenhower</h2>
          <div className="grid grid-cols-2 gap-3">
            {EISENHOWER_QUADRANTS.map(({ key, label, tone }) => {
              const tasks = eisenhower?.[key] ?? [];
              return (
                <div key={key} className="rounded-lg border border-border p-3 min-h-[100px]">
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
                      tone === 'default' ? 'text-text-secondary' : `text-${tone}`
                    }`}
                  >
                    {label} ({tasks.length})
                  </p>
                  <div className="space-y-1">
                    {tasks.slice(0, 3).map((t) => (
                      <p key={t.id} className="text-xs text-text-primary truncate" title={t.title}>
                        {t.title}
                      </p>
                    ))}
                    {tasks.length > 3 && (
                      <p className="text-xs text-text-weak">+{tasks.length - 3} autres</p>
                    )}
                    {tasks.length === 0 && <p className="text-xs text-text-weak">Aucune</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Rangée 2 : délais + charge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-text-secondary" />
            Délais
          </h2>
          {latePhases.length === 0 && overdueMilestones.length === 0 ? (
            <p className="text-sm text-success">Rien en retard</p>
          ) : (
            <div className="space-y-2">
              {latePhases.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-text-primary truncate">{p.name}</span>
                  <Badge variant="danger" size="sm">Phase en retard</Badge>
                </div>
              ))}
              {overdueMilestones.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <span className="text-text-primary truncate">{m.name}</span>
                  <Badge variant="danger" size="sm">Jalon dépassé</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-text-secondary" />
            Charge — 30 derniers jours
          </h2>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-2xl font-bold text-text-primary">
              {workload?.totalHours ?? 0}{unitLabel}
            </span>
            <span className="text-sm text-text-secondary">
              sur {workload?.entries.length ?? 0} personne{(workload?.entries.length ?? 0) > 1 ? 's' : ''}
            </span>
          </div>
          {overloadedCount > 0 && (
            <p className="text-sm text-critical flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {overloadedCount} personne{overloadedCount > 1 ? 's' : ''} en surcharge
            </p>
          )}
          {machineOverCapacity && (
            <p className="text-sm text-critical flex items-center gap-1.5 mt-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Capacité machine dépassée récemment
            </p>
          )}
          {overloadedCount === 0 && !machineOverCapacity && (
            <p className="text-sm text-success">Charge sous contrôle</p>
          )}
        </Card>
      </div>

      {/* Rangée 3 : risques + burndown, chacun renvoyant vers sa vue détaillée */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-text-secondary" />
              Risques
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/projects/${projectId}/difficultes`)}
              className="flex items-center gap-1 text-xs"
            >
              Voir tout <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          {openIssues.length === 0 ? (
            <p className="text-sm text-success">Aucune difficulté en cours</p>
          ) : (
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5"><Badge variant="danger" size="sm">{issuesBySeverity.HIGH}</Badge> Élevée</span>
              <span className="flex items-center gap-1.5"><Badge variant="warning" size="sm">{issuesBySeverity.MEDIUM}</Badge> Moyenne</span>
              <span className="flex items-center gap-1.5"><Badge variant="info" size="sm">{issuesBySeverity.LOW}</Badge> Faible</span>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <MilestoneIcon className="w-4 h-4 text-text-secondary" />
              Burndown
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/projects/${projectId}/burndown`)}
              className="flex items-center gap-1 text-xs"
            >
              Voir le graphe <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          <p className="text-sm text-text-secondary">
            {tasksCount - completedCount} tâche{tasksCount - completedCount > 1 ? 's' : ''} restante
            {tasksCount - completedCount > 1 ? 's' : ''} sur {tasksCount}.
          </p>
        </Card>
      </div>
    </div>
  );
}
