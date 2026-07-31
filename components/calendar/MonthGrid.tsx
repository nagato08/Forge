'use client';

import { useMemo } from 'react';
import { CalendarEvent, CalendarEventKind } from '@/lib/api/calendar.api';

/** Semaine commençant le lundi, comme partout ailleurs dans l'application. */
const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/** Six semaines toujours affichées : la grille garde la même hauteur d'un mois à l'autre. */
const WEEKS_SHOWN = 6;

const KIND_STYLES: Record<CalendarEventKind, string> = {
  TASK: 'bg-primary/15 text-primary',
  MILESTONE: 'bg-ai/15 text-ai',
  SPRINT: 'bg-info/15 text-info',
  ABSENCE: 'bg-warning/15 text-warning',
};

/**
 * Clé de jour au format `YYYY-MM-DD`, construite sur les composantes locales.
 *
 * `toISOString` donnerait la date UTC : à l'est de Greenwich, une case du
 * 10 août tomberait sur la clé du 9 et n'afficherait jamais ses événements.
 */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

interface MonthGridProps {
  /** N'importe quelle date du mois affiché. */
  month: Date;
  events: CalendarEvent[];
  selectedDay: string | null;
  onSelectDay: (day: string) => void;
}

export default function MonthGrid({
  month,
  events,
  selectedDay,
  onSelectDay,
}: MonthGridProps) {
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    // Recule jusqu'au lundi qui ouvre la semaine du 1er (dimanche = 0).
    const offset = (first.getDay() + 6) % 7;
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - offset);

    return Array.from({ length: WEEKS_SHOWN * 7 }, (_, i) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      return date;
    });
  }, [month]);

  /**
   * Un événement s'étale parfois sur plusieurs jours (sprint, absence) : on
   * l'inscrit sur chaque jour couvert plutôt que de dessiner une barre
   * continue, qui supporterait mal les ruptures de fin de semaine.
   */
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const cursor = new Date(`${event.startDate}T00:00:00`);
      const last = new Date(`${event.endDate}T00:00:00`);
      while (cursor.getTime() <= last.getTime()) {
        const key = dayKey(cursor);
        const bucket = map.get(key);
        if (bucket) bucket.push(event);
        else map.set(key, [event]);
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return map;
  }, [events]);

  const todayKey = dayKey(new Date());
  const currentMonth = month.getMonth();

  return (
    <div>
      <div className="grid grid-cols-7 gap-px mb-px">
        {WEEKDAYS.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-semibold text-text-secondary uppercase tracking-wide py-2"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border border-border">
        {days.map((date) => {
          const key = dayKey(date);
          const dayEvents = eventsByDay.get(key) ?? [];
          const isToday = key === todayKey;
          const isSelected = key === selectedDay;
          const isOutside = date.getMonth() !== currentMonth;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(key)}
              aria-label={`${date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}, ${dayEvents.length} événement${dayEvents.length > 1 ? 's' : ''}`}
              aria-current={isToday ? 'date' : undefined}
              className={`
                min-h-[104px] p-1.5 text-left align-top transition-colors
                focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary
                ${isOutside ? 'bg-bg-surface-hover/40' : 'bg-bg-surface'}
                ${isSelected ? 'ring-2 ring-inset ring-primary' : 'hover:bg-bg-surface-hover'}
              `}
            >
              <span
                className={`
                  inline-flex items-center justify-center w-6 h-6 rounded-full text-xs mb-1
                  ${isToday ? 'bg-primary text-white font-semibold' : ''}
                  ${!isToday && isOutside ? 'text-text-weak' : ''}
                  ${!isToday && !isOutside ? 'text-text-primary font-medium' : ''}
                `}
              >
                {date.getDate()}
              </span>

              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((event) => {
                  // Une demande d'absence encore en attente n'est pas acquise :
                  // le pointillé le dit sans compter sur la seule couleur.
                  const isPending = event.absenceStatus === 'PENDING';
                  return (
                    <div
                      key={`${event.kind}-${event.id}`}
                      className={`
                        text-[11px] leading-tight px-1.5 py-0.5 rounded truncate
                        ${KIND_STYLES[event.kind]}
                        ${isPending ? 'border border-dashed border-current opacity-80' : ''}
                      `}
                      title={isPending ? `${event.title} — en attente de validation` : event.title}
                    >
                      {isPending ? `${event.title} ?` : event.title}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-[11px] text-text-secondary px-1.5">
                    +{dayEvents.length - 3}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
