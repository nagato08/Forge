'use client';

import { useState } from 'react';
import {
  useAddChecklistItem,
  useChecklist,
  useDeleteChecklistItem,
  useUpdateChecklistItem,
} from '@/lib/hooks/useChecklist';
import { getApiError } from '@/lib/utils/api-error';
import { toast } from '@/lib/stores/toast.store';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { ListChecks, Plus, Trash2 } from 'lucide-react';

interface TaskChecklistProps {
  taskId: string;
  /** Faux en lecture seule : les cases restent visibles mais inertes. */
  canEdit: boolean;
}

/**
 * Liste de contrôle d'une tâche.
 *
 * Volontairement plus légère qu'une sous-tâche : pas de dates, pas
 * d'assignation, pas de statut. Sert à découper le travail d'une tâche sans
 * créer d'objets à gérer.
 */
export default function TaskChecklist({ taskId, canEdit }: TaskChecklistProps) {
  const { data: items, isLoading } = useChecklist(taskId);
  const addItem = useAddChecklistItem();
  const updateItem = useUpdateChecklistItem();
  const deleteItem = useDeleteChecklistItem();

  const [label, setLabel] = useState('');

  const handleAdd = () => {
    const trimmed = label.trim();
    if (!trimmed) return;

    addItem.mutate(
      { taskId, label: trimmed },
      {
        onSuccess: () => setLabel(''),
        onError: (err) => toast.error(getApiError(err)),
      }
    );
  };

  const doneCount = items?.filter((i) => i.done).length ?? 0;
  const total = items?.length ?? 0;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-primary" />
          Liste de contrôle
        </h2>
        {total > 0 && (
          <span className="text-sm text-text-secondary">
            {doneCount}/{total}
          </span>
        )}
      </div>

      {total > 0 && (
        <div className="h-1.5 bg-bg-surface-hover rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-success transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-text-secondary">Chargement…</p>
      ) : total === 0 ? (
        <p className="text-sm text-text-secondary mb-3">
          Aucun élément. Découpez la tâche en points vérifiables.
        </p>
      ) : (
        <ul className="space-y-1 mb-3">
          {items!.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 group py-1 px-2 rounded hover:bg-bg-surface-hover"
            >
              <input
                type="checkbox"
                checked={item.done}
                disabled={!canEdit || updateItem.isPending}
                onChange={(e) =>
                  updateItem.mutate(
                    { taskId, itemId: item.id, done: e.target.checked },
                    { onError: (err) => toast.error(getApiError(err)) }
                  )
                }
                className="rounded border-border cursor-pointer disabled:cursor-not-allowed"
                aria-label={item.label}
              />
              <span
                className={`flex-1 text-sm ${
                  item.done
                    ? 'text-text-secondary line-through'
                    : 'text-text-primary'
                }`}
              >
                {item.label}
              </span>
              {canEdit && (
                <button
                  onClick={() =>
                    deleteItem.mutate(
                      { taskId, itemId: item.id },
                      { onError: (err) => toast.error(getApiError(err)) }
                    )
                  }
                  className="opacity-0 group-hover:opacity-100 text-critical transition-opacity"
                  aria-label={`Supprimer « ${item.label} »`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <div className="flex items-center gap-2">
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Ajouter un élément…"
            className="flex-1"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAdd}
            isLoading={addItem.isPending}
            className="shrink-0"
            aria-label="Ajouter"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}
    </Card>
  );
}
