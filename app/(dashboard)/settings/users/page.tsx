'use client';

import { useState } from 'react';
import { useUsers, useCreateUser, useDeleteUser, useGetDepartmentEnums } from '@/lib/hooks';
import { getApiError } from '@/lib/utils/api-error';
import { Role } from '@/lib/types/user.types';
import type { CreateUserRequest } from '@/lib/types/user.types';
import { UserPlus, Trash2, Shield, Users as UsersIcon } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

export default function UsersManagementPage() {
  const { data: users, isLoading } = useUsers();
  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();
  const { data: departments } = useGetDepartmentEnums();

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

  if (isLoading) {
    return <Spinner centered size="lg" label="Chargement des utilisateurs..." />;
  }

  const handleCreateUser = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setApiError('Tous les champs obligatoires doivent être remplis');
      return;
    }

    setApiError(null);

    const payload: CreateUserRequest = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      role: formData.role as Role,
    };
    if (formData.jobTitle) payload.jobTitle = formData.jobTitle;
    if (formData.department) payload.department = formData.department as any;

    createUserMutation.mutate(payload, {
      onSuccess: () => {
        console.log('User created successfully');
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
        console.error('User creation error:', getApiError(err));
        setApiError(getApiError(err));
      },
    });
  };

  const handleDeleteUser = (userId: string) => {
    console.log('Deleting user:', userId);
    setApiError(null);

    deleteUserMutation.mutate(userId, {
      onSuccess: () => {
        console.log('User deleted:', userId);
        setDeleteConfirmId(null);
      },
      onError: (err) => {
        console.error('Delete user error:', getApiError(err));
        setApiError(getApiError(err));
        setDeleteConfirmId(null);
      },
    });
  };

  const usersByRole = {
    ADMIN: users?.filter((u) => u.role === 'ADMIN').length || 0,
    PROJECT_MANAGER: users?.filter((u) => u.role === 'PROJECT_MANAGER').length || 0,
    EMPLOYEE: users?.filter((u) => u.role === 'EMPLOYEE').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Gestion des utilisateurs</h1>
          <p className="text-text-secondary text-sm mt-1">Créer, modifier et supprimer des utilisateurs</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Nouvel utilisateur
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-secondary font-medium">Total</p>
              <p className="text-3xl font-bold text-primary">{users?.length || 0}</p>
            </div>
            <UsersIcon className="w-8 h-8 text-primary/50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-secondary font-medium">Managers</p>
              <p className="text-3xl font-bold text-primary">{usersByRole.PROJECT_MANAGER}</p>
            </div>
            <Shield className="w-8 h-8 text-primary/50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-secondary font-medium">Employés</p>
              <p className="text-3xl font-bold text-primary">{usersByRole.EMPLOYEE}</p>
            </div>
            <UsersIcon className="w-8 h-8 text-primary/50" />
          </div>
        </Card>
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

      {/* Users List */}
      <Card>
        {!users || users.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-text-secondary mb-4">Aucun utilisateur</p>
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Créer le premier utilisateur
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-surface-hover">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary">Département</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary">Poste</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-bg-surface-hover transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-text-primary">
                        {user.firstName} {user.lastName}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-text-secondary">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'ADMIN'
                          ? 'bg-critical/10 text-critical'
                          : user.role === 'PROJECT_MANAGER'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-success/10 text-success'
                      }`}>
                        {user.role === 'PROJECT_MANAGER' ? 'Manager' : user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-text-secondary">{user.department || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-text-secondary">{user.jobTitle || '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {deleteConfirmId === user.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-critical font-medium">Confirmer ?</span>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="px-3 py-1 text-xs rounded bg-critical/10 text-critical hover:bg-critical/20 transition-colors font-medium"
                          >
                            Oui
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-3 py-1 text-xs rounded bg-border text-text-secondary hover:bg-bg-surface-hover transition-colors font-medium"
                          >
                            Non
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(user.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded text-critical hover:bg-critical/10 transition-colors font-medium"
                          title="Supprimer cet utilisateur"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Supprimer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
        title="Créer un nouvel utilisateur"
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
              onClick={handleCreateUser}
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
              label="Prénom *"
              placeholder="John"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
            <Input
              label="Nom *"
              placeholder="Doe"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>

          <Input
            label="Email *"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <Input
            label="Mot de passe (min 8 caractères) *"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Rôle</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="EMPLOYEE">Employé</option>
              <option value="PROJECT_MANAGER">Manager de projet</option>
            </select>
            <p className="text-xs text-text-weak">Les administrateurs ne peuvent être créés que par le système</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Département (optionnel)</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">— Choisir un département —</option>
              {departments?.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Titre du poste (optionnel)"
            placeholder="ex: Senior Developer"
            value={formData.jobTitle}
            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}
