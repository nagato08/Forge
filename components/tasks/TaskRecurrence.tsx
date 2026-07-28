'use client';

import { useState } from 'react';
import { useRemoveRecurrence, useSetRecurrence } from '@/lib/hooks/useChecklist';
import {
  RecurrenceFrequency,
  TaskRecurrence as Recurrence,
} from '@/lib/types/planning.types';
import { getApiError } from '@/lib/utils/api-error';
import { toast } from '@/lib/stores/toast.store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Repeat, Trash2 } from 'lucide-react';

const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  [RecurrenceFrequency.DAILY]: 'jour(s)',
  [RecurrenceFrequency.WEEKLY]: 'semaine(s)',
  [RecurrenceFrequency.MONTHLY]: 'mois',
};

interface TaskRecurrenceProps {
  taskId: string;
  recurrence: Recurrence | null | undefined;
  /** Définir une répétition engage l'équipe : réservé aux gestionnaires. */
  canManage: boolean;
}

export default function TaskRecurrenceCard({
  taskId,
  recurrence,
  canManage,
}: TaskRecurrenceProps) {
  const setRecurrence = useSetRecurrence();
  const removeRecurrence = useRemoveRecurrence();

  const [editing, setEditing] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    recurrence?.frequency ?? RecurrenceFrequency.WEEKLY
  );
  const [interval, setIntervalValue] = useState(recurrence?.interval ?? 1);
  const [until, setUntil] = useState(recurrence?.until?.slice(0, 10) ?? '');

  // Sans droits ni règle existante, la carte n'apporte rien.
  if (!canManage && !recurrence) return null;

  const handleSave = () => {
    setRecurrence.mutate(
      {
        taskId,
        frequency,
        interval,
        until: until ? new Date(`${until}T23:59:59`).toISOString() : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Répétition enregistrée');
          setEditing(false);
        },
        onError: (err) => toast.error(getApiError(err)),
      }
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Repeat className="w-5 h-5 text-primary" />
          Répétition
        </h2>
        {recurrence && canManage && !editing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              removeRecurrence.mutate(taskId, {
                onSuccess: () => toast.success('Répétition supprimée'),
                onError: (err) => toast.error(getApiError(err)),
              })
            }
            className="text-critical"
            aria-label="Supprimer la répétition"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {recurrence && !editing ? (
        <div className="space-y-2">
          <p className="text-sm text-text-primary">
            Tous les {recurrence.interval}{' '}
            {FREQUENCY_LABELS[recurrence.frequency]}
            {recurrence.until && (
              <>
                , jusqu&apos;au{' '}
                {new Date(recurrence.until).toLocaleDateString('fr-FR')}
              </>
            )}
          </p>
          <p className="text-xs text-text-secondary">
            La prochaine occurrence sera créée quand cette tâche passera en
            «&nbsp;Terminé&nbsp;», pas à l&apos;avance.
          </p>
          {!recurrence.active && (
            <p className="text-xs text-warning">
              Série terminée : la date de fin est dépassée.
            </p>
          )}
          {canManage && (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              Modifier
            </Button>
          )}
        </div>
      ) : canManage ? (
        editing || !recurrence ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Tous les"
                type="number"
                min={1}
                value={interval}
                onChange={(e) =>
                  setIntervalValue(Math.max(1, Number(e.target.value)))
                }
              />
              <Select
                label="Période"
                value={frequency}
                onChange={(e) =>
                  setFrequency(e.target.value as RecurrenceFrequency)
                }
                options={[
                  { value: RecurrenceFrequency.DAILY, label: 'Jour(s)' },
                  { value: RecurrenceFrequency.WEEKLY, label: 'Semaine(s)' },
                  { value: RecurrenceFrequency.MONTHLY, label: 'Mois' },
                ]}
              />
            </div>

            <Input
              label="Jusqu'au (optionnel)"
              type="date"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
            />

            <p className="text-xs text-text-secondary">
              Une nouvelle occurrence sera créée à chaque fois que la tâche est
              terminée, avec les mêmes assignés et une liste de contrôle vierge.
            </p>

            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                isLoading={setRecurrence.isPending}
              >
                Enregistrer
              </Button>
              {editing && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditing(false)}
                >
                  Annuler
                </Button>
              )}
            </div>
          </div>
        ) : null
      ) : null}
    </Card>
  );
}
