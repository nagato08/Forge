'use client';

import { useState } from 'react';
import { useProfile, useUpdateProfile } from '@/lib/hooks';
import { getApiError } from '@/lib/utils/api-error';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

export default function ProfileSettingsPage() {
  const { data: profile, isLoading } = useProfile();
  const updateMutation = useUpdateProfile();

  const [editMode, setEditMode] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    email: profile?.email || '',
    jobTitle: profile?.jobTitle || '',
    avatar: profile?.avatar || '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    console.log('💾 Sauvegarde du profil');
    setApiError(null);
    setSuccessMessage(null);

    updateMutation.mutate(
      {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        jobTitle: formData.jobTitle,
        avatar: formData.avatar,
      },
      {
        onSuccess: () => {
          console.log('✅ Profil mis à jour');
          setSuccessMessage('Profil mis à jour avec succès');
          setEditMode(false);
          setTimeout(() => setSuccessMessage(null), 3000);
        },
        onError: (err) => {
          console.error('❌ Erreur mise à jour profil:', getApiError(err));
          setApiError(getApiError(err));
        },
      }
    );
  };

  const handleCancel = () => {
    setFormData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
      jobTitle: profile?.jobTitle || '',
      avatar: profile?.avatar || '',
    });
    setEditMode(false);
    setApiError(null);
  };

  if (isLoading) {
    return <Spinner centered size="lg" label="Chargement du profil..." />;
  }

  if (!profile) {
    return (
      <Alert
        type="error"
        title="Erreur"
        message="Impossible de charger le profil"
      />
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">👤 Mon profil</h1>
        <p className="text-text-secondary text-sm mt-1">
          Gérez vos informations personnelles
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert
          type="success"
          title="Succès"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {/* Error Alert */}
      {apiError && (
        <Alert
          type="error"
          title="Erreur"
          message={apiError}
          onClose={() => setApiError(null)}
        />
      )}

      {/* Profile Card */}
      <Card className="p-6 space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-2xl">
            {profile.firstName[0]}
            {profile.lastName[0]}
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary">
              {profile.firstName} {profile.lastName}
            </p>
            <p className="text-sm text-text-secondary">{profile.role}</p>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-border" />

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prénom"
              value={formData.firstName}
              onChange={(e) =>
                handleChange('firstName', e.currentTarget.value)
              }
              disabled={!editMode}
            />
            <Input
              label="Nom"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.currentTarget.value)}
              disabled={!editMode}
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.currentTarget.value)}
            disabled={!editMode}
          />

          <Input
            label="Titre du poste"
            value={formData.jobTitle}
            onChange={(e) =>
              handleChange('jobTitle', e.currentTarget.value)
            }
            disabled={!editMode}
          />

          <Input
            label="URL Avatar (optionnel)"
            value={formData.avatar}
            onChange={(e) => handleChange('avatar', e.currentTarget.value)}
            disabled={!editMode}
            placeholder="https://..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          {editMode ? (
            <>
              <Button
                variant="secondary"
                onClick={handleCancel}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={updateMutation.isPending}
              >
                Enregistrer
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={() => setEditMode(true)}
            >
              ✎ Modifier
            </Button>
          )}
        </div>
      </Card>

      {/* User Info */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-text-primary">Informations du compte</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">ID utilisateur</span>
            <span className="text-text-primary font-mono">{profile.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Rôle</span>
            <span className="text-text-primary">{profile.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Département</span>
            <span className="text-text-primary">{profile.department || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Compte créé</span>
            <span className="text-text-primary">
              {new Date(profile.createdAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
