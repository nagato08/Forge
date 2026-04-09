'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useCompanySettings, useUpdateCompanySettings } from '@/lib/hooks';
import { getApiError } from '@/lib/utils/api-error';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

export default function CompanySettingsPage() {
  const role = useAuthStore((state) => state.role);
  const { data: companySettings, isLoading } = useCompanySettings();
  const updateMutation = useUpdateCompanySettings();

  const [editMode, setEditMode] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    companyName: companySettings?.companyName || '',
    logoUrl: companySettings?.logoUrl || '',
    primaryColor: companySettings?.primaryColor || '#2F81F7',
  });

  useEffect(() => {
    if (companySettings) {
      setFormData({
        companyName: companySettings.companyName,
        logoUrl: companySettings.logoUrl || '',
        primaryColor: companySettings.primaryColor || '#2F81F7',
      });
    }
  }, [companySettings]);

  // Vérifier que l'utilisateur est ADMIN
  if (role !== 'ADMIN') {
    return (
      <Alert
        type="error"
        title="Accès refusé"
        message="Seuls les administrateurs peuvent accéder à ces paramètres"
      />
    );
  }

  const handleChange = (field: string, value: string) => {
    console.log(`✏️ Field changed: ${field} =`, value);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    console.log('💾 Sauvegarde des paramètres de l\'entreprise');
    setApiError(null);
    setSuccessMessage(null);

    updateMutation.mutate(
      {
        companyName: formData.companyName,
        logoUrl: formData.logoUrl,
        primaryColor: formData.primaryColor,
      },
      {
        onSuccess: () => {
          console.log('✅ Paramètres de l\'entreprise mis à jour');
          setSuccessMessage('Paramètres mis à jour avec succès');
          setEditMode(false);
          setTimeout(() => setSuccessMessage(null), 3000);
        },
        onError: (err) => {
          console.error('❌ Erreur mise à jour company settings:', getApiError(err));
          setApiError(getApiError(err));
        },
      }
    );
  };

  const handleCancel = () => {
    setFormData({
      companyName: companySettings?.companyName || '',
      logoUrl: companySettings?.logoUrl || '',
      primaryColor: companySettings?.primaryColor || '#2F81F7',
    });
    setEditMode(false);
    setApiError(null);
  };

  if (isLoading) {
    return <Spinner centered size="lg" label="Chargement des paramètres..." />;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">🏢 Paramètres de l'entreprise</h1>
        <p className="text-text-secondary text-sm mt-1">
          Gestion des informations générales et de la marque (ADMIN seulement)
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

      {/* Company Info Card */}
      <Card className="p-6 space-y-6">
        {/* Current Logo */}
        {formData.logoUrl && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-text-secondary">
              Logo actuel
            </p>
            <div className="h-16 w-16 rounded border border-border overflow-hidden bg-bg-surface-hover flex items-center justify-center">
              <img
                src={formData.logoUrl}
                alt="Company logo"
                className="max-h-full max-w-full"
                onError={() =>
                  console.error('❌ Failed to load logo:', formData.logoUrl)
                }
              />
            </div>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4">
          <Input
            label="Nom de l'entreprise"
            value={formData.companyName}
            onChange={(e) =>
              handleChange('companyName', e.currentTarget.value)
            }
            disabled={!editMode}
            placeholder="ex: Mon Entreprise"
          />

          <Input
            label="URL du logo"
            value={formData.logoUrl}
            onChange={(e) => handleChange('logoUrl', e.currentTarget.value)}
            disabled={!editMode}
            placeholder="https://..."
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Couleur primaire
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) =>
                  handleChange('primaryColor', e.target.value)
                }
                disabled={!editMode}
                className="h-10 w-20 rounded cursor-pointer border border-border"
              />
              <span className="font-mono text-sm text-text-secondary">
                {formData.primaryColor}
              </span>
            </div>
            <p className="text-xs text-text-weak">
              Cette couleur est utilisée comme couleur primaire dans l'interface
            </p>
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 rounded bg-bg-surface-hover space-y-3">
          <p className="text-xs font-medium text-text-secondary">Aperçu</p>
          <div className="space-y-2">
            <p className="text-sm text-text-primary">
              Nom : <span className="font-semibold">{formData.companyName || '—'}</span>
            </p>
            <div
              className="h-8 w-32 rounded"
              style={{ backgroundColor: formData.primaryColor }}
            />
          </div>
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

      {/* Info Box */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <h3 className="font-semibold text-text-primary mb-2">
          💡 À propos des paramètres
        </h3>
        <p className="text-sm text-text-secondary space-y-2">
          <div>
            • Le nom de l'entreprise s'affiche dans l'en-tête et les documents
          </div>
          <div>
            • Le logo s'affiche dans la barre latérale et en-têtes (carré 1:1)
          </div>
          <div>
            • La couleur primaire est utilisée pour les boutons, liens et éléments
            interactifs
          </div>
          <div>
            • Les modifications s'appliquent immédiatement pour tous les utilisateurs
          </div>
        </p>
      </Card>
    </div>
  );
}
