'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useDeleteTemplate,
  useInstantiateTemplate,
  useTemplates,
} from '@/lib/hooks/useTemplates';
import { useAuthStore } from '@/lib/stores/auth.store';
import { getApiError } from '@/lib/utils/api-error';
import { toast } from '@/lib/stores/toast.store';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import { LayoutTemplate, Lock, Trash2 } from 'lucide-react';

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Création d'un projet à partir d'un modèle.
 *
 * Le modèle porte des décalages relatifs : c'est la date de démarrage saisie
 * ici qui replace toutes les tâches sur un calendrier réel.
 */
export default function TemplatePickerModal({
  isOpen,
  onClose,
}: TemplatePickerModalProps) {
  const router = useRouter();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const { data: templates, isLoading } = useTemplates();
  const instantiate = useInstantiateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );

  const handleCreate = () => {
    if (!selectedId) {
      toast.error('Sélectionnez un modèle');
      return;
    }
    if (!name.trim()) {
      toast.error('Nom du projet requis');
      return;
    }

    instantiate.mutate(
      {
        templateId: selectedId,
        name: name.trim(),
        startDate: new Date(`${startDate}T00:00:00`).toISOString(),
      },
      {
        onSuccess: (project) => {
          toast.success(
            `Projet créé avec ${project.taskCount} tâche${project.taskCount > 1 ? 's' : ''}`
          );
          onClose();
          router.push(`/projects/${project.id}/kanban`);
        },
        onError: (err) => toast.error(getApiError(err), { title: 'Échec' }),
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Créer depuis un modèle"
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreate}
            isLoading={instantiate.isPending}
            disabled={!selectedId}
          >
            Créer le projet
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {isLoading ? (
          <Spinner centered label="Chargement des modèles..." />
        ) : !templates || templates.length === 0 ? (
          <div className="text-center py-8">
            <LayoutTemplate className="w-10 h-10 text-text-weak mx-auto mb-3" />
            <p className="text-text-primary font-medium">Aucun modèle</p>
            <p className="text-sm text-text-secondary mt-1">
              Depuis les paramètres d&apos;un projet, utilisez «&nbsp;Enregistrer
              comme modèle&nbsp;» pour en créer un.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(template.id);
                    // Pré-remplir le nom fait gagner un geste dans le cas
                    // courant : on repart d'un modèle sous le même intitulé.
                    if (!name.trim()) setName(template.name);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedId === template.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-bg-surface-hover'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary flex items-center gap-1.5">
                        {template.name}
                        {!template.isShared && (
                          <Lock
                            className="w-3 h-3 text-text-secondary"
                            aria-label="Modèle privé"
                          />
                        )}
                      </p>
                      {template.description && (
                        <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                      <p className="text-xs text-text-weak mt-1">
                        {template._count.tasks} tâche
                        {template._count.tasks > 1 ? 's' : ''}
                        {template.createdBy && (
                          <>
                            {' '}
                            · {template.createdBy.firstName}{' '}
                            {template.createdBy.lastName}
                          </>
                        )}
                      </p>
                    </div>

                    {/* Suppression réservée à l'auteur ; le serveur autorise
                        aussi les ADMIN globaux et refusera sinon. */}
                    {template.createdById === currentUserId && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTemplate.mutate(template.id, {
                            onSuccess: () => {
                              toast.success('Modèle supprimé');
                              if (selectedId === template.id) {
                                setSelectedId(null);
                              }
                            },
                            onError: (err) => toast.error(getApiError(err)),
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.click();
                        }}
                        className="shrink-0 text-critical p-1"
                        aria-label={`Supprimer le modèle ${template.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {selectedId && (
              <div className="space-y-3 pt-3 border-t border-border">
                <Input
                  label="Nom du projet"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Refonte site vitrine"
                />
                <Input
                  label="Date de démarrage"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <p className="text-xs text-text-secondary">
                  Les tâches du modèle seront replacées à partir de cette date,
                  en conservant leurs durées et leurs dépendances.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
