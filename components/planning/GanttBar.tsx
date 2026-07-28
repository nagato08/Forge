'use client';

import { useEffect, useRef, useState } from 'react';
import { GanttTask } from '@/lib/types/planning.types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type DragMode = 'move' | 'resize';

interface GanttBarProps {
  task: GanttTask;
  /** Origine de la frise, en millisecondes. */
  timelineStart: number;
  pixelsPerDay: number;
  /** Faux pour un lecteur : la barre reste affichée mais figée. */
  editable: boolean;
  showBaseline: boolean;
  onReschedule: (startDate: Date, endDate: Date) => void;
  onSelect: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  TODO: 'bg-text-secondary',
  DOING: 'bg-primary',
  DONE: 'bg-success',
};

/**
 * Barre de tâche déplaçable.
 *
 * Le déplacement est purement local pendant le geste : on ne remonte les
 * nouvelles dates qu'au relâchement, sinon chaque pixel parcouru
 * déclencherait un appel réseau et une cascade de replanification.
 */
export default function GanttBar({
  task,
  timelineStart,
  pixelsPerDay,
  editable,
  showBaseline,
  onReschedule,
  onSelect,
}: GanttBarProps) {
  const [drag, setDrag] = useState<{
    mode: DragMode;
    startX: number;
    offsetDays: number;
    durationDelta: number;
  } | null>(null);

  // Le geste se poursuit hors de la barre : les écouteurs vivent sur la
  // fenêtre, sinon relâcher à côté laisserait la barre collée au curseur.
  const dragRef = useRef(drag);
  dragRef.current = drag;

  useEffect(() => {
    if (!drag) return;

    const handleMove = (e: MouseEvent) => {
      const deltaDays = Math.round((e.clientX - drag.startX) / pixelsPerDay);
      setDrag((current) =>
        current
          ? {
              ...current,
              offsetDays: current.mode === 'move' ? deltaDays : 0,
              durationDelta: current.mode === 'resize' ? deltaDays : 0,
            }
          : null
      );
    };

    const handleUp = () => {
      const current = dragRef.current;
      setDrag(null);
      if (!current) return;

      const { offsetDays, durationDelta } = current;
      if (offsetDays === 0 && durationDelta === 0) return;

      const start = new Date(task.startDate!);
      const end = new Date(task.endDate!);

      const newStart = new Date(start.getTime() + offsetDays * MS_PER_DAY);
      const newEnd = new Date(
        end.getTime() + (offsetDays + durationDelta) * MS_PER_DAY
      );

      // Une barre ne peut pas finir avant de commencer.
      if (newEnd.getTime() < newStart.getTime()) return;

      onReschedule(newStart, newEnd);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag?.mode, pixelsPerDay, task.startDate, task.endDate]);

  if (!task.startDate || !task.endDate) return null;

  const start = new Date(task.startDate).getTime();
  const end = new Date(task.endDate).getTime();

  const offsetDays = drag?.offsetDays ?? 0;
  const durationDelta = drag?.durationDelta ?? 0;

  const left =
    ((start - timelineStart) / MS_PER_DAY + offsetDays) * pixelsPerDay;
  const width = Math.max(
    pixelsPerDay,
    ((end - start) / MS_PER_DAY + durationDelta) * pixelsPerDay
  );

  const beginDrag = (mode: DragMode) => (e: React.MouseEvent) => {
    if (!editable) return;
    e.preventDefault();
    e.stopPropagation();
    setDrag({ mode, startX: e.clientX, offsetDays: 0, durationDelta: 0 });
  };

  // Aperçu des dates pendant le geste, pour savoir où l'on dépose.
  const previewStart = new Date(start + offsetDays * MS_PER_DAY);
  const previewEnd = new Date(end + (offsetDays + durationDelta) * MS_PER_DAY);

  return (
    <div className="relative h-8">
      {/* Référence : barre grise en fond, pour visualiser la dérive */}
      {showBaseline && task.baselineStart && task.baselineEnd && (
        <div
          className="absolute top-1 h-2 rounded bg-text-weak/30"
          style={{
            left:
              ((new Date(task.baselineStart).getTime() - timelineStart) /
                MS_PER_DAY) *
              pixelsPerDay,
            width: Math.max(
              2,
              ((new Date(task.baselineEnd).getTime() -
                new Date(task.baselineStart).getTime()) /
                MS_PER_DAY) *
                pixelsPerDay
            ),
          }}
          title="Planning de référence"
        />
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect();
          }
        }}
        onMouseDown={beginDrag('move')}
        className={`absolute top-3 h-5 rounded flex items-center group ${
          STATUS_COLORS[task.status] ?? 'bg-text-secondary'
        } ${editable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${
          drag ? 'opacity-80 ring-2 ring-primary' : ''
        }`}
        style={{ left, width }}
        title={`${task.title}${
          task.driftDays ? ` — dérive ${task.driftDays > 0 ? '+' : ''}${task.driftDays} j` : ''
        }`}
      >
        <span className="px-2 text-[10px] text-white truncate select-none">
          {task.title}
        </span>

        {/* Poignée de redimensionnement, au bord droit */}
        {editable && (
          <span
            onMouseDown={beginDrag('resize')}
            className="absolute right-0 top-0 h-full w-2 cursor-ew-resize rounded-r bg-black/20 opacity-0 group-hover:opacity-100"
            aria-hidden
          />
        )}
      </div>

      {/* Dates en cours de déplacement */}
      {drag && (
        <div
          className="absolute -top-4 text-[10px] font-medium text-primary whitespace-nowrap"
          style={{ left }}
        >
          {previewStart.toLocaleDateString('fr-FR')} →{' '}
          {previewEnd.toLocaleDateString('fr-FR')}
        </div>
      )}
    </div>
  );
}
