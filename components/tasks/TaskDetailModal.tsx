'use client';

import { useState } from 'react';
import { useTaskById, useUpdateTask, useDeleteTask, useAddTaskComment } from '@/lib/hooks/useTasks';
import { getApiError } from '@/lib/utils/api-error';
import { Priority, TaskStatus } from '@/lib/types/task.types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import { MessageSquare, Edit2 } from 'lucide-react';
import { toast } from '@/lib/stores/toast.store';

interface TaskDetailModalProps {
  taskId: string | null;
  onClose: () => void;
}

export default function TaskDetailModal({ taskId, onClose }: TaskDetailModalProps) {
  const { data: task, isLoading, error } = useTaskById(taskId);
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();
  const addCommentMutation = useAddTaskComment();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    priority: Priority.MEDIUM,
    deadline: '',
    startDate: '',
    endDate: '',
    optimisticDays: '',
    probableDays: '',
    pessimisticDays: '',
  });
  const [commentText, setCommentText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!taskId) return null;

  if (isLoading) {
    return (
      <Modal isOpen={!!taskId} onClose={onClose} title="Chargement...">
        <Spinner centered size="lg" />
      </Modal>
    );
  }

  if (error || !task) {
    return (
      <Modal isOpen={!!taskId} onClose={onClose} title="Erreur">
        <p className="text-sm text-text-secondary">
          Impossible de charger la tâche
        </p>
      </Modal>
    );
  }

  const handleEditStart = () => {
    setEditData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      deadline: task.deadline ? task.deadline.split('T')[0] : '',
      startDate: task.startDate ? task.startDate.split('T')[0] : '',
      endDate: task.endDate ? task.endDate.split('T')[0] : '',
      optimisticDays: task.optimisticDays?.toString() || '',
      probableDays: task.probableDays?.toString() || '',
      pessimisticDays: task.pessimisticDays?.toString() || '',
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editData.title.trim()) {
      toast.error('Le titre est obligatoire');
      return;
    }

    const updatePayload: any = {
      title: editData.title,
      description: editData.description || undefined,
      priority: editData.priority,
      deadline: editData.deadline || undefined,
      startDate: editData.startDate || undefined,
      endDate: editData.endDate || undefined,
      optimisticDays: editData.optimisticDays ? parseInt(editData.optimisticDays) : undefined,
      probableDays: editData.probableDays ? parseInt(editData.probableDays) : undefined,
      pessimisticDays: editData.pessimisticDays ? parseInt(editData.pessimisticDays) : undefined,
    };

    updateMutation.mutate(
      { taskId, data: updatePayload },
      {
        onSuccess: () => {
          toast.success('Tâche mise à jour');
          setIsEditing(false);
        },
        onError: (error) => {
          toast.error(getApiError(error), { title: 'Échec' });
        },
      }
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(taskId, {
      onSuccess: () => {
        onClose();
      },
      onError: (error) => {
        toast.error(getApiError(error), { title: 'Échec' });
      },
    });
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addCommentMutation.mutate(
      { taskId, content: commentText },
      {
        onSuccess: () => {
          setCommentText('');
        },
        onError: (error) => {
          toast.error(getApiError(error), { title: 'Échec' });
        },
      }
    );
  };

  return (
    <Modal
      isOpen={!!taskId}
      onClose={onClose}
      title="Détail de la tâche"
      size="lg"
      footer={
        <div className="flex justify-between">
          {showDeleteConfirm ? (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                isLoading={deleteMutation.isPending}
              >
                ✓ Confirmer suppression
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Annuler
              </Button>
            </>
          ) : isEditing ? (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Supprimer
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  isLoading={updateMutation.isPending}
                >
                  Enregistrer
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Supprimer
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={onClose}>
                  Fermer
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleEditStart}
                  className="flex items-center gap-1.5"
                >
                  <Edit2 className="w-4 h-4" />
                  Éditer
                </Button>
              </div>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {isEditing ? (
          <form className="space-y-4">
            <Input
              label="Titre"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            />

            <Textarea
              label="Description (optionnel)"
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            />

            <Select
              label="Priorité"
              value={editData.priority}
              onChange={(e) => setEditData({ ...editData, priority: e.target.value as Priority })}
              options={[
                { value: Priority.LOW, label: 'Basse' },
                { value: Priority.MEDIUM, label: 'Moyenne' },
                { value: Priority.HIGH, label: 'Haute' },
                { value: Priority.CRITICAL, label: 'Critique' },
              ]}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Date de début (optionnel)"
                type="date"
                value={editData.startDate}
                onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
              />
              <Input
                label="Date de fin (optionnel)"
                type="date"
                value={editData.endDate}
                onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
              />
            </div>

            <Input
              label="Deadline (optionnel)"
              type="date"
              value={editData.deadline}
              onChange={(e) => setEditData({ ...editData, deadline: e.target.value })}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">PERT (optionnel)</label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  label="Optimiste"
                  type="number"
                  placeholder="jours"
                  value={editData.optimisticDays}
                  onChange={(e) => setEditData({ ...editData, optimisticDays: e.target.value })}
                />
                <Input
                  label="Probable"
                  type="number"
                  placeholder="jours"
                  value={editData.probableDays}
                  onChange={(e) => setEditData({ ...editData, probableDays: e.target.value })}
                />
                <Input
                  label="Pessimiste"
                  type="number"
                  placeholder="jours"
                  value={editData.pessimisticDays}
                  onChange={(e) => setEditData({ ...editData, pessimisticDays: e.target.value })}
                />
              </div>
            </div>
          </form>
        ) : (
          <>
            {/* Title */}
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                {task.title}
              </h2>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-text-secondary text-xs">Priorité</p>
                <p className="text-text-primary font-medium">{task.priority}</p>
              </div>
              <div>
                <p className="text-text-secondary text-xs">Statut</p>
                <p className="text-text-primary font-medium">{task.status}</p>
              </div>
              {task.deadline && (
                <div>
                  <p className="text-text-secondary text-xs">Deadline</p>
                  <p className="text-text-primary font-medium">
                    {new Date(task.deadline).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
              {(task.assignedUsers?.length || 0) > 0 && (
                <div>
                  <p className="text-text-secondary text-xs">Assignés</p>
                  <p className="text-text-primary font-medium text-xs">
                    {(task.assignedUsers || [])
                      .map((u) => `${u.firstName} ${u.lastName}`)
                      .join(', ')}
                  </p>
                </div>
              )}
              {task.startDate && (
                <div>
                  <p className="text-text-secondary text-xs">Début</p>
                  <p className="text-text-primary font-medium">
                    {new Date(task.startDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
              {task.endDate && (
                <div>
                  <p className="text-text-secondary text-xs">Fin</p>
                  <p className="text-text-primary font-medium">
                    {new Date(task.endDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {task.description && (
              <div>
                <p className="text-text-secondary text-xs mb-1">Description</p>
                <p className="text-text-primary text-sm">{task.description}</p>
              </div>
            )}

            {/* PERT */}
            {(task.optimisticDays || task.probableDays || task.pessimisticDays) && (
              <div className="bg-bg-surface-hover p-4 rounded-lg">
                <p className="text-text-secondary text-xs mb-2">PERT</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {task.optimisticDays && (
                    <div>
                      <p className="text-text-secondary text-xs">Optimiste</p>
                      <p className="text-text-primary font-medium">{task.optimisticDays}j</p>
                    </div>
                  )}
                  {task.probableDays && (
                    <div>
                      <p className="text-text-secondary text-xs">Probable</p>
                      <p className="text-text-primary font-medium">{task.probableDays}j</p>
                    </div>
                  )}
                  {task.pessimisticDays && (
                    <div>
                      <p className="text-text-secondary text-xs">Pessimiste</p>
                      <p className="text-text-primary font-medium">{task.pessimisticDays}j</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Comments */}
        <div className="border-t border-border pt-4">
          <h3 className="font-semibold text-text-primary mb-3">
            Commentaires
          </h3>

          {/* Comment list */}
          <div className="space-y-3 mb-4 max-h-[200px] overflow-y-auto">
            {(task.comments?.length || 0) === 0 ? (
              <p className="text-sm text-text-weak">Aucun commentaire</p>
            ) : (
              (task.comments || []).map((comment) => (
                <div key={comment.id} className="text-sm">
                  <p className="text-text-secondary text-xs">
                    {comment.user.firstName} {comment.user.lastName} •{' '}
                    {new Date(comment.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-text-primary">{comment.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Add comment */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ajouter un commentaire..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && commentText.trim()) handleAddComment();
              }}
              className="flex-1 text-sm border border-border rounded bg-bg-surface text-text-primary px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button
              size="sm"
              onClick={handleAddComment}
              isLoading={addCommentMutation.isPending}
              className="flex items-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4" />
              Commenter
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
