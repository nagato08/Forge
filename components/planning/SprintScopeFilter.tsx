'use client';

import { Sprint, SprintStatus } from '@/lib/types/planning.types';
import { SCOPE_ALL, SCOPE_BACKLOG, SprintScope } from '@/lib/hooks/useSprintScope';
import { Filter } from 'lucide-react';

const STATUS_SUFFIX: Record<SprintStatus, string> = {
  [SprintStatus.PLANNED]: 'à venir',
  [SprintStatus.ACTIVE]: 'en cours',
  [SprintStatus.COMPLETED]: 'terminé',
};

interface SprintScopeFilterProps {
  sprints: Sprint[];
  scope: SprintScope;
  onScopeChange: (scope: SprintScope) => void;
  /** Nombre de tâches réellement affichées, pour lever toute ambiguïté. */
  visibleCount: number;
  totalCount: number;
}

/**
 * Sélecteur de portée : sprint, backlog ou projet entier.
 *
 * Le compteur « x sur y » est délibéré : sans lui, un filtre actif ressemble
 * à un projet qui aurait perdu des tâches.
 */
export default function SprintScopeFilter({
  sprints,
  scope,
  onScopeChange,
  visibleCount,
  totalCount,
}: SprintScopeFilterProps) {
  // Sans sprint, le sélecteur n'offrirait aucun choix utile.
  if (sprints.length === 0) return null;

  const isFiltered = scope !== SCOPE_ALL;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter
        className={`w-4 h-4 shrink-0 ${
          isFiltered ? 'text-primary' : 'text-text-secondary'
        }`}
      />
      <select
        value={scope}
        onChange={(e) => onScopeChange(e.target.value)}
        aria-label="Filtrer les tâches par sprint"
        className={`text-sm rounded-lg border px-3 py-1.5 bg-bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary ${
          isFiltered ? 'border-primary/50' : 'border-border'
        }`}
      >
        <option value={SCOPE_ALL}>Tout le projet</option>
        <option value={SCOPE_BACKLOG}>Backlog (hors sprint)</option>
        {sprints.map((sprint) => (
          <option key={sprint.id} value={sprint.id}>
            {sprint.name} — {STATUS_SUFFIX[sprint.status]}
          </option>
        ))}
      </select>

      {isFiltered && (
        <span className="text-xs text-text-secondary whitespace-nowrap">
          {visibleCount} sur {totalCount} tâche{totalCount > 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
