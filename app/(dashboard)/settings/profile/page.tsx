'use client';

import { useEffect, useState, useRef } from 'react';
import { useProfile, useUpdateProfile, useUploadAvatar } from '@/lib/hooks';
import { getApiError } from '@/lib/utils/api-error';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { User, Edit2, Camera, X, Loader2 } from 'lucide-react';

export default function ProfileSettingsPage() {
  const { data: profile, isLoading } = useProfile();
  const updateMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editMode, setEditMode] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    avatar: '',
  });

  // Synchronize formData with profile when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        jobTitle: profile.jobTitle || '',
        avatar: profile.avatar || '',
      });
    }
  }, [profile]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    console.log('Saving profile');
    setApiError(null);
    setSuccessMessage(null);

    // Si une image est sélectionnée, l'uploader d'abord
    if (avatarPreview && fileInputRef.current?.files?.[0]) {
      const file = fileInputRef.current.files[0];
      uploadAvatarMutation.mutate(file, {
        onSuccess: () => {
          console.log('Avatar uploaded, updating profile');
          // Puis mettre à jour le profil
          updateMutation.mutate(
            {
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              jobTitle: formData.jobTitle,
            },
            {
              onSuccess: () => {
                console.log('Profile updated successfully');
                setSuccessMessage('Profil mis à jour avec succès');
                setEditMode(false);
                setAvatarPreview(null);
                setTimeout(() => setSuccessMessage(null), 3000);
              },
              onError: (err) => {
                console.error('Profile update error:', getApiError(err));
                setApiError(getApiError(err));
              },
            }
          );
        },
        onError: (err) => {
          console.error('Avatar upload error:', getApiError(err));
          setApiError(getApiError(err));
        },
      });
    } else {
      // Pas d'avatar, juste mettre à jour le profil
      updateMutation.mutate(
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          jobTitle: formData.jobTitle,
        },
        {
          onSuccess: () => {
            console.log('Profile updated successfully');
            setSuccessMessage('Profil mis à jour avec succès');
            setEditMode(false);
            setTimeout(() => setSuccessMessage(null), 3000);
          },
          onError: (err) => {
            console.error('Profile update error:', getApiError(err));
            setApiError(getApiError(err));
          },
        }
      );
    }
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
    setAvatarPreview(null);
  };

  const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB
  const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setApiError('Format non supporté. Utilisez JPG, PNG, WebP ou GIF');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Vérifier la taille du fichier
    if (file.size > MAX_AVATAR_SIZE) {
      setApiError(`L'image ne doit pas dépasser ${MAX_AVATAR_SIZE / (1024 * 1024)} Mo`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Créer un preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
      setApiError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatarPreview = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      <div className="flex items-center gap-3">
        <User className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Mon profil</h1>
          <p className="text-text-secondary text-sm mt-1">
            Gérez vos informations personnelles
          </p>
        </div>
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
          <div className="relative">
            {/* Avatar */}
            <div className="relative w-24 h-24 rounded-full overflow-hidden">
              {avatarPreview || profile?.avatar ? (
                <img
                  src={avatarPreview || profile?.avatar || ''}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary text-white flex items-center justify-center font-semibold text-3xl">
                  {profile.firstName?.[0]?.toUpperCase() || ''}
                  {profile.lastName?.[0]?.toUpperCase() || ''}
                </div>
              )}

              {/* Overlay de chargement */}
              {uploadAvatarMutation.isPending && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>

            {/* Bouton camera visible en mode édition */}
            {editMode && !uploadAvatarMutation.isPending && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Camera button clicked, opening file picker');
                  fileInputRef.current?.click();
                }}
                className="absolute -bottom-1 -right-1 w-9 h-9 bg-primary text-white rounded-full hover:bg-primary/90 active:bg-primary/80 flex items-center justify-center shadow-lg border-2 border-bg-surface transition z-20"
                title="Changer la photo"
                aria-label="Changer la photo de profil"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}

            {/* Bouton supprimer preview */}
            {editMode && avatarPreview && !uploadAvatarMutation.isPending && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRemoveAvatarPreview();
                }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-critical text-white rounded-full hover:bg-critical/90 flex items-center justify-center shadow-md border-2 border-bg-surface transition z-20"
                title="Annuler le changement"
                aria-label="Annuler le changement d'avatar"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Input fichier caché */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold text-text-primary truncate">
              {profile.firstName} {profile.lastName}
            </p>
            <p className="text-sm text-text-secondary">{profile.role}</p>
            {editMode && (
              <>
                {avatarPreview ? (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-warning">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                    Image en attente. Cliquez sur "Enregistrer" pour valider.
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-text-weak">
                    JPG, PNG, WebP ou GIF — max 5 Mo
                  </p>
                )}
              </>
            )}
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
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          {editMode ? (
            <>
              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={updateMutation.isPending || uploadAvatarMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={updateMutation.isPending || uploadAvatarMutation.isPending}
              >
                Enregistrer
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={() => setEditMode(true)}
              className="flex items-center gap-1.5"
            >
              <Edit2 className="w-4 h-4" />
              Modifier
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
