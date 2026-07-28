'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTasks } from '@/lib/hooks/useTasks';
import { useProjectRole } from '@/lib/hooks/useProjects';
import {
  useAssignSprintTasks,
  useCreateSprint,
  useDeleteSprint,
  useSprints,
  useUpdateSprint,
} from '@/lib/hooks/useSprints';
import { Sprint, SprintStatus } from '@/lib/types/planning.types';
import { getApiError } from '@/lib/utils/api-error';
import { toast } from '@/lib/stores/toast.store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Play,
  Plus,
  Repeat,
  Trash2,
} from 'lucide-react';

const STATUS_LABELS: Record<SprintStatus, string> = {
  [SprintStatus.PLANNED]: 'Planifié',
  [SprintStatus.ACTIVE]: 'En cours',
  [SprintStatus.COMPLETED]: 'Terminé',
};

const STATUS_STYLES: Record<SprintStatus, string> = {
  [SprintStatus.PLANNED]: 'bg-text-secondary/10 text-text-secondary',
  [SprintStatus.ACTIVE]: 'bg-primary/10 text-primary',
  [SprintStatus.COMPLETED]: 'bg-success/10 text-success',
};

export default function SprintsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: sprints, isLoading } = useSprints(projectId);
  const { data: tasks } = useTasks(projectId);
  const { canManage } = useProjectRole(projectId);

  const createSprint = useCreateSprint();
  const updateSprint = useUpdateSprint();
  const deleteSprint = useDeleteSprint();
  const assignTasks = useAssignSprintTasks();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    goal: '',
    startDate: '',
    endDate: '',
  });

  /** Sprint dont on compose le contenu. */
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);

  const selectedSprint = sprints?.find((s) => s.id === selectedSprintId) ?? null;

  const backlogTasks = useMemo(
    () => (tasks ?? []).filter((t) => !t.sprintId),
    [tasks]
  );

  const sprintTasks = useMemo(
    () =>
      selectedSprintId
        ? (tasks ?? []).filter((t) => t.sprintId === selectedSprintId)
        : [],
    [tasks, selectedSprintId]
  );

  const handleCreate = () => {
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      toast.error('Nom et dates requis');
      return;
    }

    createSprint.mutate(
      {
        projectId,
        name: form.name.trim(),
        goal: form.goal.trim() || undefined,
        startDate: new Date(`${form.startDate}T00:00:00`).toISOString(),
        endDate: new Date(`${form.endDate}T23:59:59`).toISOString(),
      },
      {
        onSuccess: () => {
          toast.success('Sprint créé');
          setModalOpen(false);
          setForm({ name: '', goal: '', startDate: '', endDate: '' });
        },
        onError: (err) => toast.error(getApiError(err)),
      }
    );
  };

  const changeStatus = (sprint: Sprint, status: SprintStatus) => {
    updateSprint.mutate(
      { projectId, sprintId: sprint.id, status },
      {
        onSuccess: () => toast.success(`Sprint ${STATUS_LABELS[status]}`),
        // Le refus le plus courant : un autre sprint est déjà en cours.
        onError: (err) =>
          toast.error(getApiError(err), { title: 'Changement refusé' }),
      }
    );
  };

  const moveTasks = (taskIds: string[], sprintId: string | null) => {
    if (taskIds.length === 0) return;
    assignTasks.mutate(
      { projectId, taskIds, sprintId },
      {
        onSuccess: (r) =>
          toast.success(
            sprintId
              ? `${r.updated} tâche${r.updated > 1 ? 's' : ''} ajoutée${r.updated > 1 ? 's' : ''} au sprint`
              : `${r.updated} tâche${r.updated > 1 ? 's' : ''} renvoyée${r.updated > 1 ? 's' : ''} au backlog`
          ),
        onError: (err) => toast.error(getApiError(err)),
      }
    );
  };

  if (isLoading) {
    return <Spinner centered size="lg" label="Chargement des sprints..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <Repeat className="w-5 h-5 text-primary" />
            Sprints
          </h2>
          <p className="text-sm text-text-secondary">
            Itérations à durée fixe. Un seul sprint peut être en cours à la fois.
          </p>
        </div>

        {canManage && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Nouveau sprint
          </Button>
        )}
      </div>

      {/* Liste des sprints */}
      {!sprints || sprints.length === 0 ? (
        <Card className="p-12 text-center">
          <Repeat className="w-10 h-10 text-text-weak mx-auto mb-3" />
          <p className="text-text-primary font-medium">Aucun sprint</p>
          <p className="text-sm text-text-secondary mt-1">
            Créez une itération pour donner un cadre au burndown.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sprints.map((sprint) => (
            <Card
              key={sprint.id}
              className={`p-4 space-y-3 ${
                selectedSprintId === sprint.id ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-text-primary truncate">
                      {sprint.name}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[sprint.status]}`}
                    >
                      {STATUS_LABELS[sprint.status]}
                    </span>
                  </div>
                  {sprint.goal && (
                    <p className="text-sm text-text-secondary mt-1">
                      {sprint.goal}
                    </p>
                  )}
                  <p className="text-xs text-text-weak mt-1">
                    {new Date(sprint.startDate).toLocaleDateString('fr-FR')} →{' '}
                    {new Date(sprint.endDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                {canManage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      deleteSprint.mutate(
                        { projectId, sprintId: sprint.id },
                        {
                          onSuccess: () => {
                            toast.success(
                              'Sprint supprimé, ses tâches sont au backlog'
                            );
                            if (selectedSprintId === sprint.id) {
                              setSelectedSprintId(null);
                            }
                          },
                          onError: (err) => toast.error(getApiError(err)),
                        }
                      )
                    }
                    className="text-critical shrink-0"
                    aria-label={`Supprimer ${sprint.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Avancement */}
              <div>
                <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                  <span>
                    {sprint.completedWork}/{sprint.totalWork}{' '}
                    {sprint.usesStoryPoints ? 'points' : 'tâches'}
                  </span>
                  <span>{sprint.progressPercent}%</span>
                </div>
                <div className="h-2 bg-bg-surface-hover rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${sprint.progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setSelectedSprintId(
                      selectedSprintId === sprint.id ? null : sprint.id
                    )
                  }
                >
                  {selectedSprintId === sprint.id
                    ? 'Fermer'
                    : 'Composer le contenu'}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    router.push(
                      `/projects/${projectId}/burndown?sprintId=${sprint.id}`
                    )
                  }
                  className="flex items-center gap-1.5"
                >
                  <BarChart3 className="w-4 h-4" />
                  Burndown
                </Button>

                {canManage && sprint.status === SprintStatus.PLANNED && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => changeStatus(sprint, SprintStatus.ACTIVE)}
                    isLoading={updateSprint.isPending}
                    className="flex items-center gap-1.5"
                  >
                    <Play className="w-4 h-4" />
                    Démarrer
                  </Button>
                )}

                {canManage && sprint.status === SprintStatus.ACTIVE && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => changeStatus(sprint, SprintStatus.COMPLETED)}
                    isLoading={updateSprint.isPending}
                    className="flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Clore
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Composition du sprint : backlog à gauche, sprint à droite */}
      {selectedSprint && (
        <Card className="p-4">
          <h3 className="font-semibold text-text-primary mb-3">
            Contenu de « {selectedSprint.name} »
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TaskColumn
              title={`Backlog (${backlogTasks.length})`}
              tasks={backlogTasks}
              actionLabel="Ajouter au sprint"
              actionIcon={<ArrowRight className="w-3.5 h-3.5" />}
              disabled={!canManage || assignTasks.isPending}
              onAction={(taskId) => moveTasks([taskId], selectedSprint.id)}
              emptyLabel="Aucune tâche au backlog"
            />

            <TaskColumn
              title={`Dans le sprint (${sprintTasks.length})`}
              tasks={sprintTasks}
              actionLabel="Retirer"
              actionIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              disabled={!canManage || assignTasks.isPending}
              onAction={(taskId) => moveTasks([taskId], null)}
              emptyLabel="Sprint vide — ajoutez des tâches depuis le backlog"
            />
          </div>

          {!canManage && (
            <p className="text-xs text-text-secondary mt-3">
              Seuls les gestionnaires du projet peuvent modifier le contenu d’un
              sprint.
            </p>
          )}
        </Card>
      )}

      {/* Création */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nouveau sprint"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreate}
              isLoading={createSprint.isPending}
            >
              Créer
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            label="Nom"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Sprint 1 — Authentification"
          />
          <Input
            label="Objectif (optionnel)"
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
            placeholder="Livrer un parcours de connexion complet"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Début"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <Input
              label="Fin"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

/** Colonne de tâches avec une action de transfert par ligne. */
function TaskColumn({
  title,
  tasks,
  actionLabel,
  actionIcon,
  disabled,
  onAction,
  emptyLabel,
}: {
  title: string;
  tasks: { id: string; title: string; status: string; storyPoints?: number }[];
  actionLabel: string;
  actionIcon: React.ReactNode;
  disabled: boolean;
  onAction: (taskId: string) => void;
  emptyLabel: string;
}) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-bg-surface-hover text-xs font-medium text-text-secondary">
        {title}
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-border">
        {tasks.length === 0 ? (
          <p className="p-4 text-sm text-text-secondary text-center">
            {emptyLabel}
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between gap-2 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm text-text-primary truncate">
                  {task.title}
                </p>
                {task.storyPoints != null && (
                  <p className="text-xs text-text-secondary">
                    {task.storyPoints} pts
                  </p>
                )}
              </div>
              {!disabled && (
                <button
                  onClick={() => onAction(task.id)}
                  title={actionLabel}
                  aria-label={`${actionLabel} : ${task.title}`}
                  className="shrink-0 p-1.5 rounded text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  {actionIcon}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
