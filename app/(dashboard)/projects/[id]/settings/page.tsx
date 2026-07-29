'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useProjectById,
  useAddProjectMember,
  useRemoveProjectMember,
  useRegenerateInviteToken,
  useDeleteProject,
  useUpdateMemberRole,
  useTransferOwnership,
  useInviteProjectMember,
  useProjectInvitations,
  useRevokeInvitation,
} from '@/lib/hooks/useProjects';
import { getApiError } from '@/lib/utils/api-error';
import { useUsers } from '@/lib/hooks/useAuth';
import { useAuthStore } from '@/lib/stores/auth.store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import ProjectRoleBadge from '@/components/projects/ProjectRoleBadge';
import { toast } from '@/lib/stores/toast.store';
import { InvitationStatus, ProjectRole } from '@/lib/types/project.types';
import { useCreateTemplateFromProject } from '@/lib/hooks/useTemplates';
import ProjectPlanningSettings from '@/components/projects/ProjectPlanningSettings';

/** Libellés des états d'invitation. */
const INVITATION_STATUS_LABELS: Record<InvitationStatus, string> = {
  [InvitationStatus.PENDING]: 'en attente',
  [InvitationStatus.ACCEPTED]: 'acceptée',
  [InvitationStatus.REVOKED]: 'révoquée',
};
import {
  AssignableProjectRole,
  PROJECT_ROLE_DESCRIPTIONS,
  PROJECT_ROLE_LABELS,
  assignableRolesFor,
  canActOnMember,
  canManage,
  isOwner as isOwnerRole,
  resolveMyRole,
} from '@/lib/utils/project-permissions';
import { Copy, UserPlus, Trash2, RotateCcw, AlertTriangle, Crown, Mail, X, LayoutTemplate } from 'lucide-react';

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
  const updateMemberRoleMutation = useUpdateMemberRole();
  const transferOwnershipMutation = useTransferOwnership();
  const inviteMemberMutation = useInviteProjectMember();
  const revokeInvitationMutation = useRevokeInvitation();
  const { data: invitations } = useProjectInvitations(projectId);

  const createTemplate = useCreateTemplateFromProject();

  const [templateName, setTemplateName] = useState('');
  const [templateShared, setTemplateShared] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AssignableProjectRole>(
    ProjectRole.MEMBER
  );
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  // OWNER exclu : il ne s'attribue pas, il se transfère.
  const [selectedRole, setSelectedRole] = useState<AssignableProjectRole>(
    ProjectRole.MEMBER
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (isLoadingProject) {
    return <Spinner centered size="lg" label="Chargement du projet..." />;
  }

  if (!project) {
    return <div className="p-6 text-text-secondary">Projet non trouvé</div>;
  }

  // Le rôle vient du serveur : source unique, alignée sur ses propres règles.
  const myRole = resolveMyRole(project, currentUser?.id);
  const isOwner = isOwnerRole(myRole);
  const canManageProject = canManage(myRole);
  const grantableRoles = assignableRolesFor(myRole);

  const memberIds = project.members?.map((m) => m.userId) || [];
  const availableUsers = allUsers?.filter((u) => !memberIds.includes(u.id)) || [];
  const transferTarget = project.members?.find((m) => m.userId === transferTargetId);

  const handleAddMember = () => {
    if (!selectedUserId) {
      toast.error('Veuillez sélectionner un utilisateur');
      return;
    }

    addMemberMutation.mutate(
      { projectId, userId: selectedUserId, role: selectedRole },
      {
        onSuccess: () => {
          setShowAddMemberModal(false);
          setSelectedUserId('');
          setSelectedRole(ProjectRole.MEMBER);
        },
        onError: () => {
          toast.error("Impossible d'ajouter le membre");
        },
      }
    );
  };

  const handleRemoveMember = (userId: string) => {
    removeMemberMutation.mutate(
      { projectId, userId },
      {
        onError: () => {
          toast.error('Impossible de retirer le membre');
        },
      }
    );
  };

  const handleChangeRole = (userId: string, role: ProjectRole) => {
    updateMemberRoleMutation.mutate(
      // OWNER n'est jamais proposé dans la liste : le transfert a son propre flux.
      { projectId, userId, role: role as Exclude<ProjectRole, ProjectRole.OWNER> },
      {
        onSuccess: () => {
          toast.success(`Rôle mis à jour : ${PROJECT_ROLE_LABELS[role]}`);
        },
        onError: () => {
          toast.error('Impossible de changer le rôle');
        },
      }
    );
  };

  const handleTransferOwnership = () => {
    if (!transferTargetId) return;

    transferOwnershipMutation.mutate(
      { projectId, newOwnerId: transferTargetId },
      {
        onSuccess: () => {
          setTransferTargetId(null);
          toast.success('Propriété du projet transférée');
        },
        onError: () => {
          toast.error('Impossible de transférer la propriété');
        },
      }
    );
  };

  const handleInviteByEmail = () => {
    if (!inviteEmail.trim()) {
      toast.error('Veuillez saisir une adresse email');
      return;
    }

    inviteMemberMutation.mutate(
      { projectId, email: inviteEmail.trim(), role: inviteRole },
      {
        onSuccess: () => {
          toast.success(`Invitation envoyée à ${inviteEmail.trim()}`);
          setInviteEmail('');
        },
        onError: (err) => {
          toast.error(getApiError(err), { title: 'Invitation refusée' });
        },
      }
    );
  };

  const handleSaveAsTemplate = () => {
    createTemplate.mutate(
      {
        projectId,
        name: templateName.trim() || `Modèle — ${project.name}`,
        isShared: templateShared,
      },
      {
        onSuccess: (template) => {
          toast.success(
            `Modèle créé avec ${template._count.tasks} tâche${template._count.tasks > 1 ? 's' : ''}`
          );
          setTemplateName('');
        },
        onError: (err) => toast.error(getApiError(err), { title: 'Échec' }),
      }
    );
  };

  const handleRevokeInvitation = (invitationId: string) => {
    revokeInvitationMutation.mutate(
      { projectId, invitationId },
      {
        onSuccess: () => toast.success('Invitation révoquée'),
        onError: () => toast.error('Impossible de révoquer l’invitation'),
      }
    );
  };

  const handleRegenerateToken = () => {
    regenerateTokenMutation.mutate(projectId, {
      onError: () => {
        toast.error('Impossible de régénérer le token');
      },
    });
  };

  const handleDeleteProject = () => {
    deleteProjectMutation.mutate(projectId, {
      onSuccess: () => {
        router.push('/projects');
      },
      onError: () => {
        toast.error('Impossible de supprimer le projet');
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Paramètres du projet</h1>
          <p className="text-text-secondary mt-1">Gestion des membres, invitation et options du projet</p>
        </div>
        {myRole && (
          <div className="text-right">
            <p className="text-xs text-text-secondary mb-1">Votre rôle</p>
            <ProjectRoleBadge role={myRole} />
          </div>
        )}
      </div>

      {/* Lecture seule : on annonce la limite plutôt que de laisser deviner */}
      {!canManageProject && (
        <Card className="p-4 flex items-start gap-2 border-warning/30 bg-warning/5">
          <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
          <p className="text-sm text-text-secondary">
            Votre rôle sur ce projet ne permet pas d&apos;en modifier les paramètres ni de gérer les membres.
          </p>
        </Card>
      )}

      <ProjectPlanningSettings
        projectId={projectId}
        canManage={canManageProject}
      />

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

        {/* Invite by Email */}
        {canManageProject && (
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="text-sm font-medium text-text-primary" htmlFor="invite-email">
              Inviter par email
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="collegue@exemple.fr"
                className="flex-1 min-w-[200px]"
              />
              <select
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as AssignableProjectRole)
                }
                aria-label="Rôle de l’invité"
                className="px-3 py-2 text-sm border border-border rounded-lg bg-bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {grantableRoles.map((role) => (
                  <option key={role} value={role}>
                    {PROJECT_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleInviteByEmail}
                isLoading={inviteMemberMutation.isPending}
                className="flex items-center gap-2 shrink-0"
              >
                <Mail className="w-4 h-4" />
                Envoyer
              </Button>
            </div>
            <p className="text-xs text-text-secondary">
              L&apos;invitation est nominative : seul le destinataire peut
              l&apos;utiliser, et elle expire au bout de 7 jours. Fonctionne
              même si la personne n&apos;a pas encore de compte.
            </p>

            {/* Invitations en cours */}
            {invitations && invitations.length > 0 && (
              <div className="pt-2 space-y-2">
                <p className="text-xs font-medium text-text-secondary">
                  Invitations envoyées
                </p>
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex flex-wrap items-center justify-between gap-2 p-2 bg-bg-surface-hover rounded-lg border border-border"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-text-primary truncate">
                        {invitation.email}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {PROJECT_ROLE_LABELS[invitation.role]} ·{' '}
                        {INVITATION_STATUS_LABELS[invitation.status]}
                        {invitation.status === InvitationStatus.PENDING && (
                          <>
                            {' '}
                            · expire le{' '}
                            {new Date(invitation.expiresAt).toLocaleDateString(
                              'fr-FR'
                            )}
                          </>
                        )}
                      </p>
                    </div>
                    {invitation.status === InvitationStatus.PENDING && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeInvitation(invitation.id)}
                        isLoading={revokeInvitationMutation.isPending}
                        className="text-critical"
                        aria-label={`Révoquer l’invitation de ${invitation.email}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Regenerate Token Button */}
        {canManageProject && (
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
          {canManageProject && (
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
              // `role` est absent tant qu'une API antérieure au RBAC répond.
              const memberRole =
                member.role ??
                (member.userId === project.ownerId
                  ? ProjectRole.OWNER
                  : ProjectRole.MEMBER);
              // Miroir des garde-fous serveur : on n'affiche une action que
              // si elle a une chance d'aboutir.
              const canActOnThisMember =
                canManageProject && !isCurrentUser && canActOnMember(myRole, memberRole);

              return (
                <div
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3 bg-bg-surface-hover rounded-lg border border-border"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {user.firstName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {user.firstName} {user.lastName}
                        {isCurrentUser && (
                          <span className="text-text-secondary font-normal"> (vous)</span>
                        )}
                      </p>
                      <p className="text-xs text-text-secondary truncate">
                        {user.jobTitle || 'Aucun titre'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    {canActOnThisMember ? (
                      <select
                        value={memberRole}
                        onChange={(e) => handleChangeRole(member.userId, e.target.value as ProjectRole)}
                        disabled={updateMemberRoleMutation.isPending}
                        aria-label={`Rôle de ${user.firstName} ${user.lastName}`}
                        className="px-2 py-1 text-xs border border-border rounded-lg bg-bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                      >
                        {grantableRoles.map((role) => (
                          <option key={role} value={role}>
                            {PROJECT_ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <ProjectRoleBadge role={memberRole} />
                    )}

                    {/* Transfert de propriété : réservé au propriétaire */}
                    {isOwner && !isCurrentUser && memberRole !== ProjectRole.OWNER && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setTransferTargetId(member.userId)}
                        title="Transférer la propriété du projet"
                        aria-label={`Transférer la propriété à ${user.firstName} ${user.lastName}`}
                      >
                        <Crown className="w-4 h-4" />
                      </Button>
                    )}

                    {canActOnThisMember && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRemoveMember(member.userId)}
                        isLoading={removeMemberMutation.isPending}
                        className="text-critical hover:bg-critical/10"
                        aria-label={`Retirer ${user.firstName} ${user.lastName} du projet`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-text-secondary py-4">Aucun membre</p>
          )}
        </div>
      </Card>

      {/* Capture du projet comme modele reutilisable */}
      {canManageProject && (
        <Card className="p-6 space-y-3">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Modèle</h2>
            <p className="text-sm text-text-secondary mt-1">
              Enregistre la structure du projet — tâches, durées, dépendances,
              listes de contrôle — pour la réutiliser plus tard à n&apos;importe
              quelle date.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder={`Modèle — ${project.name}`}
              className="flex-1 min-w-[200px]"
              aria-label="Nom du modèle"
            />
            <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={templateShared}
                onChange={(e) => setTemplateShared(e.target.checked)}
                className="rounded border-border"
              />
              Partager avec l&apos;équipe
            </label>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSaveAsTemplate}
              isLoading={createTemplate.isPending}
              className="flex items-center gap-2 shrink-0"
            >
              <LayoutTemplate className="w-4 h-4" />
              Enregistrer comme modèle
            </Button>
          </div>
        </Card>
      )}

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

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary" htmlFor="new-member-role">
              Rôle dans le projet
            </label>
            <select
              id="new-member-role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as AssignableProjectRole)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {grantableRoles.map((role) => (
                <option key={role} value={role}>
                  {PROJECT_ROLE_LABELS[role]}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-secondary">
              {PROJECT_ROLE_DESCRIPTIONS[selectedRole]}
            </p>
          </div>
        </div>
      </Modal>

      {/* Transfer Ownership Modal */}
      <Modal
        isOpen={!!transferTargetId}
        onClose={() => setTransferTargetId(null)}
        title="Transférer la propriété"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setTransferTargetId(null)}>
              Annuler
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleTransferOwnership}
              isLoading={transferOwnershipMutation.isPending}
            >
              Transférer
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-text-primary">
            Transférer la propriété du projet à{' '}
            <span className="font-semibold">
              {transferTarget?.user.firstName} {transferTarget?.user.lastName}
            </span>
            &nbsp;?
          </p>
          <p className="text-sm text-text-secondary">
            Vous perdrez le rôle de propriétaire et deviendrez administrateur du projet.
            Vous ne pourrez plus le supprimer ni reprendre la propriété par vous-même.
          </p>
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
