'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjectById, useAddProjectMember, useRemoveProjectMember, useRegenerateInviteToken, useDeleteProject } from '@/lib/hooks/useProjects';
import { useUsers } from '@/lib/hooks/useAuth';
import { useAuthStore } from '@/lib/stores/auth.store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import { Copy, UserPlus, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: project, isLoading: isLoadingProject } = useProjectById(projectId);
  const { data: allUsers } = useUsers();
  const currentUser = useAuthStore((state) => state.user);

  const addMemberMutation = useAddProjectMember();
  const removeMemberMutation = useRemoveProjectMember();
  const regenerateTokenMutation = useRegenerateInviteToken();
  const deleteProjectMutation = useDeleteProject();

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (isLoadingProject) {
    return <Spinner centered size="lg" label="Chargement du projet..." />;
  }

  if (!project) {
    return <Alert type="error" title="Erreur" message="Projet non trouvé" />;
  }

  const isOwner = currentUser?.id === project.ownerId || currentUser?.id === project.createdBy;
  const memberIds = project.members?.map((m) => m.userId) || [];
  const availableUsers = allUsers?.filter((u) => !memberIds.includes(u.id)) || [];

  const handleAddMember = () => {
    if (!selectedUserId) {
      setApiError('Veuillez sélectionner un utilisateur');
      return;
    }

    console.log(` Adding member ${selectedUserId} to project ${projectId}`);
    setApiError(null);

    addMemberMutation.mutate(
      { projectId, userId: selectedUserId },
      {
        onSuccess: () => {
          console.log(' Member added successfully');
          setShowAddMemberModal(false);
          setSelectedUserId('');
        },
        onError: (err) => {
          console.error(' Failed to add member:', err);
          setApiError('Impossible d\'ajouter le membre');
        },
      }
    );
  };

  const handleRemoveMember = (userId: string) => {
    console.log(` Removing member ${userId} from project ${projectId}`);
    setApiError(null);

    removeMemberMutation.mutate(
      { projectId, userId },
      {
        onSuccess: () => {
          console.log(' Member removed successfully');
        },
        onError: (err) => {
          console.error(' Failed to remove member:', err);
          setApiError('Impossible de retirer le membre');
        },
      }
    );
  };

  const handleRegenerateToken = () => {
    console.log(`🔄 Regenerating invite token for project ${projectId}`);
    setApiError(null);

    regenerateTokenMutation.mutate(projectId, {
      onSuccess: () => {
        console.log(' Invite token regenerated');
      },
      onError: (err) => {
        console.error(' Failed to regenerate token:', err);
        setApiError('Impossible de régénérer le token');
      },
    });
  };

  const handleDeleteProject = () => {
    console.log(` Deleting project ${projectId}`);
    setApiError(null);

    deleteProjectMutation.mutate(projectId, {
      onSuccess: () => {
        console.log(' Project deleted successfully');
        router.push('/projects');
      },
      onError: (err) => {
        console.error(' Failed to delete project:', err);
        setApiError('Impossible de supprimer le projet');
      },
    });
  };

  const handleCopyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Paramètres du projet</h1>
        <p className="text-text-secondary mt-1">Gestion des membres, invitation et options du projet</p>
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

      {/* Invitation Section */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-4">Invitation</h2>
        </div>

        {/* Project Code */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Code du projet</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 bg-bg-surface-hover border border-border rounded-lg text-text-primary font-mono text-sm">
              {project.projectCode}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleCopyToClipboard(project.projectCode, 'code')}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              {copiedField === 'code' ? 'Copié' : 'Copier'}
            </Button>
          </div>
          <p className="text-xs text-text-secondary">Partagez ce code pour inviter des membres</p>
        </div>

        {/* Invite Token */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Token d&apos;invitation</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 bg-bg-surface-hover border border-border rounded-lg text-text-primary font-mono text-sm break-all">
              {project.inviteToken}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleCopyToClipboard(project.inviteToken, 'token')}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              {copiedField === 'token' ? 'Copié' : 'Copier'}
            </Button>
          </div>
          <p className="text-xs text-text-secondary">Lien d&apos;invitation unique pour les membres externes</p>
        </div>

        {/* Regenerate Token Button */}
        {isOwner && (
          <div className="pt-2 border-t border-border">
            <Button
              variant="secondary"
              onClick={handleRegenerateToken}
              isLoading={regenerateTokenMutation.isPending}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Régénérer le token
            </Button>
            <p className="text-xs text-text-secondary mt-2">
              Génère un nouveau token. Les anciens liens d&apos;invitation ne fonctionneront plus.
            </p>
          </div>
        )}
      </Card>

      {/* Members Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">Membres ({project.members?.length || 0})</h2>
          {isOwner && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddMemberModal(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Ajouter
            </Button>
          )}
        </div>

        {/* Members List */}
        <div className="space-y-2">
          {project.members && project.members.length > 0 ? (
            project.members.map((member) => {
              const user = member.user;
              const isCurrentUser = currentUser?.id === user.id;
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-bg-surface-hover rounded-lg border border-border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                        {user.firstName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {user.jobTitle || 'Aucun titre'}
                        </p>
                      </div>
                      {member.userId === project.ownerId && (
                        <span className="ml-auto mr-3 text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
                          Propriétaire
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Remove button */}
                  {isOwner && !isCurrentUser && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRemoveMember(member.userId)}
                      isLoading={removeMemberMutation.isPending}
                      className="text-critical hover:bg-critical/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-center text-text-secondary py-4">Aucun membre</p>
          )}
        </div>
      </Card>

      {/* Danger Zone */}
      {isOwner && (
        <Card className="p-6 space-y-4 border-critical/30 bg-critical/5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-critical mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-critical">Zone dangereuse</h2>
              <p className="text-sm text-text-secondary mt-1">
                Les actions ici sont permanentes et ne peuvent pas être annulées.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-critical/20">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-critical hover:bg-critical/10 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer le projet
            </Button>
          </div>
        </Card>
      )}

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddMemberModal}
        onClose={() => {
          setShowAddMemberModal(false);
          setSelectedUserId('');
          setApiError(null);
        }}
        title="Ajouter un membre"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowAddMemberModal(false);
                setSelectedUserId('');
                setApiError(null);
              }}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddMember}
              isLoading={addMemberMutation.isPending}
            >
              Ajouter
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {apiError && (
            <Alert
              type="error"
              title="Erreur"
              message={apiError}
              onClose={() => setApiError(null)}
            />
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Utilisateur</label>
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
            {availableUsers.length === 0 && (
              <p className="text-xs text-text-secondary">Tous les utilisateurs sont déjà membres</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Supprimer le projet"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)}>
              Annuler
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDeleteProject}
              isLoading={deleteProjectMutation.isPending}
              className="bg-critical text-white hover:bg-critical/90"
            >
              Supprimer
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-text-primary">
            Êtes-vous sûr de vouloir supprimer le projet <span className="font-semibold">{project.name}</span>?
          </p>
          <p className="text-sm text-text-secondary">
            Cette action est permanente et ne peut pas être annulée. Toutes les données du projet seront perdues.
          </p>
        </div>
      </Modal>
    </div>
  );
}
