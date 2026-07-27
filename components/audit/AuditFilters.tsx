'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import {
  AuditLogFilterOptions,
  AuditLogFilters,
  AuditPeriod,
  AuditSeverity,
} from '@/lib/types/audit.types';
import { describeAction, targetTypeLabel } from '@/lib/utils/audit-labels';
import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

const PERIODS: { value: AuditPeriod | 'all'; label: string }[] = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
  { value: 'all', label: 'Tout' },
];

const SEVERITY_LABELS: Record<AuditSeverity, string> = {
  critical: 'Critique',
  warning: 'Sensible',
  info: 'Courant',
};

const SEVERITY_STYLES: Record<AuditSeverity, string> = {
  critical: 'border-critical/40 text-critical bg-critical/10',
  warning: 'border-warning/40 text-warning bg-warning/10',
  info: 'border-primary/40 text-primary bg-primary/10',
};

interface AuditFiltersProps {
  filters: AuditLogFilters;
  options?: AuditLogFilterOptions;
  onChange: (filters: AuditLogFilters) => void;
  onReset: () => void;
  activeCount: number;
}

/** Bascule une valeur dans un tableau de filtre. */
function toggle<T>(list: T[] | undefined, value: T): T[] | undefined {
  const current = list ?? [];
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
  return next.length ? next : undefined;
}

/** Puce de sélection multiple. */
function Chip({
  active,
  onClick,
  children,
  className = '',
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
        active
          ? className || 'bg-primary text-white border-primary'
          : 'border-border text-text-secondary hover:text-text-primary hover:border-text-secondary'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Barre de filtres du journal.
 *
 * Trois niveaux : période en accès direct, filtres courants toujours visibles,
 * et un panneau avancé replié pour les recherches d'enquête (IP, identifiant
 * de requête, objet précis, ordre chronologique).
 */
export default function AuditFiltersBar({
  filters,
  options,
  onChange,
  onReset,
  activeCount,
}: AuditFiltersProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const update = (patch: Partial<AuditLogFilters>) =>
    onChange({ ...filters, ...patch });

  // Les actions listées se restreignent aux catégories choisies : proposer
  // « Suppression de projet » alors qu'on filtre sur Documents n'a pas de sens.
  const availableActions = (options?.actions ?? []).filter((action) => {
    if (!filters.categories?.length) return true;
    return filters.categories.includes(describeAction(action).category);
  });

  const currentPeriod: AuditPeriod | 'all' = filters.dateFrom
    ? 'all'
    : (filters.period ?? 'all');

  return (
    <div className="space-y-4">
      {/* Période — accès direct, comme sur le tableau de bord */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-text-secondary mr-1">
          Période
        </span>
        {PERIODS.map((period) => (
          <Chip
            key={period.value}
            active={currentPeriod === period.value}
            onClick={() =>
              update({
                period: period.value === 'all' ? undefined : period.value,
                // Le raccourci et les dates manuelles s'excluent : garder les
                // deux donnerait une plage ambiguë.
                dateFrom: undefined,
                dateTo: undefined,
              })
            }
          >
            {period.label}
          </Chip>
        ))}
      </div>

      {/* Gravité */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-text-secondary mr-1">
          Gravité
        </span>
        {(options?.severities ?? ['critical', 'warning', 'info']).map(
          (severity) => (
            <Chip
              key={severity}
              active={filters.severities?.includes(severity) ?? false}
              onClick={() =>
                update({ severities: toggle(filters.severities, severity) })
              }
              className={SEVERITY_STYLES[severity]}
            >
              {SEVERITY_LABELS[severity]}
            </Chip>
          )
        )}
      </div>

      {/* Catégories */}
      {options?.categories && options.categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-text-secondary mr-1">
            Catégorie
          </span>
          {options.categories.map((category) => (
            <Chip
              key={category}
              active={filters.categories?.includes(category) ?? false}
              onClick={() =>
                update({
                  categories: toggle(filters.categories, category),
                  // Les actions déjà cochées peuvent sortir du périmètre.
                  actions: undefined,
                })
              }
            >
              {category}
            </Chip>
          ))}
        </div>
      )}

      {/* Recherche + auteur */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <label
            className="text-xs font-medium text-text-secondary mb-1 block"
            htmlFor="audit-search"
          >
            Recherche
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            <Input
              id="audit-search"
              value={filters.search ?? ''}
              onChange={(e) => update({ search: e.target.value })}
              placeholder="Email, action, identifiant, IP, requête…"
              className="pl-9"
            />
          </div>
        </div>

        <div>
          <label
            className="text-xs font-medium text-text-secondary mb-1 block"
            htmlFor="audit-actor"
          >
            Auteur
          </label>
          <Select
            id="audit-actor"
            value={filters.userIds?.[0] ?? ''}
            onChange={(e) =>
              update({
                userIds: e.target.value ? [e.target.value] : undefined,
              })
            }
            placeholder="Tous les auteurs"
            options={(options?.actors ?? []).map((actor) => ({
              value: actor.id,
              label: actor.name,
            }))}
          />
        </div>
      </div>

      {/* Actions précises, si des catégories restreignent déjà la liste */}
      {availableActions.length > 0 && (
        <div>
          <span className="text-xs font-medium text-text-secondary mb-2 block">
            Actions précises
          </span>
          <div className="flex flex-wrap gap-2">
            {availableActions.map((action) => (
              <Chip
                key={action}
                active={filters.actions?.includes(action) ?? false}
                onClick={() => update({ actions: toggle(filters.actions, action) })}
              >
                {describeAction(action).label}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {/* Panneau avancé */}
      <div className="border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setAdvancedOpen((open) => !open)}
          className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
          aria-expanded={advancedOpen}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtres avancés
          {advancedOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {advancedOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
            <div>
              <label
                className="text-xs font-medium text-text-secondary mb-1 block"
                htmlFor="audit-target-type"
              >
                Type d’objet
              </label>
              <Select
                id="audit-target-type"
                value={filters.targetTypes?.[0] ?? ''}
                onChange={(e) =>
                  update({
                    targetTypes: e.target.value ? [e.target.value] : undefined,
                  })
                }
                placeholder="Tous les objets"
                options={(options?.targetTypes ?? []).map((type) => ({
                  value: type,
                  label: targetTypeLabel(type),
                }))}
              />
            </div>

            <div>
              <label
                className="text-xs font-medium text-text-secondary mb-1 block"
                htmlFor="audit-target-id"
              >
                Identifiant d’objet
              </label>
              <Input
                id="audit-target-id"
                value={filters.targetId ?? ''}
                onChange={(e) =>
                  update({ targetId: e.target.value || undefined })
                }
                placeholder="Suivre un objet précis"
              />
            </div>

            <div>
              <label
                className="text-xs font-medium text-text-secondary mb-1 block"
                htmlFor="audit-ip"
              >
                Adresse IP
              </label>
              <Select
                id="audit-ip"
                value={filters.ip ?? ''}
                onChange={(e) => update({ ip: e.target.value || undefined })}
                placeholder="Toutes les origines"
                options={(options?.ips ?? []).map((ip) => ({
                  value: ip,
                  label: ip,
                }))}
              />
            </div>

            <div>
              <label
                className="text-xs font-medium text-text-secondary mb-1 block"
                htmlFor="audit-request-id"
              >
                Identifiant de requête
              </label>
              <Input
                id="audit-request-id"
                value={filters.requestId ?? ''}
                onChange={(e) =>
                  update({ requestId: e.target.value || undefined })
                }
                placeholder="Corréler avec les logs serveur"
              />
            </div>

            <div>
              <label
                className="text-xs font-medium text-text-secondary mb-1 block"
                htmlFor="audit-date-from"
              >
                Du
              </label>
              <Input
                id="audit-date-from"
                type="date"
                value={filters.dateFrom?.slice(0, 10) ?? ''}
                onChange={(e) =>
                  update({
                    dateFrom: e.target.value
                      ? new Date(`${e.target.value}T00:00:00`).toISOString()
                      : undefined,
                    // Une date explicite prend le pas sur le raccourci.
                    period: undefined,
                  })
                }
              />
            </div>

            <div>
              <label
                className="text-xs font-medium text-text-secondary mb-1 block"
                htmlFor="audit-date-to"
              >
                Au
              </label>
              <Input
                id="audit-date-to"
                type="date"
                value={filters.dateTo?.slice(0, 10) ?? ''}
                onChange={(e) =>
                  update({
                    // Fin de journée incluse : sinon filtrer « au 27 » exclut
                    // tout ce qui s'est passé le 27.
                    dateTo: e.target.value
                      ? new Date(`${e.target.value}T23:59:59`).toISOString()
                      : undefined,
                    period: undefined,
                  })
                }
              />
            </div>

            <div>
              <label
                className="text-xs font-medium text-text-secondary mb-1 block"
                htmlFor="audit-sort"
              >
                Ordre
              </label>
              <Select
                id="audit-sort"
                value={filters.sort ?? 'desc'}
                onChange={(e) =>
                  update({ sort: e.target.value as 'asc' | 'desc' })
                }
                options={[
                  { value: 'desc', label: 'Plus récent d’abord' },
                  { value: 'asc', label: 'Plus ancien d’abord' },
                ]}
              />
            </div>
          </div>
        )}
      </div>

      {activeCount > 0 && (
        <div className="flex items-center gap-2 border-t border-border pt-3">
          <span className="text-xs text-text-secondary">
            {activeCount} filtre{activeCount > 1 ? 's' : ''} actif
            {activeCount > 1 ? 's' : ''}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Tout réinitialiser
          </Button>
        </div>
      )}
    </div>
  );
}
