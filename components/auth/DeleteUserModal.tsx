'use client';

import { useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { toast } from '@/lib/stores/toast.store';
import { getApiError } from '@/lib/utils/api-error';
import { useUserImpact, useDeleteUser, useUsers } from '@/lib/hooks/useAuth';
import { AlertTriangle, FolderOpen, ListChecks, Users } from 'lucide-react';

interface DeleteUserModalProps {
  userId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DeleteUserModal({
  userId,
  onClose,
  onSuccess,
}: DeleteUserModalProps) {
  const isOpen = !!userId;
  const { data: impact, isLoading } = useUserImpact(userId);
  const { data: allUsers } = useUsers();
  const deleteMutation = useDeleteUser();

  const [reassignTo, setReassignTo] = useState('');

  const eligibleReplacements = useMemo(() => {
    if (!allUsers) return [];
    return allUsers.filter(
      (u) => u.id !== userId && u.role !== 'EMPLOYEE',
    );
  }, [allUsers, userId]);

  const hasImpact = !!impact?.hasImpact;

  const handleConfirm = () => {
    if (!userId) return;
    if (hasImpact && !reassignTo) {
      toast.error('Sélectionnez un utilisateur de remplacement');
      return;
    }
    deleteMutation.mutate(
      { userId, reassignTo: reassignTo || undefined },
      {
        onSuccess: () => {
          toast.success('Utilisateur supprimé avec succès');
          setReassignTo('');
          onSuccess?.();
          onClose();
        },
        onError: (err) => {
          toast.error(getApiError(err), { title: 'Échec suppression' });
        },
      },
    );
  };

  const handleClose = () => {
    setReassignTo('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Supprimer cet utilisateur"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleConfirm}
            isLoading={deleteMutation.isPending}
            disabled={isLoading || (hasImpact && !reassignTo)}
          >
            Confirmer la suppression
          </Button>
        </div>
      }
    >
      {isLoading || !impact ? (
        <Spinner centered size="md" label="Analyse de l'impact..." />
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-critical/10 border border-critical/30">
            <AlertTriangle className="w-5 h-5 text-critical shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-text-primary">
                Suppression de {impact.user.firstName} {impact.user.lastName}
              </p>
              <p className="text-text-secondary mt-1">{impact.user.email}</p>
            </div>
          </div>

          {!hasImpact ? (
            <p className="text-sm text-text-secondary">
              Aucun projet ni tâche assigné à cet utilisateur. La suppression
              peut se faire sans réassignation.
            </p>
          ) : (
            <>
              <p className="text-sm text-text-primary">
                Cet utilisateur a actuellement les responsabilités suivantes :
              </p>

              {impact.projectsOwned.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                    <FolderOpen className="w-3.5 h-3.5" />
                    Projets dont il est propriétaire ({impact.projectsOwned.length})
                  </h4>
                  <ul className="space-y-1 max-h-24 overflow-y-auto">
                    {impact.projectsOwned.map((p) => (
                      <li
                        key={p.id}
                        className="text-sm text-text-primary px-3 py-1.5 rounded bg-bg-surface-hover"
                      >
                        {p.name}{' '}
                        <span className="text-xs text-text-weak">
                          ({p.status})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {impact.tasksAssigned.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                    <ListChecks className="w-3.5 h-3.5" />
                    Tâches assignées ({impact.tasksAssigned.length})
                  </h4>
                  <ul className="space-y-1 max-h-24 overflow-y-auto">
                    {impact.tasksAssigned.slice(0, 5).map((t) => (
                      <li
                        key={t.id}
                        className="text-sm text-text-primary px-3 py-1.5 rounded bg-bg-surface-hover"
                      >
                        {t.title}{' '}
                        <span className="text-xs text-text-weak">
                          — {t.project.name}
                        </span>
                      </li>
                    ))}
                    {impact.tasksAssigned.length > 5 && (
                      <li className="text-xs text-text-weak px-3">
                        + {impact.tasksAssigned.length - 5} autre(s)
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {impact.projectsMember.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    Membre de projets ({impact.projectsMember.length})
                  </h4>
                  <ul className="space-y-1 max-h-24 overflow-y-auto">
                    {impact.projectsMember.slice(0, 5).map((p) => (
                      <li
                        key={p.id}
                        className="text-sm text-text-primary px-3 py-1.5 rounded bg-bg-surface-hover"
                      >
                        {p.name}
                      </li>
                    ))}
                    {impact.projectsMember.length > 5 && (
                      <li className="text-xs text-text-weak px-3">
                        + {impact.projectsMember.length - 5} autre(s)
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-border">
                <label className="text-sm font-medium text-text-primary">
                  Réassigner à <span className="text-critical">*</span>
                </label>
                <select
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">— Choisir un remplaçant —</option>
                  {eligibleReplacements.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.role})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-text-weak">
                  Le remplaçant recevra les projets et tâches de l'utilisateur supprimé.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
