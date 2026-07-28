'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGantt } from '@/lib/hooks/usePlanning';
import { useProjectRole } from '@/lib/hooks/useProjects';
import { useRescheduleTask, useSetBaseline } from '@/lib/hooks/useSchedule';
import { useCreateMilestone, useDeleteMilestone } from '@/lib/hooks/useMilestones';
import { getApiError } from '@/lib/utils/api-error';
import { toast } from '@/lib/stores/toast.store';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import GanttBar from '@/components/planning/GanttBar';
import {
  BarChart3,
  Flag,
  Info,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
/** Largeur d'un jour, en pixels. Fixe : la frise défile horizontalement. */
const PIXELS_PER_DAY = 24;
const LABEL_WIDTH = 220;

export default function GanttPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data, isLoading, error } = useGantt(projectId);
  // Replanifier engage toute l'équipe : réservé aux gestionnaires.
  const { canManage } = useProjectRole(projectId);

  const rescheduleMutation = useRescheduleTask();
  const baselineMutation = useSetBaseline();
  const createMilestone = useCreateMilestone();
  const deleteMilestone = useDeleteMilestone();

  // Origine de repli quand rien n'est date. Fige au montage : lire l'heure
  // pendant le rendu produirait un resultat different a chaque passe.
  const [fallbackNow] = useState(() => Date.now());
  const [showBaseline, setShowBaseline] = useState(false);
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [milestoneName, setMilestoneName] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('');

  // Stabilises : sans useMemo, `?? []` cree un nouveau tableau a chaque
  // rendu et invaliderait le calcul de la frise en permanence.
  const tasks = useMemo(() => data?.tasks ?? [], [data?.tasks]);
  const milestones = useMemo(() => data?.milestones ?? [], [data?.milestones]);

  // Bornes de la frise : toutes les tâches datées, plus les jalons, avec une
  // marge d'un jour de chaque côté pour que rien ne colle au bord.
  const timeline = useMemo(() => {
    const times = [
      ...tasks.flatMap((t) =>
        [t.startDate, t.endDate, t.baselineStart, t.baselineEnd]
          .filter(Boolean)
          .map((d) => new Date(d as string).getTime())
      ),
      ...milestones.map((m) => new Date(m.date).getTime()),
    ];

    if (times.length === 0) {
      return { start: fallbackNow, end: fallbackNow + 30 * MS_PER_DAY, days: 30 };
    }

    const start = Math.min(...times) - MS_PER_DAY;
    const end = Math.max(...times) + MS_PER_DAY;
    return {
      start,
      end,
      days: Math.max(1, Math.ceil((end - start) / MS_PER_DAY)),
    };
  }, [tasks, milestones, fallbackNow]);

  const dayTicks = useMemo(() => {
    const ticks: { date: Date; left: number }[] = [];
    for (let i = 0; i <= timeline.days; i++) {
      const date = new Date(timeline.start + i * MS_PER_DAY);
      // Un repère par semaine : un par jour serait illisible.
      if (date.getDay() === 1) {
        ticks.push({ date, left: i * PIXELS_PER_DAY });
      }
    }
    return ticks;
  }, [timeline]);

  const handleReschedule = (taskId: string, start: Date, end: Date) => {
    rescheduleMutation.mutate(
      {
        projectId,
        taskId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      {
        onSuccess: (result) => {
          // On annonce la cascade : l'utilisateur voit d'autres barres bouger
          // et doit comprendre pourquoi.
          toast.success(
            result.cascadedCount > 0
              ? `Tâche déplacée — ${result.cascadedCount} tâche${
                  result.cascadedCount > 1 ? 's' : ''
                } repoussée${result.cascadedCount > 1 ? 's' : ''} par dépendance`
              : 'Tâche déplacée'
          );
        },
        onError: (err) =>
          toast.error(getApiError(err), { title: 'Replanification refusée' }),
      }
    );
  };

  const handleCreateMilestone = () => {
    if (!milestoneName.trim() || !milestoneDate) {
      toast.error('Nom et date requis');
      return;
    }

    createMilestone.mutate(
      {
        projectId,
        name: milestoneName.trim(),
        date: new Date(`${milestoneDate}T12:00:00`).toISOString(),
      },
      {
        onSuccess: () => {
          toast.success('Jalon ajouté');
          setMilestoneModalOpen(false);
          setMilestoneName('');
          setMilestoneDate('');
        },
        onError: (err) => toast.error(getApiError(err)),
      }
    );
  };

  if (isLoading) {
    return <Spinner centered size="lg" label="Chargement du diagramme..." />;
  }

  if (error) {
    return (
      <Alert
        type="error"
        title="Erreur"
        message="Impossible de charger le diagramme Gantt"
      />
    );
  }

  const plannedTasks = tasks.filter((t) => t.startDate && t.endDate);
  const unplannedCount = tasks.length - plannedTasks.length;

  return (
    <div className="space-y-4">
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">
            Diagramme de Gantt
          </h2>
          <p className="text-sm text-text-secondary">
            {canManage
              ? 'Glissez une barre pour la déplacer, son bord droit pour l’allonger.'
              : 'Vue en lecture seule — seuls les gestionnaires peuvent replanifier.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {data?.hasBaseline && (
            <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={showBaseline}
                onChange={(e) => setShowBaseline(e.target.checked)}
                className="rounded border-border"
              />
              Afficher la référence
            </label>
          )}

          {canManage && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setMilestoneModalOpen(true)}
                className="flex items-center gap-1.5"
              >
                <Flag className="w-4 h-4" />
                Jalon
              </Button>

              <Button
                variant="secondary"
                size="sm"
                isLoading={baselineMutation.isPending}
                onClick={() =>
                  baselineMutation.mutate(projectId, {
                    onSuccess: (r) => {
                      toast.success(
                        `Référence enregistrée sur ${r.taskCount} tâches`
                      );
                      setShowBaseline(true);
                    },
                    onError: (err) => toast.error(getApiError(err)),
                  })
                }
                className="flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                Figer la référence
              </Button>
            </>
          )}
        </div>
      </div>

      {unplannedCount > 0 && (
        <Card className="p-3 flex items-start gap-2 border-warning/30 bg-warning/5">
          <Info className="w-4 h-4 text-warning mt-0.5 shrink-0" />
          <p className="text-sm text-text-secondary">
            {unplannedCount} tâche{unplannedCount > 1 ? 's' : ''} sans dates
            n&apos;apparaî{unplannedCount > 1 ? 'ssent' : 't'} pas ici. Renseignez
            un début et une fin pour {unplannedCount > 1 ? 'les' : 'la'} planifier.
          </p>
        </Card>
      )}

      {plannedTasks.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-text-weak mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            Aucune tâche planifiée
          </h3>
          <p className="text-text-secondary">
            Ajoutez des dates de début et de fin à vos tâches.
          </p>
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="flex">
            {/* Colonne des libellés, figée */}
            <div
              className="shrink-0 border-r border-border bg-bg-surface"
              style={{ width: LABEL_WIDTH }}
            >
              <div className="h-10 border-b border-border px-3 flex items-center text-xs font-medium text-text-secondary">
                Tâche
              </div>
              {plannedTasks.map((task) => (
                <div
                  key={task.id}
                  className="h-8 px-3 flex items-center border-b border-border/50 last:border-0"
                >
                  <span className="text-xs text-text-primary truncate">
                    {task.title}
                  </span>
                  {task.driftDays !== null && task.driftDays !== 0 && (
                    <span
                      className={`ml-auto text-[10px] font-medium shrink-0 ${
                        task.driftDays > 0 ? 'text-critical' : 'text-success'
                      }`}
                      title="Écart avec le planning de référence"
                    >
                      {task.driftDays > 0 ? '+' : ''}
                      {task.driftDays} j
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Frise, défilante */}
            <div className="flex-1 overflow-x-auto">
              <div
                className="relative"
                style={{ width: timeline.days * PIXELS_PER_DAY }}
              >
                {/* En-tête : repères hebdomadaires */}
                <div className="h-10 border-b border-border relative">
                  {dayTicks.map((tick) => (
                    <div
                      key={tick.left}
                      className="absolute top-0 h-full flex items-center"
                      style={{ left: tick.left }}
                    >
                      <span className="text-[10px] text-text-secondary pl-1 whitespace-nowrap">
                        {tick.date.toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Lignes verticales de repère */}
                {dayTicks.map((tick) => (
                  <div
                    key={`line-${tick.left}`}
                    className="absolute top-10 bottom-0 w-px bg-border/40"
                    style={{ left: tick.left }}
                  />
                ))}

                {/* Jalons : losanges sur toute la hauteur */}
                {milestones.map((milestone) => {
                  const left =
                    ((new Date(milestone.date).getTime() - timeline.start) /
                      MS_PER_DAY) *
                    PIXELS_PER_DAY;
                  return (
                    <div
                      key={milestone.id}
                      className="absolute top-10 bottom-0 group"
                      style={{ left }}
                    >
                      <div
                        className={`w-px h-full ${
                          milestone.overdue ? 'bg-critical/50' : 'bg-primary/40'
                        }`}
                      />
                      <span
                        className={`absolute -top-1 -left-1.5 w-3 h-3 rotate-45 border ${
                          milestone.reached
                            ? 'bg-success border-success'
                            : milestone.overdue
                              ? 'bg-critical border-critical'
                              : 'bg-primary border-primary'
                        }`}
                        title={`${milestone.name} — ${new Date(
                          milestone.date
                        ).toLocaleDateString('fr-FR')}${
                          milestone.overdue ? ' (en retard)' : ''
                        }`}
                      />
                      {canManage && (
                        <button
                          onClick={() =>
                            deleteMilestone.mutate(
                              { projectId, milestoneId: milestone.id },
                              {
                                onSuccess: () => toast.success('Jalon supprimé'),
                                onError: (err) =>
                                  toast.error(getApiError(err)),
                              }
                            )
                          }
                          className="absolute -top-6 -left-2 opacity-0 group-hover:opacity-100 text-critical"
                          aria-label={`Supprimer le jalon ${milestone.name}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Barres */}
                <div className="relative">
                  {plannedTasks.map((task) => (
                    <GanttBar
                      key={task.id}
                      task={task}
                      timelineStart={timeline.start}
                      pixelsPerDay={PIXELS_PER_DAY}
                      editable={canManage}
                      showBaseline={showBaseline}
                      onReschedule={(start, end) =>
                        handleReschedule(task.id, start, end)
                      }
                      onSelect={() =>
                        router.push(`/projects/${projectId}/tasks/${task.id}`)
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Légende */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded bg-text-secondary" /> À faire
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded bg-primary" /> En cours
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded bg-success" /> Terminé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rotate-45 bg-primary" /> Jalon
        </span>
        {data?.hasBaseline && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded bg-text-weak/30" /> Référence
          </span>
        )}
      </div>

      {/* Création de jalon */}
      <Modal
        isOpen={milestoneModalOpen}
        onClose={() => setMilestoneModalOpen(false)}
        title="Nouveau jalon"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setMilestoneModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateMilestone}
              isLoading={createMilestone.isPending}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            label="Nom du jalon"
            value={milestoneName}
            onChange={(e) => setMilestoneName(e.target.value)}
            placeholder="Livraison v1"
          />
          <Input
            label="Date"
            type="date"
            value={milestoneDate}
            onChange={(e) => setMilestoneDate(e.target.value)}
          />
          <p className="text-xs text-text-secondary">
            Un jalon est un point daté sans durée : livraison, revue, échéance
            contractuelle.
          </p>
        </div>
      </Modal>
    </div>
  );
}
