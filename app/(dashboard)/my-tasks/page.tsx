'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMyTasks, useUpdateTaskStatus } from '@/lib/hooks';
import { tasksApi } from '@/lib/api/tasks.api';
import { getApiError } from '@/lib/utils/api-error';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { toast } from '@/lib/stores/toast.store';
import Card from '@/components/ui/Card';
import {
  ClipboardList,
  ListTodo,
  Play,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ArrowRight,
  Filter,
  X,
} from 'lucide-react';

export default function MyTasksPage() {
  const router = useRouter();
  const { data: allTasks, isLoading } = useMyTasks();
  const updateStatusMutation = useUpdateTaskStatus();

  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [confirmingTaskId, setConfirmingTaskId] = useState<string | null>(null);

  if (isLoading) {
    return <Spinner centered size="lg" label="Chargement de vos taches..." />;
  }

  console.log('My tasks loaded:', allTasks?.length || 0, 'tasks');

  // Filter + sort tasks (DOING en premier, puis TODO, puis DONE)
  const statusOrder: Record<string, number> = { DOING: 0, TODO: 1, DONE: 2 };
  let filteredTasks = allTasks || [];
  if (filterStatus) {
    filteredTasks = filteredTasks.filter((t) => t.status === filterStatus);
  }
  if (filterPriority) {
    filteredTasks = filteredTasks.filter((t) => t.priority === filterPriority);
  }
  filteredTasks = [...filteredTasks].sort((a, b) => {
    const sa = statusOrder[a.status] ?? 99;
    const sb = statusOrder[b.status] ?? 99;
    if (sa !== sb) return sa - sb;
    // Même statut : par deadline croissante (sans deadline en dernier)
    if (a.deadline && b.deadline) {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return 0;
  });

  const tasksByStatus = {
    TODO: allTasks?.filter((t) => t.status === 'TODO').length || 0,
    DOING: allTasks?.filter((t) => t.status === 'DOING').length || 0,
    DONE: allTasks?.filter((t) => t.status === 'DONE').length || 0,
  };

  const totalTasks = allTasks?.length || 0;
  const overdueTasks = allTasks?.filter(
    (t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'DONE'
  ).length || 0;

  const handleStatusChange = async (
    taskId: string,
    newStatus: string,
    currentStatus: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    // Demander confirmation pour passer de DOING à DONE
    if (currentStatus === 'DOING' && newStatus === 'DONE') {
      setConfirmingTaskId(taskId);
      return;
    }

    // Procéder au changement de statut
    await performStatusChange(taskId, newStatus);
  };

  const performStatusChange = async (taskId: string, newStatus: string) => {
    if (newStatus !== 'TODO') {
      try {
        const fullTask = await tasksApi.getTaskById(taskId);
        const blockedBy = fullTask.blockedBy || [];

        if (blockedBy.length > 0) {
          const blockerIds = blockedBy
            .map((dep) => dep.blockingTaskId || dep.taskId)
            .filter((id): id is string => !!id);
          const blockerStatuses = await Promise.all(
            blockerIds.map((id) => tasksApi.getTaskById(id))
          );
          const unfinished = blockerStatuses.filter((t) => t.status !== 'DONE');

          if (unfinished.length > 0) {
            const names = unfinished.map((t) => t.title).join(', ');
            toast.error(`Tâche bloquée par "${names}" qui n'est pas terminée`);
            return;
          }
        }
      } catch {
        // Si le fetch echoue, on laisse passer et le backend decidera
      }
    }

    updateStatusMutation.mutate(
      { taskId, status: { status: newStatus } as any },
      {
        onError: (err) => {
          toast.error(getApiError(err), { title: 'Échec changement statut' });
        },
      }
    );
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return { label: 'Critique', color: 'bg-critical/10 text-critical border-critical/20' };
      case 'HIGH':
        return { label: 'Haute', color: 'bg-warning/10 text-warning border-warning/20' };
      case 'MEDIUM':
        return { label: 'Moyenne', color: 'bg-primary/10 text-primary border-primary/20' };
      case 'LOW':
        return { label: 'Basse', color: 'bg-text-weak/10 text-text-secondary border-border' };
      default:
        return { label: priority, color: 'bg-border text-text-secondary' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'TODO':
        return { label: 'A faire', color: 'bg-warning/10 text-warning', icon: ListTodo };
      case 'DOING':
        return { label: 'En cours', color: 'bg-primary/10 text-primary', icon: Play };
      case 'DONE':
        return { label: 'Terminee', color: 'bg-success/10 text-success', icon: CheckCircle2 };
      default:
        return { label: status, color: 'bg-border', icon: ListTodo };
    }
  };

  const isOverdue = (deadline: string | undefined, status: string) => {
    return deadline && new Date(deadline) < new Date() && status !== 'DONE';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ClipboardList className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Mes taches</h1>
          <p className="text-text-secondary text-sm">
            {totalTasks} tache{totalTasks !== 1 ? 's' : ''} assignee{totalTasks !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className={`p-4 cursor-pointer transition-all ${
            filterStatus === 'TODO' ? 'ring-2 ring-warning' : 'hover:shadow-md'
          }`}
          onClick={() => setFilterStatus(filterStatus === 'TODO' ? null : 'TODO')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <ListTodo className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warning">{tasksByStatus.TODO}</p>
              <p className="text-xs text-text-secondary">A faire</p>
            </div>
          </div>
        </Card>
        <Card
          className={`p-4 cursor-pointer transition-all ${
            filterStatus === 'DOING' ? 'ring-2 ring-primary' : 'hover:shadow-md'
          }`}
          onClick={() => setFilterStatus(filterStatus === 'DOING' ? null : 'DOING')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Play className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{tasksByStatus.DOING}</p>
              <p className="text-xs text-text-secondary">En cours</p>
            </div>
          </div>
        </Card>
        <Card
          className={`p-4 cursor-pointer transition-all ${
            filterStatus === 'DONE' ? 'ring-2 ring-success' : 'hover:shadow-md'
          }`}
          onClick={() => setFilterStatus(filterStatus === 'DONE' ? null : 'DONE')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{tasksByStatus.DONE}</p>
              <p className="text-xs text-text-secondary">Terminees</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${overdueTasks > 0 ? 'bg-critical/10' : 'bg-bg-surface-hover'}`}>
              <AlertCircle className={`w-5 h-5 ${overdueTasks > 0 ? 'text-critical' : 'text-text-weak'}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${overdueTasks > 0 ? 'text-critical' : 'text-text-weak'}`}>{overdueTasks}</p>
              <p className="text-xs text-text-secondary">En retard</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Filter className="w-4 h-4" />
            <span>Priorite :</span>
          </div>
          <div className="flex gap-2">
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => {
              const config = getPriorityConfig(p);
              return (
                <button
                  key={p}
                  onClick={() => setFilterPriority(filterPriority === p ? null : p)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
                    filterPriority === p
                      ? config.color + ' ring-1 ring-current'
                      : 'bg-bg-surface-hover text-text-secondary border-border hover:bg-bg-surface'
                  }`}
                >
                  {config.label}
                </button>
              );
            })}
          </div>
          {(filterStatus || filterPriority) && (
            <button
              onClick={() => {
                setFilterStatus(null);
                setFilterPriority(null);
              }}
              className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 ml-auto"
            >
              <X className="w-3 h-3" />
              Reinitialiser
            </button>
          )}
        </div>
      </Card>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <ClipboardList className="w-12 h-12 text-text-weak mx-auto mb-4" />
            <p className="text-text-secondary">
              {filterStatus || filterPriority
                ? 'Aucune tache ne correspond aux filtres'
                : 'Aucune tache assignee'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const statusConfig = getStatusConfig(task.status);
            const priorityConfig = getPriorityConfig(task.priority);
            const overdue = isOverdue(task.deadline, task.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card
                key={task.id}
                className="p-4 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => router.push(`/projects/${task.projectId}/tasks/${task.id}`)}
              >
                <div className="flex items-start gap-4">
                  {/* Status icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${statusConfig.color}`}>
                    <StatusIcon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors truncate">
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-xs text-text-secondary mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-text-weak group-hover:text-primary transition-colors shrink-0 mt-1" />
                    </div>

                    {/* Metadata row */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${priorityConfig.color}`}>
                        {priorityConfig.label}
                      </span>
                      {task.deadline && (
                        <span className={`text-xs flex items-center gap-1 ${
                          overdue ? 'text-critical font-medium' : 'text-text-secondary'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          {new Date(task.deadline).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                          {overdue && ' (en retard)'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    {task.status === 'TODO' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => handleStatusChange(task.id, 'DOING', task.status, e as any)}
                        isLoading={updateStatusMutation.isPending}
                        className="flex items-center gap-1.5 text-primary border-primary/30 hover:bg-primary/10"
                      >
                        <Play className="w-3 h-3" />
                        Commencer
                      </Button>
                    )}
                    {task.status === 'DOING' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => handleStatusChange(task.id, 'DONE', task.status, e as any)}
                        isLoading={updateStatusMutation.isPending}
                        className="flex items-center gap-1.5 text-success border-success/30 hover:bg-success/10"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Terminer
                      </Button>
                    )}
                    {task.status === 'DONE' && (
                      <span className="text-xs text-success font-medium flex items-center gap-1 px-3 py-1.5">
                        <CheckCircle2 className="w-3 h-3" />
                        Terminee
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for completing task */}
      <Modal
        isOpen={!!confirmingTaskId}
        onClose={() => setConfirmingTaskId(null)}
        title="Confirmer la tâche"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmingTaskId(null)}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (confirmingTaskId) {
                  performStatusChange(confirmingTaskId, 'DONE');
                  setConfirmingTaskId(null);
                }
              }}
              isLoading={updateStatusMutation.isPending}
            >
              Confirmer
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Êtes-vous sûr de vouloir marquer cette tâche comme terminée ? Manipuler les tâches est très sensible et cette action ne peut pas être annulée facilement.
          </p>
          {confirmingTaskId && (
            <div className="p-3 bg-bg-surface-hover rounded-lg border border-border">
              <p className="text-sm text-text-primary font-medium">
                {allTasks?.find((t) => t.id === confirmingTaskId)?.title}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
