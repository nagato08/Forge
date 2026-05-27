/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useTaskById,
  useTasks,
  useUpdateTask,
  useDeleteTask,
  useUpdateTaskStatus,
  useAssignTask,
  useUnassignTask,
  useAddTaskDependency,
  useRemoveTaskDependency,
  useAddTaskComment,
  useDeleteTaskComment,
} from '@/lib/hooks/useTasks';
import { useUsers } from '@/lib/hooks/useAuth';
import { TaskStatus, Priority, TaskAssignment } from '@/lib/types/task.types';
import { getApiError } from '@/lib/utils/api-error';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import { toast } from '@/lib/stores/toast.store';
import {
  ArrowLeft,
  Edit2,
  Check,
  CheckCircle2,
  X,
  Trash2,
  UserPlus,
  Link2,
  MessageSquare,
  AlertTriangle,
  Calendar,
  Zap,
} from 'lucide-react';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;
  const projectId = params.id as string;

  const { data: task, isLoading: isLoadingTask, error: errorTask, refetch: refetchTask } = useTaskById(taskId);
  const { data: projectTasks } = useTasks(projectId);
  const { data: allUsers } = useUsers();

  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();
  const updateStatusMutation = useUpdateTaskStatus();
  const assignMutation = useAssignTask();
  const unassignMutation = useUnassignTask();
  const addDependencyMutation = useAddTaskDependency();
  const removeDependencyMutation = useRemoveTaskDependency();
  const addCommentMutation = useAddTaskComment();
  const deleteCommentMutation = useDeleteTaskComment();

  // Edit states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAddDependencyModal, setShowAddDependencyModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  // Form states
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedDependencyId, setSelectedDependencyId] = useState('');
  const [commentText, setCommentText] = useState('');

  if (isLoadingTask) return <Spinner centered size="lg" label="Chargement de la tâche..." />;
  if (errorTask || !task) {
    return <div className="p-6 text-text-secondary">Impossible de charger la tâche</div>;
  }

  console.log('📋 Task detail data:', taskId, 'assignments:', JSON.stringify(task.assignments), 'keys:', Object.keys(task));
  console.log('📋 blockedBy structure:', JSON.stringify(task.blockedBy));
  // Backend retourne 'assignments', pas 'assignedUsers'
  const assignedUsers = task.assignments?.map((a: TaskAssignment) => a.user) || [];
  const comments = task.comments || [];
  const blockedBy = task.blockedBy || [];

  // Edit handlers
  const handleEditStart = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value || '');
  };

  const handleEditSave = (field: string, value?: string | number) => {
    const updateData: Record<string, any> = {};
    // Utiliser la valeur passée en paramètre ou editValue
    updateData[field] = value !== undefined ? value : editValue;

    console.log(`Updating task field: ${field} =`, updateData[field]);
    updateMutation.mutate(
      { taskId, data: updateData },
      {
        onSuccess: async () => {
          console.log(`Task ${field} updated, refetching...`);
          await refetchTask();
          setEditingField(null);
          setEditValue('');
        },
        onError: (err) => {
          console.error(`Update failed:`, getApiError(err));
          toast.error(getApiError(err), { title: 'Échec' });
        },
      }
    );
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    // Si on veut marquer comme DONE, afficher une confirmation
    if (newStatus === TaskStatus.DONE) {
      setShowCompleteConfirm(true);
      return;
    }

    // Verifier les dependances : si des bloqueurs ne sont pas DONE, empecher DOING/DONE
    if (newStatus !== TaskStatus.TODO && blockedBy.length > 0) {
      const unblockedTasks = blockedBy
        .map((dep) => {
          const blocker = projectTasks?.find((t) => t.id === (dep.blockingTaskId || dep.taskId));
          return blocker;
        })
        .filter((t) => t && t.status !== TaskStatus.DONE);

      if (unblockedTasks.length > 0) {
        const names = unblockedTasks.map((t) => t!.title).join(', ');
        toast.error(`Impossible de changer le statut : cette tache est bloquee par "${names}" qui n'est pas encore terminee`);
        return;
      }
    }

    console.log(`Changing status: ${task.status} -> ${newStatus}`);
    updateStatusMutation.mutate(
      { taskId, status: { status: newStatus } },
      {
        onSuccess: async () => {
          console.log(`Status updated to ${newStatus}, refetching...`);
          await refetchTask();
        },
        onError: (err) => {
          console.error('Status update failed:', getApiError(err));
          toast.error(getApiError(err), { title: 'Échec' });
        },
      }
    );
  };

  const handleConfirmComplete = () => {
    console.log(`Confirming completion of task ${taskId}`);
    setShowCompleteConfirm(false);
    updateStatusMutation.mutate(
      { taskId, status: { status: TaskStatus.DONE } },
      {
        onSuccess: async () => {
          console.log('Task marked as DONE');
          await refetchTask();
        },
        onError: (err) => {
          console.error('Status update failed:', getApiError(err));
          toast.error(getApiError(err), { title: 'Échec' });
        },
      }
    );
  };

  const handleAssignUser = () => {
    if (!selectedUserId) {
      toast.error('Veuillez sélectionner un utilisateur');
      return;
    }

    console.log(` Assigning user ${selectedUserId} to task ${taskId}`);

    assignMutation.mutate(
      { taskId, userIds: [...assignedUsers.map((u) => u.id), selectedUserId] },
      {
        onSuccess: async () => {
          console.log('User assigned, refetching task...');
          await refetchTask();
          setShowAssignModal(false);
          setSelectedUserId('');
        },
        onError: (err) => {
          console.error('Assign failed:', getApiError(err));
          toast.error(getApiError(err), { title: 'Échec' });
        },
      }
    );
  };

  const handleUnassignUser = (userId: string) => {
    console.log(`Unassigning user ${userId} from task ${taskId}`);
    unassignMutation.mutate(
      { taskId, userId },
      {
        onSuccess: async () => {
          console.log('User unassigned, refetching task...');
          await refetchTask();
        },
        onError: (err) => {
          console.error('Unassign failed:', getApiError(err));
          toast.error(getApiError(err), { title: 'Échec' });
        },
      }
    );
  };

  const handleAddDependency = () => {
    if (!selectedDependencyId) {
      toast.error('Veuillez sélectionner une tâche');
      return;
    }

    // API: POST /tasks/:selectedId/dependencies { blockedTaskId: taskId }
    // selectedDependencyId bloque notre tâche (taskId)
    console.log(`Adding dependency: ${selectedDependencyId} blocks ${taskId}`);

    addDependencyMutation.mutate(
      { taskId: selectedDependencyId, blockedTaskId: taskId },
      {
        onSuccess: async () => {
          console.log('Dependency added, refetching task...');
          await refetchTask();
          setShowAddDependencyModal(false);
          setSelectedDependencyId('');
        },
        onError: (err) => {
          console.error('Dependency add failed:', getApiError(err));
          toast.error(getApiError(err), { title: 'Échec' });
        },
      }
    );
  };

  const handleRemoveDependency = (blockingTaskId: string | null | undefined) => {
    if (!blockingTaskId) {
      toast.error('ID de tâche bloquante invalide');
      return;
    }
    // API: DELETE /tasks/:blockingTaskId/dependencies/:blockedTaskId
    // blockingTaskId bloque notre tâche (taskId)
    console.log(`Removing dependency: ${blockingTaskId} no longer blocks ${taskId}`);
    removeDependencyMutation.mutate(
      { taskId: blockingTaskId, blockedTaskId: taskId },
      {
        onSuccess: async () => {
          console.log('Dependency removed, refetching task...');
          await refetchTask();
        },
        onError: (err) => {
          console.error('Dependency remove failed:', getApiError(err));
          toast.error(getApiError(err), { title: 'Échec' });
        },
      }
    );
  };

  const handleAddComment = () => {
    if (!commentText.trim()) {
      toast.error('Veuillez entrer un commentaire');
      return;
    }

    console.log(`Adding comment to task ${taskId}`);

    addCommentMutation.mutate(
      { taskId, content: commentText },
      {
        onSuccess: async () => {
          console.log('Comment added, refetching...');
          await refetchTask();
          setCommentText('');
        },
        onError: (err) => {
          console.error('Comment add failed:', getApiError(err));
          toast.error(getApiError(err), { title: 'Échec' });
        },
      }
    );
  };

  const handleDeleteTask = () => {
    console.log(` Deleting task ${taskId}`);
    deleteMutation.mutate(taskId, {
      onSuccess: () => {
        console.log(' Task deleted');
        router.push(`/projects/${projectId}/kanban`);
      },
      onError: (err) => {
        console.error(' Delete failed:', getApiError(err));
        toast.error(getApiError(err), { title: 'Échec' });
      },
    });
  };

  const statusOptions = [TaskStatus.TODO, TaskStatus.DOING, TaskStatus.DONE];
  const priorityOptions = [Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL];
  const availableUsers = allUsers?.filter((u) => !assignedUsers.find((a) => a.id === u.id)) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
      </div>

      {/* Title + Status + Priority */}
      <Card className="p-6 space-y-4">
        <div className="space-y-3">
          {editingField === 'title' ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleEditSave('title')}
                isLoading={updateMutation.isPending}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditingField(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl font-bold text-text-primary">{task.title}</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditStart('title', task.title)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Status + Priority row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Statut:</span>
            <div className="flex gap-1">
              {statusOptions.map((status) => (
                <Button
                  key={status}
                  variant={task.status === status ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => handleStatusChange(status)}
                  isLoading={updateStatusMutation.isPending}
                >
                  {status === TaskStatus.TODO
                    ? 'À faire'
                    : status === TaskStatus.DOING
                      ? 'En cours'
                      : 'Fait'}
                </Button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Priorité:</span>
            <select
              value={task.priority}
              onChange={(e) => handleEditSave('priority')}
              className="px-3 py-1.5 text-sm border border-border rounded-lg bg-bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {priorityOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Description + Meta */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Description + Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-3">Description</h2>
            {editingField === 'description' ? (
              <div className="space-y-2">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={4}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleEditSave('description')}
                    isLoading={updateMutation.isPending}
                  >
                    Enregistrer
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingField(null)}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-text-primary whitespace-pre-wrap">
                  {task.description || 'Pas de description'}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditStart('description', task.description || '')}
                  className="text-text-secondary"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Éditer
                </Button>
              </div>
            )}
          </Card>

          {/* Dates + PERT + Story Points */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-3">Détails</h2>
            <div className="space-y-3">
              {/* Deadline */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Deadline:</span>
                <input
                  type="date"
                  value={task.deadline?.split('T')[0] || ''}
                  onChange={(e) => handleEditSave('deadline', e.target.value)}
                  className="px-2 py-1 text-sm border border-border rounded bg-bg-surface text-text-primary"
                />
              </div>

              {/* Gantt Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-secondary">Début (Gantt):</label>
                  <input
                    type="date"
                    value={task.startDate?.split('T')[0] || ''}
                    onChange={(e) => handleEditSave('startDate', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-border rounded bg-bg-surface text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary">Fin (Gantt):</label>
                  <input
                    type="date"
                    value={task.endDate?.split('T')[0] || ''}
                    onChange={(e) => handleEditSave('endDate', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-border rounded bg-bg-surface text-text-primary"
                  />
                </div>
              </div>

              {/* Story Points */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  Story Points:
                </span>
                <input
                  type="number"
                  value={task.storyPoints || ''}
                  onChange={(e) => handleEditSave('storyPoints', parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-sm border border-border rounded bg-bg-surface text-text-primary"
                  min="0"
                />
              </div>

              {/* PERT */}
              <div className="border-t border-border pt-3 space-y-2">
                <p className="text-xs font-medium text-text-secondary">PERT (jours)</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-text-secondary">Optimiste:</label>
                    <input
                      type="number"
                      value={task.optimisticDays || ''}
                      onChange={(e) => handleEditSave('optimisticDays', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-sm border border-border rounded bg-bg-surface text-text-primary"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary">Probable:</label>
                    <input
                      type="number"
                      value={task.probableDays || ''}
                      onChange={(e) => handleEditSave('probableDays', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-sm border border-border rounded bg-bg-surface text-text-primary"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary">Pessimiste:</label>
                    <input
                      type="number"
                      value={task.pessimisticDays || ''}
                      onChange={(e) => handleEditSave('pessimisticDays', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-sm border border-border rounded bg-bg-surface text-text-primary"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Commentaires */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Commentaires ({comments.length})
              </h2>
            </div>

            {/* Comment List */}
            <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-sm text-text-secondary">Aucun commentaire</p>
              ) : (
                (comments || []).map((comment) => (
                  <div key={comment.id} className="p-3 bg-bg-surface-hover rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-text-primary">
                        {comment.user?.firstName} {comment.user?.lastName}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCommentMutation.mutate(comment.id)}
                        isLoading={deleteCommentMutation.isPending}
                        className="text-critical"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-text-primary">{comment.content}</p>
                    <p className="text-xs text-text-weak">
                      {new Date(comment.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment */}
            <div className="space-y-2 border-t border-border pt-3">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Ajouter un commentaire..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                rows={2}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddComment}
                isLoading={addCommentMutation.isPending}
                className="flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Commenter
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: Assignés + Dépendances */}
        <div className="space-y-6">
          {/* Assignés */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Assignés</h2>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAssignModal(true)}
                className="flex items-center gap-1"
              >
                <UserPlus className="w-4 h-4" />
                Ajouter
              </Button>
            </div>

            <div className="space-y-2">
              {assignedUsers.length === 0 ? (
                <p className="text-sm text-text-secondary">Aucun assigné</p>
              ) : (
                assignedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 bg-bg-surface-hover rounded"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                        {user.firstName[0]}
                      </div>
                      <span className="text-sm text-text-primary">
                        {user.firstName} {user.lastName}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnassignUser(user.id)}
                      isLoading={unassignMutation.isPending}
                      className="text-critical"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Dépendances */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Bloquée par
              </h2>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddDependencyModal(true)}
                className="flex items-center gap-1"
              >
                <Link2 className="w-4 h-4" />
                Ajouter
              </Button>
            </div>

            <div className="space-y-2">
              {blockedBy.length === 0 ? (
                <p className="text-sm text-text-secondary">Aucune dépendance</p>
              ) : (
                blockedBy
                  .filter((dep) => !!(dep.blockingTaskId || dep.taskId))
                  .map((dep) => {
                    // dep.blockingTaskId = le bloqueur, dep.blockedTaskId = notre tâche
                    const blockingTaskId = dep.blockingTaskId || dep.taskId || '';
                    const blockerTask =
                      projectTasks?.find((t) => t.id === blockingTaskId) || dep.blockingTask;
                    return (
                      <div
                        key={dep.id}
                        className="flex items-center justify-between p-2 bg-bg-surface-hover rounded text-sm"
                      >
                        <span className="text-text-primary truncate">
                          {blockerTask?.title || blockingTaskId}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDependency(blockingTaskId)}
                          isLoading={removeDependencyMutation.isPending}
                          className="text-critical"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    );
                  })
              )}
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-6 border-critical/30 bg-critical/5">
            <h2 className="text-lg font-semibold text-critical mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Zone dangereuse
            </h2>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full text-critical hover:bg-critical/10 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer la tâche
            </Button>
          </Card>
        </div>
      </div>

      {/* Assign Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedUserId('');
        }}
        title="Assigner un utilisateur"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowAssignModal(false);
                setSelectedUserId('');
              }}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAssignUser}
              isLoading={assignMutation.isPending}
            >
              Assigner
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Sélectionnez un utilisateur</option>
            {availableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName}
              </option>
            ))}
          </select>
        </div>
      </Modal>

      {/* Add Dependency Modal */}
      <Modal
        isOpen={showAddDependencyModal}
        onClose={() => {
          setShowAddDependencyModal(false);
          setSelectedDependencyId('');
        }}
        title="Ajouter une dépendance"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowAddDependencyModal(false);
                setSelectedDependencyId('');
              }}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddDependency}
              isLoading={addDependencyMutation.isPending}
            >
              Ajouter
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            Sélectionnez la tâche qui bloque celle-ci
          </p>
          <select
            value={selectedDependencyId}
            onChange={(e) => setSelectedDependencyId(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Choisir une tâche...</option>
            {(projectTasks || [])
              .filter((t) => t.id !== taskId && !blockedBy.some((d) => d.blockedTaskId === t.id))
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.status})
                </option>
              ))}
          </select>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Supprimer la tâche"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)}>
              Annuler
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDeleteTask}
              isLoading={deleteMutation.isPending}
              className="bg-critical text-white hover:bg-critical/90"
            >
              Supprimer
            </Button>
          </div>
        }
      >
        <p className="text-text-primary">
          Êtes-vous sûr de vouloir supprimer la tâche <span className="font-semibold">{task.title}</span>?
        </p>
      </Modal>

      {/* Complete Task Confirmation Modal */}
      <Modal
        isOpen={showCompleteConfirm}
        onClose={() => setShowCompleteConfirm(false)}
        title="Marquer comme terminée"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowCompleteConfirm(false)}>
              Annuler
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmComplete}
              isLoading={updateStatusMutation.isPending}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmer
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-text-primary">
            Êtes-vous sûr que la tâche <span className="font-semibold">{task.title}</span> est complètement terminée?
          </p>
          <p className="text-sm text-text-secondary">
            Vous pourrez toujours changer le statut par la suite si nécessaire.
          </p>
        </div>
      </Modal>
    </div>
  );
}
