'use client';

import { useState } from 'react';
import { useTaskById, useUpdateTask, useDeleteTask, useAddTaskComment } from '@/lib/hooks/useTasks';
import { getApiError } from '@/lib/utils/api-error';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';

interface TaskDetailModalProps {
  taskId: string | null;
  onClose: () => void;
}

export default function TaskDetailModal({ taskId, onClose }: TaskDetailModalProps) {
  const { data: task, isLoading, error } = useTaskById(taskId);
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();
  const addCommentMutation = useAddTaskComment();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [commentText, setCommentText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

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
        <Alert
          type="error"
          title="Erreur"
          message="Impossible de charger la tâche"
        />
      </Modal>
    );
  }

  console.log('📊 TaskDetail opened:', taskId);

  const handleEditField = (field: string, value: string) => {
    if (field === 'title') {
      console.log('📡 Updating task field: title =', value);
      updateMutation.mutate(
        { taskId, data: { title: value } },
        {
          onSuccess: () => {
            console.log('✅ Task updated:', taskId);
            setEditingField(null);
          },
          onError: (error) => {
            console.error('❌ Update failed:', getApiError(error));
            setApiError(getApiError(error));
          },
        }
      );
    }
  };

  const handleDelete = () => {
    console.log('🗑️ Delete confirmed for task:', taskId);
    deleteMutation.mutate(taskId, {
      onSuccess: () => {
        console.log('✅ Task deleted successfully');
        onClose();
      },
      onError: (error) => {
        console.error('❌ Delete failed:', getApiError(error));
        setApiError(getApiError(error));
      },
    });
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    console.log('💬 Adding comment to task:', taskId);
    addCommentMutation.mutate(
      { taskId, content: commentText },
      {
        onSuccess: () => {
          console.log('✅ Comment added');
          setCommentText('');
        },
        onError: (error) => {
          console.error('❌ Comment failed:', getApiError(error));
          setApiError(getApiError(error));
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
          ) : (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                🗑️ Supprimer
              </Button>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Fermer
              </Button>
            </>
          )}
        </div>
      }
    >
      {apiError && (
        <Alert
          type="error"
          title="Erreur"
          message={apiError}
          onClose={() => setApiError(null)}
        />
      )}

      <div className="space-y-6">
        {/* Title */}
        <div>
          {editingField === 'title' ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleEditField('title', editValue)}
              autoFocus
              className="text-lg font-bold border-b border-[var(--primary)] bg-transparent text-[var(--text-primary)] w-full"
            />
          ) : (
            <h2
              className="text-lg font-bold cursor-pointer hover:underline text-[var(--text-primary)]"
              onClick={() => {
                setEditingField('title');
                setEditValue(task.title);
              }}
            >
              {task.title}
            </h2>
          )}
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[var(--text-secondary)] text-xs">Priorité</p>
            <p className="text-[var(--text-primary)] font-medium">{task.priority}</p>
          </div>
          <div>
            <p className="text-[var(--text-secondary)] text-xs">Statut</p>
            <p className="text-[var(--text-primary)] font-medium">{task.status}</p>
          </div>
          {task.deadline && (
            <div>
              <p className="text-[var(--text-secondary)] text-xs">Deadline</p>
              <p className="text-[var(--text-primary)] font-medium">
                {new Date(task.deadline).toLocaleDateString('fr-FR')}
              </p>
            </div>
          )}
          {task.assignedUsers.length > 0 && (
            <div>
              <p className="text-[var(--text-secondary)] text-xs">Assignés</p>
              <p className="text-[var(--text-primary)] font-medium text-xs">
                {task.assignedUsers
                  .map((u) => `${u.firstName} ${u.lastName}`)
                  .join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <div>
            <p className="text-[var(--text-secondary)] text-xs mb-1">Description</p>
            <p className="text-[var(--text-primary)] text-sm">{task.description}</p>
          </div>
        )}

        {/* Comments */}
        <div className="border-t border-[var(--border)] pt-4">
          <h3 className="font-semibold text-[var(--text-primary)] mb-3">
            Commentaires
          </h3>

          {/* Comment list */}
          <div className="space-y-3 mb-4 max-h-[200px] overflow-y-auto">
            {task.comments.length === 0 ? (
              <p className="text-sm text-[var(--text-weak)]">Aucun commentaire</p>
            ) : (
              task.comments.map((comment) => (
                <div key={comment.id} className="text-sm">
                  <p className="text-[var(--text-secondary)] text-xs">
                    {comment.user.firstName} {comment.user.lastName} •{' '}
                    {new Date(comment.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-[var(--text-primary)]">{comment.content}</p>
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
              className="flex-1 text-sm border border-[var(--border)] rounded bg-[var(--bg-surface)] text-[var(--text-primary)] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <Button
              size="sm"
              onClick={handleAddComment}
              isLoading={addCommentMutation.isPending}
            >
              💬
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
