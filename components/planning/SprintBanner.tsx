'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSprints } from '@/lib/hooks/useSprints';
import { Sprint, SprintStatus } from '@/lib/types/planning.types';
import { Repeat, BarChart3, AlertTriangle } from 'lucide-react';

/**
 * Jours calendaires restants avant la fin du sprint, aujourd'hui inclus.
 *
 * Négatif si la date est dépassée : le sprint est en retard, ce qui est
 * précisément l'information qu'on veut faire remonter.
 */
function daysUntil(iso: string, today: number): number {
  const end = new Date(iso);
  end.setHours(23, 59, 59, 999);
  return Math.ceil((end.getTime() - today) / 86_400_000);
}

function formatRemaining(days: number): string {
  if (days < 0) {
    const late = Math.abs(days);
    return `en retard de ${late} j`;
  }
  if (days === 0) return 'dernier jour';
  return `${days} j restant${days > 1 ? 's' : ''}`;
}

/**
 * Décrit l'avancement dans l'unité réellement utilisée par l'équipe.
 *
 * Le serveur bascule sur un décompte en tâches quand aucune n'est estimée :
 * afficher « 0 / 0 points » à une équipe qui n'estime pas donnerait
 * l'impression d'un sprint vide alors qu'il avance.
 */
function describeWork(sprint: Sprint): string {
  if (sprint.usesStoryPoints) {
    return `${sprint.completedWork} / ${sprint.totalWork} points`;
  }
  return `${sprint.doneCount} / ${sprint.taskCount} tâche${
    sprint.taskCount > 1 ? 's' : ''
  }`;
}

interface SprintBannerProps {
  projectId: string;
}

/**
 * Rappel permanent du sprint en cours, affiché sur tous les onglets du projet.
 *
 * Sans lui, démarrer un sprint ne changeait rien de visible : son état ne
 * vivait que dans les onglets Sprints et Burndown, qu'il fallait ouvrir
 * exprès. Le bandeau ramène l'échéance et l'avancement là où l'équipe
 * travaille.
 *
 * Silencieux quand aucun sprint n'est actif : un projet mené sans sprints ne
 * doit pas porter un bandeau vide.
 */
export default function SprintBanner({ projectId }: SprintBannerProps) {
  const { data: sprints } = useSprints(projectId);

  // Figé au montage via l'initialiseur paresseux d'useState : un useMemo
  // appellerait Date.now() pendant le rendu, ce qui est impur et rend le
  // résultat dépendant de l'instant du re-rendu.
  const [today] = useState(() => Date.now());

  const active = sprints?.find((s) => s.status === SprintStatus.ACTIVE);
  if (!active) return null;

  const remaining = daysUntil(active.endDate, today);
  const isLate = remaining < 0;
  const isEmpty = active.taskCount === 0;

  return (
    <div
      className={`rounded-xl border px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2 ${
        isLate
          ? 'border-critical/30 bg-critical/5'
          : 'border-primary/30 bg-primary/5'
      }`}
    >
      <span className="flex items-center gap-2 min-w-0">
        <Repeat
          className={`w-4 h-4 shrink-0 ${
            isLate ? 'text-critical' : 'text-primary'
          }`}
        />
        <span className="text-sm font-semibold text-text-primary truncate">
          {active.name}
        </span>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
            isLate
              ? 'bg-critical/15 text-critical'
              : 'bg-primary/15 text-primary'
          }`}
        >
          {formatRemaining(remaining)}
        </span>
      </span>

      {isEmpty ? (
        // Un sprint sans tâche n'a rien à montrer : on le dit, plutôt que
        // d'afficher une barre à 0 % que l'utilisateur interpreterait comme
        // un retard.
        <span className="flex items-center gap-1.5 text-xs text-warning">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Aucune tâche dans ce sprint —{' '}
          <Link
            href={`/projects/${projectId}/sprints`}
            className="underline hover:no-underline"
          >
            en ajouter
          </Link>
        </span>
      ) : (
        <>
          <span className="flex items-center gap-2 flex-1 min-w-[140px]">
            <span className="h-1.5 flex-1 rounded-full bg-border overflow-hidden">
              <span
                className={`block h-full rounded-full transition-all ${
                  isLate ? 'bg-critical' : 'bg-primary'
                }`}
                style={{ width: `${active.progressPercent}%` }}
              />
            </span>
            <span className="text-xs font-medium text-text-secondary whitespace-nowrap">
              {active.progressPercent}%
            </span>
          </span>

          <span className="text-xs text-text-secondary whitespace-nowrap">
            {describeWork(active)}
          </span>
        </>
      )}

      <Link
        href={`/projects/${projectId}/burndown?sprintId=${active.id}`}
        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline whitespace-nowrap"
      >
        <BarChart3 className="w-3.5 h-3.5" />
        Burndown
      </Link>
    </div>
  );
}
