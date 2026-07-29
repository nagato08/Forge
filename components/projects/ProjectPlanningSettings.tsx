'use client';

import { useEffect, useState } from 'react';
import {
  useProjectSettings,
  useUpdateProjectSettings,
} from '@/lib/hooks/useProjectSettings';
import {
  ProjectMethodology,
  ChargeUnit,
} from '@/lib/api/project-settings.api';
import { getApiError } from '@/lib/utils/api-error';
import { toast } from '@/lib/stores/toast.store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import { CalendarClock, Save, X } from 'lucide-react';

const WEEKDAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

interface ProjectPlanningSettingsProps {
  projectId: string;
  /** Lecture pour tous, édition réservée aux gestionnaires du projet. */
  canManage: boolean;
}

/**
 * Panneau de pilotage du projet : calendrier ouvré, seuils d'alerte,
 * configuration générale.
 *
 * Alimente aujourd'hui le calcul de charge (onglet Charge) : le seuil de
 * surcharge suit les heures/jour et jours ouvrés définis ici, plutôt que la
 * constante 8h/40h appliquée jusque-là à tous les projets sans distinction.
 *
 * Ne touche pas encore à la replanification du Gantt, qui continue de
 * raisonner en jours calendaires bruts sans tenir compte des jours fériés
 * déclarés ici — chantier à part, plus lourd.
 */
export default function ProjectPlanningSettings({
  projectId,
  canManage,
}: ProjectPlanningSettingsProps) {
  const { data: settings, isLoading } = useProjectSettings(projectId);
  const updateMutation = useUpdateProjectSettings(projectId);

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    hoursPerDay: 8,
    workingDays: [1, 2, 3, 4, 5] as number[],
    machineCapacityPerDay: 0,
    lateAlertThresholdDays: 2,
    budgetAmount: '' as number | '',
    currency: 'EUR',
    methodology: 'AGILE' as ProjectMethodology,
    chargeUnit: 'HOURS' as ChargeUnit,
  });

  // Le formulaire se réaligne sur le serveur à chaque chargement ou
  // sauvegarde réussie ; il ne doit pas réinitialiser un brouillon en cours
  // de saisie sur chaque re-rendu.
  useEffect(() => {
    if (!settings || editMode) return;
    setForm({
      hoursPerDay: settings.hoursPerDay,
      workingDays: settings.workingDays,
      machineCapacityPerDay: settings.machineCapacityPerDay,
      lateAlertThresholdDays: settings.lateAlertThresholdDays,
      budgetAmount: settings.budgetAmount ?? '',
      currency: settings.currency,
      methodology: settings.methodology,
      chargeUnit: settings.chargeUnit,
    });
  }, [settings, editMode]);

  const toggleDay = (day: number) => {
    setForm((f) => ({
      ...f,
      workingDays: f.workingDays.includes(day)
        ? f.workingDays.filter((d) => d !== day)
        : [...f.workingDays, day].sort(),
    }));
  };

  const handleSave = () => {
    updateMutation.mutate(
      {
        ...form,
        budgetAmount: form.budgetAmount === '' ? undefined : form.budgetAmount,
      },
      {
        onSuccess: () => {
          toast.success('Paramètres mis à jour');
          setEditMode(false);
        },
        onError: (err) =>
          toast.error(getApiError(err), { title: 'Échec de la mise à jour' }),
      }
    );
  };

  if (isLoading || !settings) {
    return (
      <Card className="p-6">
        <Spinner size="sm" label="Chargement des paramètres..." />
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-text-secondary" />
          <h3 className="font-semibold text-text-primary">
            Calendrier &amp; pilotage
          </h3>
        </div>
        {canManage && !editMode && (
          <Button variant="secondary" size="sm" onClick={() => setEditMode(true)}>
            Modifier
          </Button>
        )}
      </div>

      {!editMode ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-text-secondary">Heures / jour</p>
            <p className="text-text-primary font-medium">
              {settings.hoursPerDay} h
            </p>
          </div>
          <div>
            <p className="text-text-secondary">Jours ouvrés</p>
            <p className="text-text-primary font-medium">
              {settings.workingDays
                .slice()
                .sort()
                .map((d) => WEEKDAY_LABELS[d])
                .join(', ')}
            </p>
          </div>
          <div>
            <p className="text-text-secondary">Alerte retard</p>
            <p className="text-text-primary font-medium">
              {settings.lateAlertThresholdDays} j avant échéance
            </p>
          </div>
          <div>
            <p className="text-text-secondary">Capacité machine</p>
            <p className="text-text-primary font-medium">
              {settings.machineCapacityPerDay > 0
                ? `${settings.machineCapacityPerDay} h/j`
                : 'non suivie'}
            </p>
          </div>
          <div>
            <p className="text-text-secondary">Budget</p>
            <p className="text-text-primary font-medium">
              {settings.budgetAmount
                ? `${settings.budgetAmount} ${settings.currency}`
                : 'non défini'}
            </p>
          </div>
          <div>
            <p className="text-text-secondary">Méthodologie</p>
            <p className="text-text-primary font-medium">
              {settings.methodology === 'AGILE' ? 'Agile' : 'Classique'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-primary">
                Heures par jour
              </label>
              <Input
                type="number"
                min={1}
                max={24}
                value={form.hoursPerDay}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    hoursPerDay: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary">
                Alerte retard (jours avant échéance)
              </label>
              <Input
                type="number"
                min={0}
                max={60}
                value={form.lateAlertThresholdDays}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    lateAlertThresholdDays: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">
              Jours ouvrés
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {WEEKDAY_LABELS.map((label, day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    form.workingDays.includes(day)
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-border text-text-secondary hover:bg-bg-surface-hover'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-primary">
                Capacité machine (h/jour, 0 = non suivie)
              </label>
              <Input
                type="number"
                min={0}
                value={form.machineCapacityPerDay}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    machineCapacityPerDay: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-sm font-medium text-text-primary">
                  Budget
                </label>
                <Input
                  type="number"
                  min={0}
                  placeholder="Non défini"
                  value={form.budgetAmount}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      budgetAmount:
                        e.target.value === '' ? '' : Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="w-24">
                <label className="text-sm font-medium text-text-primary">
                  Devise
                </label>
                <Input
                  value={form.currency}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, currency: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">
              Méthodologie
            </label>
            <div className="flex gap-2">
              {(['AGILE', 'CLASSIC'] as ProjectMethodology[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, methodology: m }))}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    form.methodology === m
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-border text-text-secondary hover:bg-bg-surface-hover'
                  }`}
                >
                  {m === 'AGILE' ? 'Agile' : 'Classique'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditMode(false)}
              className="flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              Annuler
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={updateMutation.isPending}
              className="flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Enregistrer
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
