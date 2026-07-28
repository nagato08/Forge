'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSprints } from '@/lib/hooks/useSprints';
import { SprintStatus } from '@/lib/types/planning.types';

/** Tout le projet, sans distinction de sprint. */
export const SCOPE_ALL = 'all';
/** Uniquement les tâches qui ne sont rattachées à aucun sprint. */
export const SCOPE_BACKLOG = 'backlog';

/** Portée courante : une des deux constantes ci-dessus, ou un id de sprint. */
export type SprintScope = string;

/** Contrat minimal attendu d'une tâche : seul le rattachement compte ici. */
interface HasSprint {
  sprintId?: string | null;
}

/**
 * Portée de sprint appliquée à une liste de tâches.
 *
 * Le Kanban affichait toujours l'intégralité du projet : démarrer un sprint
 * ne changeait donc rien au tableau que l'équipe regarde chaque jour, et la
 * notion de sprint restait cantonnée à ses deux onglets dédiés.
 *
 * Ouvre par défaut sur le sprint actif, à défaut sur le projet entier.
 */
export function useSprintScope(projectId: string) {
  const { data: sprints } = useSprints(projectId);
  const [scope, setScope] = useState<SprintScope>(SCOPE_ALL);

  // Le drapeau rend la pré-sélection définitivement inerte après son unique
  // passage. Sans lui, revenir à « Tout le projet » relancerait l'effet, qui
  // re-sélectionnerait aussitôt le sprint actif : l'option deviendrait
  // impossible à choisir.
  const didAutoSelect = useRef(false);

  useEffect(() => {
    if (didAutoSelect.current || !sprints) return;
    didAutoSelect.current = true;
    const active = sprints.find((s) => s.status === SprintStatus.ACTIVE);
    if (active) setScope(active.id);
  }, [sprints]);

  const filterTasks = useCallback(
    <T extends HasSprint>(tasks: T[]): T[] => {
      if (scope === SCOPE_ALL) return tasks;
      if (scope === SCOPE_BACKLOG) return tasks.filter((t) => !t.sprintId);
      return tasks.filter((t) => t.sprintId === scope);
    },
    [scope]
  );

  return {
    scope,
    setScope,
    filterTasks,
    sprints: sprints ?? [],
    activeSprint: sprints?.find((s) => s.status === SprintStatus.ACTIVE) ?? null,
  };
}
