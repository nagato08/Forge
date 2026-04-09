'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUsers, useProjects, useMyTasks, useCreateUser, useDeleteUser } from '@/lib/hooks';
import { getApiError } from '@/lib/utils/api-error';
import { Role } from '@/lib/types/user.types';
import type { CreateUserRequest } from '@/lib/types/user.types';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

export default function AdminDashboardPage() {
  const { data: users, isLoading: isLoadingUsers } = useUsers();
  const { data: projects, isLoading: isLoadingProjects } = useProjects();
  const { data: allTasks, isLoading: isLoadingTasks } = useMyTasks();
  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();

  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'projects'>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    department: '',
    jobTitle: '',
  });

  if (isLoadingUsers || isLoadingProjects || isLoadingTasks) {
    return <Spinner centered size="lg" label="Chargement du tableau de bord admin..." />;
  }

  console.log('Admin dashboard loaded:', {
    users: users?.length || 0,
    projects: projects?.length || 0,
    tasks: allTasks?.length || 0,
  });

  const tasksByStatus = {
    TODO: allTasks?.filter((t) => t.status === 'TODO').length || 0,
    DOING: allTasks?.filter((t) => t.status === 'DOING').length || 0,
    DONE: allTasks?.filter((t) => t.status === 'DONE').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">
          Tableau de bord Admin
        </h1>
        
        <p className="text-text-secondary text-sm mt-1">
          Vue d&apos;ensemble du système et gestion des utilisateurs
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="p-6">
          <div className="space-y-3">
            <p className="text-sm text-text-secondary font-medium">👥 Utilisateurs</p>
            <p className="text-3xl font-bold text-primary">
              {users?.length || 0}
            </p>
            <p className="text-xs text-text-weak">
              {users?.filter((u) => u.role === 'EMPLOYEE').length || 0} employés
            </p>
          </div>
        </Card>

        {/* Total Projects */}
        <Card className="p-6">
          <div className="space-y-3">
            <p className="text-sm text-text-secondary font-medium">📊 Projets</p>
            <p className="text-3xl font-bold text-primary">
              {projects?.length || 0}
            </p>
            <p className="text-xs text-text-weak">
              {projects?.filter((p) => p.status === 'ACTIVE').length || 0} actifs
            </p>
          </div>
        </Card>

        {/* Total Tasks */}
        <Card className="p-6">
          <div className="space-y-3">
            <p className="text-sm text-text-secondary font-medium">✓ Tâches</p>
            <p className="text-3xl font-bold text-primary">
              {allTasks?.length || 0}
            </p>
            <p className="text-xs text-text-weak">
              {tasksByStatus.DONE} complétées
            </p>
          </div>
        </Card>

        {/* Completion Rate */}
        <Card className="p-6">
          <div className="space-y-3">
            <p className="text-sm text-text-secondary font-medium">📈 Taux achèvement</p>
            <p className="text-3xl font-bold text-success">
              {allTasks && allTasks.length > 0
                ? Math.round((tasksByStatus.DONE / allTasks.length) * 100)
                : 0}
              %
            </p>
            <p className="text-xs text-text-weak">
              {tasksByStatus.DOING} en cours
            </p>
          </div>
        </Card>
      </div>

      {/* Task Status Chart */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          📊 État des tâches
        </h2>
        <div className="space-y-3">
          {/* Todo */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">À faire</span>
              <span className="font-semibold text-text-primary">
                {tasksByStatus.TODO}
              </span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div
                className="bg-warning h-2 rounded-full"
                style={{
                  width: allTasks
                    ? `${(tasksByStatus.TODO / allTasks.length) * 100}%`
                    : '0%',
                }}
              />
            </div>
          </div>

          {/* Doing */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">En cours</span>
              <span className="font-semibold text-text-primary">
                {tasksByStatus.DOING}
              </span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{
                  width: allTasks
                    ? `${(tasksByStatus.DOING / allTasks.length) * 100}%`
                    : '0%',
                }}
              />
            </div>
          </div>

          {/* Done */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Complétées</span>
              <span className="font-semibold text-text-primary">
                {tasksByStatus.DONE}
              </span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div
                className="bg-success h-2 rounded-full"
                style={{
                  width: allTasks
                    ? `${(tasksByStatus.DONE / allTasks.length) * 100}%`
                    : '0%',
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {apiError && (
        <Alert
          type="error"
          title="Erreur"
          message={apiError}
          onClose={() => setApiError(null)}
        />
      )}

      {/* Users List */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            👥 Utilisateurs ({users?.length || 0})
          </h2>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
          >
            + Ajouter utilisateur
          </Button>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {!users || users.length === 0 ? (
            <p className="text-center py-8 text-text-secondary">
              Aucun utilisateur
            </p>
          ) : (
            <div className="space-y-0">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border-b border-border hover:bg-bg-surface-hover transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-text-weak">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {user.role === 'PROJECT_MANAGER'
                        ? 'Manager'
                        : user.role}
                    </span>
                    <span className="text-text-secondary">
                      {user.department || '—'}
                    </span>
                    {/* Delete button (soft delete) */}
                    {deleteConfirmId === user.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-critical">Confirmer ?</span>
                        <button
                          onClick={() => {
                            console.log('🗑️ Deleting user (soft delete):', user.id, user.email);
                            deleteUserMutation.mutate(user.id, {
                              onSuccess: () => {
                                console.log('✅ User deleted:', user.id);
                                setDeleteConfirmId(null);
                              },
                              onError: (err) => {
                                console.error('❌ Delete user error:', getApiError(err));
                                setApiError(getApiError(err));
                                setDeleteConfirmId(null);
                              },
                            });
                          }}
                          className="px-2 py-1 text-xs rounded bg-critical/10 text-critical hover:bg-critical/20 transition-colors"
                        >
                          Oui
                        </button>
                        <button
                          onClick={() => {
                            console.log('↩️ Delete cancelled for:', user.id);
                            setDeleteConfirmId(null);
                          }}
                          className="px-2 py-1 text-xs rounded bg-border text-text-secondary hover:bg-bg-surface-hover transition-colors"
                        >
                          Non
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          console.log('🗑️ Delete confirmation requested for:', user.id, user.email);
                          setDeleteConfirmId(user.id);
                        }}
                        className="px-2 py-1 text-xs rounded text-critical hover:bg-critical/10 transition-colors"
                        title="Supprimer cet utilisateur"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm font-medium text-text-primary mb-3">⚙️ Actions</p>
          <Link href="/projects" onClick={() => console.log('🔗 Admin: navigating to projects')}>
            <Button variant="secondary" size="sm" className="w-full">
              Gestion des projets
            </Button>
          </Link>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-text-primary mb-3">📋 Paramètres</p>
          <Link href="/settings/company" onClick={() => console.log('🔗 Admin: navigating to company settings')}>
            <Button variant="secondary" size="sm" className="w-full">
              Paramètres entreprise
            </Button>
          </Link>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-text-primary mb-3">⏱️ Temps</p>
          <Link href="/time-tracking" onClick={() => console.log('🔗 Admin: navigating to time tracking')}>
            <Button variant="secondary" size="sm" className="w-full">
              Suivi du temps
            </Button>
          </Link>
        </Card>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            role: 'EMPLOYEE',
            department: '',
            jobTitle: '',
          });
          setApiError(null);
        }}
        title="Ajouter un nouvel utilisateur"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowCreateModal(false);
                setFormData({
                  firstName: '',
                  lastName: '',
                  email: '',
                  password: '',
                  role: 'EMPLOYEE',
                  department: '',
                  jobTitle: '',
                });
                setApiError(null);
              }}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                console.log('👤 Creating new user:', formData.email);
                setApiError(null);

                const payload: CreateUserRequest = {
                  firstName: formData.firstName,
                  lastName: formData.lastName,
                  email: formData.email,
                  password: formData.password,
                  role: formData.role as Role,
                };
                if (formData.jobTitle) payload.jobTitle = formData.jobTitle;

                createUserMutation.mutate(
                  payload,
                  {
                    onSuccess: () => {
                      console.log('✅ Utilisateur créé avec succès');
                      setShowCreateModal(false);
                      setFormData({
                        firstName: '',
                        lastName: '',
                        email: '',
                        password: '',
                        role: 'EMPLOYEE',
                        department: '',
                        jobTitle: '',
                      });
                    },
                    onError: (err) => {
                      console.error('❌ Erreur création utilisateur:', getApiError(err));
                      setApiError(getApiError(err));
                    },
                  }
                );
              }}
              isLoading={createUserMutation.isPending}
            >
              Créer
            </Button>
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

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prénom"
              placeholder="John"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
            />
            <Input
              label="Nom"
              placeholder="Doe"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
            />
          </div>

          <Input
            label="Email"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          <Input
            label="Mot de passe (min 8 caractères)"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Rôle</label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-lg bg-bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="EMPLOYEE">Employé</option>
              <option value="PROJECT_MANAGER">Manager de projet</option>
            </select>
          </div>

          <Input
            label="Département (optionnel)"
            placeholder="ex: Développement"
            value={formData.department}
            onChange={(e) =>
              setFormData({ ...formData, department: e.target.value })
            }
          />

          <Input
            label="Titre du poste (optionnel)"
            placeholder="ex: Senior Developer"
            value={formData.jobTitle}
            onChange={(e) =>
              setFormData({ ...formData, jobTitle: e.target.value })
            }
          />
        </div>
      </Modal>
    </div>
  );
}
