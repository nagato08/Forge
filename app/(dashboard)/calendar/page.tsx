'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { BadgeVariant } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import MonthGrid, { dayKey } from '@/components/calendar/MonthGrid';
import AbsenceModal, {
  ABSENCE_TYPE_LABELS,
} from '@/components/calendar/AbsenceModal';
import {
  usePersonalCalendar,
  useOrganisationCalendar,
  useMyAbsences,
  useDeleteAbsence,
} from '@/lib/hooks/useCalendar';
import { Absence, CalendarEvent, CalendarEventKind } from '@/lib/api/calendar.api';
import { getApiError } from '@/lib/utils/api-error';
import { toast } from '@/lib/stores/toast.store';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  User as UserIcon,
  Pencil,
  Trash2,
} from 'lucide-react';

type Scope = 'personal' | 'organisation';

const KIND_LABELS: Record<CalendarEventKind, string> = {
  TASK: 'Échéance',
  MILESTONE: 'Jalon',
  SPRINT: 'Sprint',
  ABSENCE: 'Indisponibilité',
};

const KIND_BADGES: Record<CalendarEventKind, BadgeVariant> = {
  TASK: 'info',
  MILESTONE: 'danger',
  SPRINT: 'success',
  ABSENCE: 'warning',
};

const KIND_DOTS: Record<CalendarEventKind, string> = {
  TASK: 'bg-primary',
  MILESTONE: 'bg-ai',
  SPRINT: 'bg-info',
  ABSENCE: 'bg-warning',
};

function formatLongDate(day: string) {
  return new Date(`${day}T00:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Agenda : un calendrier personnel (mes échéances, mes disponibilités) et un
 * calendrier d'organisation (activité de l'équipe, jalons, sprints, absences).
 *
 * N'invente aucune donnée : tout provient de ce que le projet enregistre
 * déjà — seule l'indisponibilité déclarée est propre à cet écran.
 */
export default function CalendarPage() {
  const [scope, setScope] = useState<Scope>('personal');
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(() =>
    dayKey(new Date())
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null);

  // La grille déborde sur les mois voisins : la fenêtre interrogée les couvre,
  // sinon les premières et dernières cases resteraient vides.
  const range = useMemo(() => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    start.setDate(start.getDate() - 7);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    end.setDate(end.getDate() + 14);
    return { start: dayKey(start), end: dayKey(end) };
  }, [month]);

  const personalQuery = usePersonalCalendar(range);
  const organisationQuery = useOrganisationCalendar(range, scope === 'organisation');
  const { data: myAbsences } = useMyAbsences(range);
  const deleteMutation = useDeleteAbsence();

  const activeQuery = scope === 'personal' ? personalQuery : organisationQuery;
  // Référence stable : sans cela, le tableau vide de repli serait recréé à
  // chaque rendu et relancerait inutilement le filtrage du jour sélectionné.
  const events: CalendarEvent[] = useMemo(
    () => activeQuery.data ?? [],
    [activeQuery.data]
  );

  const selectedEvents = useMemo(() => {
    if (!selectedDay) return [];
    return events.filter(
      (e) => e.startDate <= selectedDay && e.endDate >= selectedDay
    );
  }, [events, selectedDay]);

  const goToMonth = (delta: number) =>
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  const goToday = () => {
    const now = new Date();
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDay(dayKey(now));
  };

  const openCreate = () => {
    setEditingAbsence(null);
    setModalOpen(true);
  };

  const openEdit = (absence: Absence) => {
    setEditingAbsence(absence);
    setModalOpen(true);
  };

  const handleDelete = (absence: Absence) => {
    if (!confirm('Supprimer cette disponibilité ?')) return;
    deleteMutation.mutate(absence.id, {
      onSuccess: () => toast.success('Disponibilité supprimée'),
      onError: (err) =>
        toast.error(getApiError(err), { title: 'Suppression impossible' }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Agenda</h1>
            <p className="text-text-secondary text-sm">
              Mes échéances et disponibilités, et l’activité de l’équipe.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-bg-surface-hover border border-border">
            <button
              onClick={() => setScope('personal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                scope === 'personal'
                  ? 'bg-bg-surface text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              Mon agenda
            </button>
            <button
              onClick={() => setScope('organisation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                scope === 'organisation'
                  ? 'bg-bg-surface text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Users className="w-4 h-4" />
              Organisation
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={openCreate}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Déclarer une absence
          </Button>
        </div>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <h2 className="text-lg font-semibold text-text-primary capitalize">
            {month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToMonth(-1)}
              aria-label="Mois précédent"
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <Button variant="secondary" size="sm" onClick={goToday}>
              Aujourd’hui
            </Button>
            <button
              onClick={() => goToMonth(1)}
              aria-label="Mois suivant"
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {activeQuery.isLoading ? (
          <Spinner centered size="lg" label="Chargement de l’agenda..." />
        ) : (
          <MonthGrid
            month={month}
            events={events}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />
        )}

        {/* Légende : la couleur seule ne doit rien porter comme information. */}
        <div className="flex items-center gap-4 flex-wrap mt-4 pt-4 border-t border-border">
          {(Object.keys(KIND_LABELS) as CalendarEventKind[]).map((kind) => (
            <span key={kind} className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span className={`w-2.5 h-2.5 rounded-full ${KIND_DOTS[kind]}`} />
              {KIND_LABELS[kind]}
            </span>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Détail du jour sélectionné */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-3">
            {selectedDay ? formatLongDate(selectedDay) : 'Aucun jour sélectionné'}
          </h2>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-text-weak">Rien de prévu ce jour-là</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((event) => (
                <div
                  key={`${event.kind}-${event.id}`}
                  className="flex items-start justify-between gap-3 border-t border-border pt-2 first:border-0 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary truncate">{event.title}</p>
                    <p className="text-xs text-text-secondary">
                      {event.projectName ??
                        (event.absenceType
                          ? ABSENCE_TYPE_LABELS[event.absenceType]
                          : '—')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={KIND_BADGES[event.kind]} size="sm">
                      {KIND_LABELS[event.kind]}
                    </Badge>
                    {event.projectId && (
                      <Link
                        href={`/projects/${event.projectId}/dashboard`}
                        className="text-xs text-primary hover:underline whitespace-nowrap"
                      >
                        Ouvrir
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Mes disponibilités : seul endroit où le motif est visible */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-3">
            Mes disponibilités déclarées
          </h2>
          {(myAbsences ?? []).length === 0 ? (
            <p className="text-sm text-text-weak">
              Aucune indisponibilité déclarée sur cette période
            </p>
          ) : (
            <div className="space-y-2">
              {(myAbsences ?? []).map((absence) => (
                <div
                  key={absence.id}
                  className="flex items-start justify-between gap-3 border-t border-border pt-2 first:border-0 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary">
                      {ABSENCE_TYPE_LABELS[absence.type]} ·{' '}
                      {formatShortDate(absence.startDate)}
                      {absence.startDate.split('T')[0] !== absence.endDate.split('T')[0] &&
                        ` → ${formatShortDate(absence.endDate)}`}
                    </p>
                    {absence.reason && (
                      <p className="text-xs text-text-secondary truncate">
                        {absence.reason}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(absence)}
                      aria-label="Modifier cette disponibilité"
                      className="p-1.5 rounded text-text-weak hover:text-text-primary hover:bg-bg-surface-hover transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(absence)}
                      aria-label="Supprimer cette disponibilité"
                      className="p-1.5 rounded text-text-weak hover:text-critical hover:bg-bg-surface-hover transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <AbsenceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        absence={editingAbsence}
        defaultDay={selectedDay}
      />
    </div>
  );
}
