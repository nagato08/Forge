'use client';

import { useState } from 'react';
import { useMyTasks, useUpdateTaskStatus } from '@/lib/hooks';
import { getApiError } from '@/lib/utils/api-error';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

export default function MyTasksPage() {
  const { data: allTasks, isLoading } = useMyTasks();
  const updateStatusMutation = useUpdateTaskStatus();

  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  if (isLoading) {
    return <Spinner centered size="lg" label="Chargement de vos tâches..." />;
  }

  console.log('📋 My tasks loaded:', allTasks?.length || 0, 'tasks');

  // Filter tasks
  let filteredTasks = allTasks || [];
  if (filterStatus) {
    filteredTasks = filteredTasks.filter((t) => t.status === filterStatus);
  }
  if (filterPriority) {
    filteredTasks = filteredTasks.filter((t) => t.priority === filterPriority);
  }

  const tasksByStatus = {
    TODO: allTasks?.filter((t) => t.status === 'TODO').length || 0,
    DOING: allTasks?.filter((t) => t.status === 'DOING').length || 0,
    DONE: allTasks?.filter((t) => t.status === 'DONE').length || 0,
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    console.log('📝 Changing task status:', taskId, '→', newStatus);
    setApiError(null);

    updateStatusMutation.mutate(
      { taskId, status: { status: newStatus } as any },
      {
        onSuccess: () => {
          console.log('✅ Task status updated');
        },
        onError: (err) => {
          console.error('❌ Status update error:', getApiError(err));
          setApiError(getApiError(err));
        },
      }
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-critical/10 text-critical';
      case 'HIGH':
        return 'bg-warning/10 text-warning';
      case 'MEDIUM':
        return 'bg-primary/10 text-primary';
      case 'LOW':
        return 'bg-text-weak/10 text-text-secondary';
      default:
        return 'bg-border';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-warning/10 text-warning';
      case 'DOING':
        return 'bg-primary/10 text-primary';
      case 'DONE':
        return 'bg-success/10 text-success';
      default:
        return 'bg-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">
          📋 Mes tâches
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {filteredTasks.length} tâche(s) affichée(s)
        </p>
      </div>

      {/* Error Alert */}
      {apiError && (
        <Alert
          type="error"
          title="Erreur"
          message={apiError}
          onClose={() => setApiError(null)}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-xs text-text-secondary font-medium">À faire</p>
            <p className="text-2xl font-bold text-warning">{tasksByStatus.TODO}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-xs text-text-secondary font-medium">En cours</p>
            <p className="text-2xl font-bold text-primary">{tasksByStatus.DOING}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-xs text-text-secondary font-medium">Complétées</p>
            <p className="text-2xl font-bold text-success">{tasksByStatus.DONE}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-2">
            <Button
              variant={filterStatus === null ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilterStatus(null)}
            >
              Tous
            </Button>
            <Button
              variant={filterStatus === 'TODO' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilterStatus('TODO')}
            >
              À faire ({tasksByStatus.TODO})
            </Button>
            <Button
              variant={filterStatus === 'DOING' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilterStatus('DOING')}
            >
              En cours ({tasksByStatus.DOING})
            </Button>
            <Button
              variant={filterStatus === 'DONE' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilterStatus('DONE')}
            >
              Complétées ({tasksByStatus.DONE})
            </Button>
          </div>

          {filterPriority && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setFilterPriority(null)}
            >
              ✕ Réinitialiser priorité
            </Button>
          )}
        </div>
      </Card>

      {/* Tasks List */}
      <Card className="space-y-0 overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-text-secondary">
              {filterStatus
                ? `Aucune tâche avec le statut "${filterStatus}"`
                : 'Aucune tâche assignée'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 hover:bg-bg-surface-hover transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Task Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary">
                          {task.title}
                        </h3>
                        <p className="text-xs text-text-weak mt-1">
                          ID projet : {task.projectId}
                        </p>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                          task.status
                        )}`}
                      >
                        {task.status === 'TODO'
                          ? 'À faire'
                          : task.status === 'DOING'
                            ? 'En cours'
                            : 'Complétée'}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {task.priority === 'CRITICAL'
                          ? 'Critique'
                          : task.priority === 'HIGH'
                            ? 'Haute'
                            : task.priority === 'MEDIUM'
                              ? 'Moyenne'
                              : 'Basse'}
                      </span>
                      {task.deadline && (
                        <span className="text-xs text-text-secondary">
                          📅{' '}
                          {new Date(task.deadline).toLocaleDateString(
                            'fr-FR'
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Buttons */}
                  <div className="flex gap-2">
                    {task.status !== 'DONE' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const nextStatus =
                            task.status === 'TODO' ? 'DOING' : 'DONE';
                          handleStatusChange(task.id, nextStatus);
                        }}
                        isLoading={updateStatusMutation.isPending}
                      >
                        {task.status === 'TODO' ? '▶️ Commencer' : '✓ Terminer'}
                      </Button>
                    )}
                    {task.status === 'DONE' && (
                      <span className="text-sm text-success font-semibold px-2 py-1">
                        ✓ Complétée
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {task.description && (
                  <p className="text-xs text-text-secondary mt-3 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
