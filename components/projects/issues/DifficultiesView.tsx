'use client';

import { useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import IssueCard from './IssueCard';
import IssueFormModal from './IssueFormModal';
import { useProjectIssues } from '@/lib/hooks/useProjectIssues';
import { useTasks } from '@/lib/hooks/useTasks';
import { IssueSeverity, IssueStatus } from '@/lib/api/project-issue.api';
import { AlertOctagon, Plus } from 'lucide-react';

const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyenne',
  HIGH: 'Élevée',
};

interface DifficultiesViewProps {
  projectId: string;
  currentUserId: string | undefined;
  canManageProject: boolean;
  canContribute: boolean;
}

/**
 * Journal des difficultés : ce que chaque contributeur rencontre sur le
 * terrain, visible de tout le projet — la transparence est le point, pas
 * seulement la trace.
 */
export default function DifficultiesView({
  projectId,
  currentUserId,
  canManageProject,
  canContribute,
}: DifficultiesViewProps) {
  const { data: issues, isLoading } = useProjectIssues(projectId);
  const { data: tasks } = useTasks(projectId);

  const [statusFilter, setStatusFilter] = useState<IssueStatus | ''>('');
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity | ''>('');
  const [taskFilter, setTaskFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const counts = useMemo(() => {
    const list = issues ?? [];
    return {
      open: list.filter((i) => i.status === 'OPEN').length,
      inProgress: list.filter((i) => i.status === 'IN_PROGRESS').length,
      resolved: list.filter((i) => i.status === 'RESOLVED').length,
    };
  }, [issues]);

  const filtered = useMemo(() => {
    return (issues ?? []).filter(
      (i) =>
        (!statusFilter || i.status === statusFilter) &&
        (!severityFilter || i.severity === severityFilter) &&
        (!taskFilter || i.taskId === taskFilter)
    );
  }, [issues, statusFilter, severityFilter, taskFilter]);

  if (isLoading) {
    return <Spinner centered size="lg" label="Chargement des difficultés..." />;
  }

  return (
    <div className="space-y-4">
      {/* Compteurs : lecture immédiate de l'état du projet, avant tout détail */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <p className="text-2xl font-semibold text-warning">{counts.open}</p>
          <p className="text-xs text-text-secondary mt-0.5">Ouvertes</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-semibold text-info">{counts.inProgress}</p>
          <p className="text-xs text-text-secondary mt-0.5">En cours</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-semibold text-success">{counts.resolved}</p>
          <p className="text-xs text-text-secondary mt-0.5">Résolues</p>
        </Card>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            options={[
              { value: 'OPEN', label: 'Ouvertes' },
              { value: 'IN_PROGRESS', label: 'En cours' },
              { value: 'RESOLVED', label: 'Résolues' },
            ]}
            placeholder="Tous les statuts"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as IssueStatus | '')}
            className="!w-auto min-w-[150px]"
          />
          <Select
            options={Object.entries(SEVERITY_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
            placeholder="Toutes gravités"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as IssueSeverity | '')}
            className="!w-auto min-w-[150px]"
          />
          <Select
            options={(tasks ?? []).map((t) => ({ value: t.id, label: t.title }))}
            placeholder="Toutes les tâches"
            value={taskFilter}
            onChange={(e) => setTaskFilter(e.target.value)}
            className="!w-auto min-w-[170px]"
          />
        </div>

        {canContribute && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Signaler une difficulté
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 flex flex-col items-center text-center gap-3">
          <AlertOctagon className="w-10 h-10 text-text-weak" />
          <p className="text-text-secondary">
            {(issues ?? []).length === 0
              ? 'Aucune difficulté signalée sur ce projet'
              : 'Aucune difficulté ne correspond à ces filtres'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              projectId={projectId}
              currentUserId={currentUserId}
              canManageProject={canManageProject}
            />
          ))}
        </div>
      )}

      <IssueFormModal
        projectId={projectId}
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
      />
    </div>
  );
}
