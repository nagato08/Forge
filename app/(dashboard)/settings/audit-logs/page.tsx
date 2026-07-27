'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth.store';
import {
  useAuditFilterOptions,
  useAuditLogs,
  useAuditStats,
} from '@/lib/hooks/useAuditLogs';
import { AuditLog, AuditLogFilters } from '@/lib/types/audit.types';
import {
  actorName,
  describeAction,
  formatAuditDateShort,
  formatRelative,
  setAuditCatalog,
  targetTypeLabel,
} from '@/lib/utils/audit-labels';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import AuditActionBadge from '@/components/audit/AuditActionBadge';
import AuditFiltersBar from '@/components/audit/AuditFilters';
import AuditExportMenu from '@/components/audit/AuditExportMenu';
import AuditLogDetail from '@/components/audit/AuditLogDetail';
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Info,
  ShieldCheck,
  Users,
} from 'lucide-react';

const PAGE_SIZE = 25;

export default function AuditLogsPage() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);

  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const params = useMemo(
    () => ({ ...filters, skip: page * PAGE_SIZE, take: PAGE_SIZE }),
    [filters, page]
  );

  const { data, isLoading, error, isFetching } = useAuditLogs(params);
  const { data: options } = useAuditFilterOptions();
  const { data: stats } = useAuditStats(filters);

  // Le serveur fait autorité sur les libellés : on l'enregistre dès réception
  // pour que toute la page en bénéficie, y compris les exports.
  useEffect(() => {
    setAuditCatalog(options?.catalog);
  }, [options?.catalog]);

  // Un tableau vide ne compte pas comme filtre actif.
  const activeFilters = Object.values(filters).filter((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value)
  ).length;

  const filterSummary = useMemo(() => {
    if (activeFilters === 0) return 'toutes les entrées';

    const parts: string[] = [];
    const periodLabels: Record<string, string> = {
      '7d': '7 derniers jours',
      '30d': '30 derniers jours',
      '90d': '90 derniers jours',
    };

    if (filters.period) parts.push(periodLabels[filters.period]);
    if (filters.severities?.length) {
      const labels: Record<string, string> = {
        critical: 'critique',
        warning: 'sensible',
        info: 'courant',
      };
      parts.push(
        `gravité : ${filters.severities.map((s) => labels[s]).join(', ')}`
      );
    }
    if (filters.categories?.length)
      parts.push(`catégories : ${filters.categories.join(', ')}`);
    if (filters.actions?.length)
      parts.push(
        `actions : ${filters.actions
          .map((action) => describeAction(action).label)
          .join(', ')}`
      );
    if (filters.userIds?.length) {
      const names = filters.userIds
        .map((id) => options?.actors.find((a) => a.id === id)?.name ?? id)
        .join(', ');
      parts.push(`auteur : ${names}`);
    }
    if (filters.targetTypes?.length)
      parts.push(
        `objet : ${filters.targetTypes.map(targetTypeLabel).join(', ')}`
      );
    if (filters.targetId) parts.push(`cible ${filters.targetId}`);
    if (filters.ip) parts.push(`IP ${filters.ip}`);
    if (filters.requestId) parts.push(`requête ${filters.requestId}`);
    if (filters.dateFrom)
      parts.push(`depuis le ${formatAuditDateShort(filters.dateFrom)}`);
    if (filters.dateTo)
      parts.push(`jusqu’au ${formatAuditDateShort(filters.dateTo)}`);
    if (filters.search) parts.push(`recherche « ${filters.search} »`);

    return parts.join(' — ');
  }, [filters, activeFilters, options]);

  // Garde-fou d'affichage, placé après tous les hooks pour que leur ordre
  // reste constant d'un rendu à l'autre. Le serveur reste l'autorité : la
  // route est réservée aux ADMIN et répondrait 403.
  if (role && role !== 'ADMIN') {
    return (
      <div className="max-w-2xl">
        <Alert
          type="error"
          title="Accès refusé"
          message="Le journal d’audit est réservé aux administrateurs."
        />
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => router.push('/dashboard')}
        >
          Retour au tableau de bord
        </Button>
      </div>
    );
  }

  const handleFiltersChange = (next: AuditLogFilters) => {
    setFilters(next);
    // Changer de filtre remet à la première page, sinon on peut se retrouver
    // sur une page 5 qui n'existe plus.
    setPage(0);
  };

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeEnd = Math.min((page + 1) * PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-primary" />
            Journal d’audit
          </h1>
          <p className="text-text-secondary mt-1 max-w-3xl">
            Trace de toutes les actions sensibles réalisées dans l’application :
            qui a fait quoi, quand, et sur quel objet. Les entrées ne peuvent
            être ni modifiées ni supprimées.
          </p>
        </div>
        <AuditExportMenu
          filters={filters}
          filterSummary={filterSummary}
          disabled={isLoading || total === 0}
        />
      </div>

      {/* Indicateurs de synthèse */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Activity}
          label={activeFilters > 0 ? 'Entrées filtrées' : 'Entrées enregistrées'}
          value={stats?.total}
          hint={
            activeFilters > 0
              ? `sur ${stats?.overall ?? '—'} au total`
              : 'Depuis la mise en service'
          }
        />
        <StatCard
          icon={CalendarDays}
          label="Aujourd’hui"
          value={stats?.today}
          hint="Actions depuis minuit"
        />
        <StatCard
          icon={CalendarDays}
          label="7 derniers jours"
          value={stats?.lastSevenDays}
          hint="Activité récente"
        />
        <StatCard
          icon={Users}
          label="Auteurs distincts"
          value={stats?.distinctActors}
          hint="Comptes ayant agi"
        />
      </div>

      {/* Aide à la lecture */}
      <Card className="p-4 flex items-start gap-3 border-primary/20 bg-primary/5">
        <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div className="text-sm text-text-secondary space-y-1">
          <p>
            Les actions sont colorées selon leur portée :{' '}
            <span className="text-critical font-medium">rouge</span> pour
            l’irréversible (suppression, transfert de propriété),{' '}
            <span className="text-warning font-medium">orange</span> pour ce qui
            change des droits ou retire un accès, et{' '}
            <span className="text-primary font-medium">bleu</span> pour le
            reste.
          </p>
          <p>
            Cliquez sur une ligne pour voir le détail complet : contexte,
            adresse IP, navigateur et identifiant de requête.
          </p>
        </div>
      </Card>

      {/* Filtres */}
      <Card className="p-4">
        <AuditFiltersBar
          filters={filters}
          options={options}
          onChange={handleFiltersChange}
          onReset={() => {
            setFilters({});
            setPage(0);
          }}
          activeCount={activeFilters}
        />
      </Card>

      {/* Tableau */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-12">
            <Spinner centered size="lg" label="Chargement du journal..." />
          </div>
        ) : error ? (
          <div className="p-6">
            <Alert
              type="error"
              title="Erreur"
              message="Impossible de charger le journal d’audit"
            />
          </div>
        ) : total === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="w-10 h-10 text-text-weak mx-auto mb-3" />
            <p className="text-text-primary font-medium">
              {activeFilters > 0
                ? 'Aucune entrée ne correspond à ces filtres'
                : 'Aucune action enregistrée pour le moment'}
            </p>
            <p className="text-sm text-text-secondary mt-1">
              {activeFilters > 0
                ? 'Élargissez la période ou retirez des filtres.'
                : 'Les actions sensibles apparaîtront ici dès qu’elles seront réalisées.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-surface-hover">
                    <Th>Date</Th>
                    <Th>Action</Th>
                    <Th>Auteur</Th>
                    <Th>Objet visé</Th>
                    <Th className="hidden lg:table-cell">Origine</Th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelected(log)}
                      className="border-b border-border last:border-0 hover:bg-bg-surface-hover cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-text-primary">
                          {formatAuditDateShort(log.createdAt)}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {formatRelative(log.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <AuditActionBadge action={log.action} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-text-primary">
                          {actorName(log)}
                        </div>
                        {log.userEmail && (
                          <div className="text-xs text-text-secondary truncate max-w-[200px]">
                            {log.userEmail}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-text-primary">
                          {targetTypeLabel(log.targetType)}
                        </div>
                        {log.targetId && (
                          <div className="text-xs text-text-secondary font-mono truncate max-w-[160px]">
                            {log.targetId}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-text-secondary font-mono">
                          {log.ip ?? '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border">
              <p className="text-xs text-text-secondary">
                {rangeStart}–{rangeEnd} sur {total} entrée
                {total > 1 ? 's' : ''}
                {isFetching && <span> · actualisation…</span>}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Précédent
                </Button>
                <span className="text-xs text-text-secondary">
                  Page {page + 1} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex items-center gap-1"
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <AuditLogDetail log={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function Th({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wide ${className}`}
    >
      {children}
    </th>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: number;
  hint: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-text-secondary mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-text-primary tabular-nums">
        {value ?? '—'}
      </p>
      <p className="text-xs text-text-weak mt-0.5">{hint}</p>
    </Card>
  );
}
