'use client';

import { useState, useEffect } from 'react';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '@/lib/hooks';
import { getApiError } from '@/lib/utils/api-error';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { toast } from '@/lib/stores/toast.store';

export default function NotificationsSettingsPage() {
  const { data: settings, isLoading } = useNotificationSettings();
  const updateMutation = useUpdateNotificationSettings();

  const [formData, setFormData] = useState({
    email: settings?.email ?? false,
    realtime: settings?.realtime ?? false,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        email: settings.email,
        realtime: settings.realtime,
      });
    }
  }, [settings]);

  const handleToggle = (field: 'email' | 'realtime') => {
    const newValue = !formData[field];
    console.log(`🔀 Toggling ${field}:`, newValue);
    setFormData((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = () => {
    console.log('💾 Sauvegarde des paramètres de notification');

    updateMutation.mutate(
      {
        email: formData.email,
        realtime: formData.realtime,
      },
      {
        onSuccess: () => {
          console.log(' Paramètres de notification mis à jour');
          toast.success('Paramètres mis à jour avec succès');
        },
        onError: (err) => {
          console.error(' Erreur mise à jour settings:', getApiError(err));
          toast.error(getApiError(err), { title: 'Échec' });
        },
      }
    );
  };

  if (isLoading) {
    return <Spinner centered size="lg" label="Chargement des paramètres..." />;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
           Notifications
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Contrôlez comment vous recevez les notifications
        </p>
      </div>

      {/* Notification Preferences */}
      <Card className="p-6 space-y-6">
        {/* Email Notifications */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-text-primary">
                📧 Notifications par email
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                Recevoir les notifications importantes par email
              </p>
            </div>
            <button
              onClick={() => handleToggle('email')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.email ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.email ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-border" />

        {/* Realtime Notifications */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-text-primary">
                ⚡ Notifications en temps réel
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                Recevoir les notifications instantanées dans l'application
              </p>
            </div>
            <button
              onClick={() => handleToggle('realtime')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.realtime ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.realtime ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-border" />

        {/* Summary */}
        <div className="p-4 bg-bg-surface-hover rounded">
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">État actuel :</span>{' '}
            {formData.email && formData.realtime
              ? '✓ Toutes les notifications activées'
              : formData.email || formData.realtime
                ? '◐ Notifications partielles'
                : '✕ Toutes les notifications désactivées'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={updateMutation.isPending}
          >
            Enregistrer les modifications
          </Button>
        </div>
      </Card>

      {/* Info Box */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <h3 className="font-semibold text-text-primary mb-2">
          💡 À propos des notifications
        </h3>
        <p className="text-sm text-text-secondary space-y-2">
          <div>
            • Les notifications par email sont utiles pour rester informé même
            quand vous n'êtes pas connecté
          </div>
          <div>
            • Les notifications en temps réel vous alertent immédiatement au
            sein de l'application
          </div>
          <div>
            • Les événements incluent les tâches assignées, les changements de
            statut, et les commentaires
          </div>
        </p>
      </Card>
    </div>
  );
}
