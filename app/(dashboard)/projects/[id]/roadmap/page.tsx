'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  usePhases,
  useCreatePhase,
  useUpdatePhase,
  useDeletePhase,
  useMilestones,
} from '@/lib/hooks/useMilestones';
import { useProjectRole } from '@/lib/hooks/useProjects';
import { canManage } from '@/lib/utils/project-permissions';
import { getApiError } from '@/lib/utils/api-error';
import { toast } from '@/lib/stores/toast.store';
import Spinner from '@/components/ui/Spinner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { Phase } from '@/lib/types/planning.types';
import {
  Plus,
  Pencil,
  Trash2,
  Milestone as MilestoneIcon,
  Layers,
  ArrowRight,
} from 'lucide-react';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Palette cyclique : de quoi distinguer visuellement des phases voisines. */
const PHASE_COLORS = [
  'bg-primary/70 border-primary',
  'bg-ai/70 border-ai',
  'bg-success/70 border-success',
  'bg-warning/70 border-warning',
  'bg-critical/70 border-critical',
];

interface PhaseFormState {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

const EMPTY_FORM: PhaseFormState = {
  name: '',
  description: '',
  startDate: '',
  endDate: '',
};

/**
 * Feuille de route : vue macro du projet — phases et jalons — distincte du
 * Gantt détaillé des tâches.
 *
 * Les jalons restent gérés depuis l'onglet Gantt, où leur formulaire de
 * création existe déjà : les dupliquer ici aurait coûté une seconde UI pour
 * la même donnée. Cette page les affiche en lecture, alignés sur la même
 * frise que les phases.
 */
export default function RoadmapPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: phases, isLoading: phasesLoading } = usePhases(projectId);
  const { data: milestones, isLoading: milestonesLoading } =
    useMilestones(projectId);
  const { role: myRole } = useProjectRole(projectId);
  const canEdit = canManage(myRole);

  const createMutation = useCreatePhase();
  const updateMutation = useUpdatePhase();
  const deleteMutation = useDeletePhase();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
  const [form, setForm] = useState<PhaseFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Phase | null>(null);

  const isLoading = phasesLoading || milestonesLoading;

  // Bornes de la frise : phases et jalons confondus, avec une marge de
  // quelques jours pour que rien ne colle au bord.
  const timeline = useMemo(() => {
    const times = [
      ...(phases ?? []).flatMap((p) => [
        new Date(p.startDate).getTime(),
        new Date(p.endDate).getTime(),
      ]),
      ...(milestones ?? []).map((m) => new Date(m.date).getTime()),
    ];

    if (times.length === 0) {
      const now = Date.now();
      return { start: now, end: now + 90 * MS_PER_DAY };
    }

    const margin = 3 * MS_PER_DAY;
    return {
      start: Math.min(...times) - margin,
      end: Math.max(...times) + margin,
    };
  }, [phases, milestones]);

  const span = Math.max(1, timeline.end - timeline.start);
  const percentAt = (time: number) => ((time - timeline.start) / span) * 100;

  const monthTicks = useMemo(() => {
    const ticks: { label: string; left: number }[] = [];
    const cursor = new Date(timeline.start);
    cursor.setDate(1);
    while (cursor.getTime() < timeline.end) {
      ticks.push({
        label: cursor.toLocaleDateString('fr-FR', {
          month: 'short',
          year: 'numeric',
        }),
        left: percentAt(cursor.getTime()),
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return ticks;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeline.start, timeline.end]);

  const sortedPhases = useMemo(
    () => (phases ?? []).slice().sort((a, b) => a.order - b.order),
    [phases]
  );

  const openCreateModal = () => {
    setEditingPhase(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (phase: Phase) => {
    setEditingPhase(phase);
    setForm({
      name: phase.name,
      description: phase.description ?? '',
      startDate: phase.startDate.split('T')[0],
      endDate: phase.endDate.split('T')[0],
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      toast.error('Nom et dates sont requis');
      return;
    }

    const onSuccess = () => {
      toast.success(editingPhase ? 'Phase modifiée' : 'Phase créée');
      setModalOpen(false);
    };
    const onError = (err: unknown) =>
      toast.error(getApiError(err), { title: 'Échec de l’enregistrement' });

    if (editingPhase) {
      updateMutation.mutate(
        {
          projectId,
          phaseId: editingPhase.id,
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          startDate: form.startDate,
          endDate: form.endDate,
        },
        { onSuccess, onError }
      );
    } else {
      createMutation.mutate(
        {
          projectId,
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          startDate: form.startDate,
          endDate: form.endDate,
          order: sortedPhases.length,
        },
        { onSuccess, onError }
      );
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(
      { projectId, phaseId: deleteTarget.id },
      {
        onSuccess: () => {
          toast.success('Phase supprimée');
          setDeleteTarget(null);
        },
        onError: (err) => {
          toast.error(getApiError(err), { title: 'Suppression impossible' });
          setDeleteTarget(null);
        },
      }
    );
  };

  if (isLoading) {
    return <Spinner centered size="lg" label="Chargement de la feuille de route..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            Feuille de route
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Vue macro du projet — phases et jalons clés, sans le détail des
            tâches.
          </p>
        </div>
        {canEdit && (
          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Nouvelle phase
          </Button>
        )}
      </div>

      {sortedPhases.length === 0 && (milestones ?? []).length === 0 ? (
        <Card className="p-12 flex flex-col items-center text-center gap-3">
          <Layers className="w-10 h-10 text-text-weak" />
          <p className="text-text-secondary">
            Aucune phase ni jalon pour ce projet
          </p>
          {canEdit && (
            <Button variant="secondary" size="sm" onClick={openCreateModal}>
              Ajouter la première phase
            </Button>
          )}
        </Card>
      ) : (
        <Card className="p-6 overflow-x-auto">
          <div className="min-w-[720px]">
            {/* Repères mensuels */}
            <div className="relative h-6 mb-2 border-b border-border">
              {monthTicks.map((tick, i) => (
                <span
                  key={i}
                  className="absolute text-[11px] text-text-secondary -translate-x-1/2"
                  style={{ left: `${tick.left}%` }}
                >
                  {tick.label}
                </span>
              ))}
            </div>

            {/* Jalons : une seule ligne, diamants positionnés par date */}
            {(milestones ?? []).length > 0 && (
              <div className="relative h-8 mb-2">
                {(milestones ?? []).map((m) => (
                  <div
                    key={m.id}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
                    style={{ left: `${percentAt(new Date(m.date).getTime())}%` }}
                    title={`${m.name} — ${new Date(m.date).toLocaleDateString('fr-FR')}`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rotate-45 border-2 ${
                        m.reached
                          ? 'bg-success border-success'
                          : m.overdue
                            ? 'bg-critical border-critical'
                            : 'bg-bg-surface border-primary'
                      }`}
                    />
                    <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-[10px] text-text-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-bg-surface border border-border rounded px-1.5 py-0.5 z-10">
                      {m.name}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Phases : une ligne par phase */}
            <div className="space-y-2">
              {sortedPhases.map((phase, index) => {
                const left = percentAt(new Date(phase.startDate).getTime());
                const right = percentAt(new Date(phase.endDate).getTime());
                const width = Math.max(1, right - left);
                const color = PHASE_COLORS[index % PHASE_COLORS.length];

                return (
                  <div key={phase.id} className="relative h-10 group">
                    <div
                      className={`absolute top-1 bottom-1 rounded-lg border ${color} flex items-center px-3 overflow-hidden`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                    >
                      <span className="text-xs font-medium text-white truncate">
                        {phase.name}
                      </span>
                    </div>
                    {canEdit && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-bg-surface border border-border rounded-lg px-1 py-0.5 shadow-sm">
                        <button
                          onClick={() => openEditModal(phase)}
                          className="p-1 text-text-secondary hover:text-primary"
                          aria-label={`Modifier ${phase.name}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(phase)}
                          className="p-1 text-text-secondary hover:text-critical"
                          aria-label={`Supprimer ${phase.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      <Card className="p-4 flex items-center gap-2 text-sm text-text-secondary">
        <MilestoneIcon className="w-4 h-4 shrink-0" />
        <span>Les jalons se créent depuis l’onglet Gantt.</span>
        <Link
          href={`/projects/${projectId}/gantt`}
          className="text-primary hover:underline flex items-center gap-1"
        >
          Ouvrir le Gantt
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </Card>

      {/* Détail des phases, en liste — complète la frise pour les dates exactes */}
      {sortedPhases.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-text-primary mb-3">Détail des phases</h3>
          <div className="space-y-2">
            {sortedPhases.map((phase) => (
              <div
                key={phase.id}
                className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-text-primary font-medium truncate">
                    {phase.name}
                  </p>
                  {phase.description && (
                    <p className="text-text-secondary text-xs mt-0.5">
                      {phase.description}
                    </p>
                  )}
                </div>
                <p className="text-text-secondary text-xs whitespace-nowrap ml-4">
                  {new Date(phase.startDate).toLocaleDateString('fr-FR')} →{' '}
                  {new Date(phase.endDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPhase ? 'Modifier la phase' : 'Nouvelle phase'}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingPhase ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            label="Nom"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Conception"
          />
          <Input
            label="Description (optionnelle)"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Début"
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, startDate: e.target.value }))
              }
            />
            <Input
              label="Fin"
              type="date"
              value={form.endDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, endDate: e.target.value }))
              }
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer la phase"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteTarget(null)}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
            >
              Supprimer
            </Button>
          </div>
        }
      >
        <p className="text-sm text-text-secondary">
          Supprimer « {deleteTarget?.name} » ? Cette action ne touche à aucune
          tâche, seule la phase disparaît de la feuille de route.
        </p>
      </Modal>
    </div>
  );
}
