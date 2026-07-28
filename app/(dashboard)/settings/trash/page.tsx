'use client';

import { useState } from 'react';
import {
  useTrashedProjects,
  useRestoreProject,
  usePurgeProject,
} from '@/lib/hooks/useProjects';
import { getApiError } from '@/lib/utils/api-error';
import { toast } from '@/lib/stores/toast.store';
import Spinner from '@/components/ui/Spinner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  FolderX,
  ListChecks,
  Users,
  FileText,
} from 'lucide-react';

/**
 * Corbeille des projets supprimés.
 *
 * Ne couvre que les projets : c'est la seule entité réellement soft-deletée
 * dans l'application. Une tâche ou un document supprimés le sont
 * définitivement dès le clic — rien à restaurer pour eux ici.
 *
 * La visibilité suit exactement le droit de suppression : un propriétaire ne
 * voit que ses propres projets, un ADMIN global les voit tous. Un compte qui
 * ne peut pas posséder de projet (EMPLOYEE) n'a rien à y faire — le lien est
 * masqué pour lui dans la barre latérale.
 */
export default function TrashPage() {
  const { data: projects, isLoading, error } = useTrashedProjects();
  const restoreMutation = useRestoreProject();
  const purgeMutation = usePurgeProject();

  const [purgeTargetId, setPurgeTargetId] = useState<string | null>(null);

  const handleRestore = (projectId: string, name: string) => {
    restoreMutation.mutate(projectId, {
      onSuccess: () => toast.success(`« ${name} » restauré`),
      onError: (err) =>
        toast.error(getApiError(err), { title: 'Restauration impossible' }),
    });
  };

  const handlePurge = () => {
    if (!purgeTargetId) return;
    purgeMutation.mutate(purgeTargetId, {
      onSuccess: () => {
        toast.success('Projet supprimé définitivement');
        setPurgeTargetId(null);
      },
      onError: (err) => {
        toast.error(getApiError(err), { title: 'Suppression impossible' });
        setPurgeTargetId(null);
      },
    });
  };

  if (isLoading) {
    return <Spinner centered size="lg" label="Chargement de la corbeille..." />;
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-critical">Impossible de charger la corbeille</p>
      </Card>
    );
  }

  const purgeTarget = projects?.find((p) => p.id === purgeTargetId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Corbeille</h1>
        <p className="text-sm text-text-secondary mt-1">
          Projets supprimés, restaurables pendant 30 jours avant suppression
          définitive automatique.
        </p>
      </div>

      {!projects || projects.length === 0 ? (
        <Card className="p-12 flex flex-col items-center text-center gap-3">
          <FolderX className="w-10 h-10 text-text-weak" />
          <p className="text-text-secondary">La corbeille est vide</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <Card key={project.id} className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-text-primary truncate">
                      {project.name}
                    </h3>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                        project.daysUntilPurge <= 3
                          ? 'bg-critical/15 text-critical'
                          : 'bg-warning/15 text-warning'
                      }`}
                    >
                      {project.daysUntilPurge === 0
                        ? 'purge imminente'
                        : `${project.daysUntilPurge} j avant purge`}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    Supprimé le{' '}
                    {new Date(project.deletedAt).toLocaleDateString('fr-FR')}{' '}
                    par {project.owner.firstName} {project.owner.lastName}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-text-secondary">
                    <span className="flex items-center gap-1.5">
                      <ListChecks className="w-3.5 h-3.5" />
                      {project._count.tasks} tâche
                      {project._count.tasks > 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {project._count.members} membre
                      {project._count.members > 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      {project._count.documents} document
                      {project._count.documents > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRestore(project.id, project.name)}
                    isLoading={
                      restoreMutation.isPending &&
                      restoreMutation.variables === project.id
                    }
                    className="flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restaurer
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setPurgeTargetId(project.id)}
                    className="flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!purgeTargetId}
        onClose={() => setPurgeTargetId(null)}
        title="Supprimer définitivement"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPurgeTargetId(null)}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handlePurge}
              isLoading={purgeMutation.isPending}
            >
              Supprimer définitivement
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3 p-4 rounded-lg bg-critical/10 border border-critical/30">
          <AlertTriangle className="w-5 h-5 text-critical shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-text-primary">
              Supprimer « {purgeTarget?.name} » définitivement ?
            </p>
            <p className="text-text-secondary mt-1">
              Cette action est irréversible : le projet, ses tâches, documents
              et membres seront effacés sans possibilité de restauration.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
