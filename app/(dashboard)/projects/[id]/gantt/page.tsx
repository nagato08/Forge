'use client';

import { useParams } from 'next/navigation';
import { useGantt, useStatusDonut, useEisenhower } from '@/lib/hooks/usePlanning';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';

export default function GanttPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { data: ganttData, isLoading, error } = useGantt(projectId);
  const { data: donutData } = useStatusDonut(projectId);
  const { data: eisenhowerData } = useEisenhower(projectId);

  if (isLoading) {
    return <Spinner centered size="lg" label="Chargement du diagramme Gantt..." />;
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

  if (!ganttData || ganttData.tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📊</div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Aucune tâche planifiée
        </h2>
        <p className="text-text-secondary">
          Créez des tâches avec des dates de début et fin pour voir le diagramme Gantt
        </p>
      </div>
    );
  }

  const allDates = ganttData.tasks
    .flatMap((t) => [t.startDate, t.endDate])
    .filter(Boolean) as string[];

  const minDate = allDates.length ? new Date(allDates.sort()[0]) : new Date();
  const maxDate = allDates.length ? new Date(allDates.sort().reverse()[0]) : new Date();

  const timelineStart = minDate.getTime();
  const timelineEnd = maxDate.getTime();
  const totalDays = (timelineEnd - timelineStart) / (1000 * 60 * 60 * 24) || 1;
  const pixelsPerDay = 60 / Math.max(totalDays, 1);

  const getTaskPosition = (startDate: string | undefined) => {
    if (!startDate) return 0;
    const start = new Date(startDate).getTime();
    return ((start - timelineStart) / (1000 * 60 * 60 * 24)) * pixelsPerDay;
  };

  const getTaskWidth = (startDate: string | undefined, endDate: string | undefined) => {
    if (!startDate || !endDate) return 40;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const days = (end - start) / (1000 * 60 * 60 * 24);
    return Math.max(days * pixelsPerDay, 40);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">📊 Diagramme Gantt</h1>
        <p className="text-text-secondary mt-1">Planification temporelle des tâches</p>
      </div>

      <Card className="overflow-x-auto p-6">
        <div className="space-y-4">
          {ganttData.tasks.map((task) => (
            <div key={task.id} className="flex gap-4">
              <div className="w-64 shrink-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {task.title}
                </p>
                {task.startDate && (
                  <p className="text-xs text-text-weak">
                    {new Date(task.startDate).toLocaleDateString('fr-FR')}
                    {task.endDate && ` → ${new Date(task.endDate).toLocaleDateString('fr-FR')}`}
                  </p>
                )}
              </div>

              <div className="flex-1 relative h-10 bg-bg-surface-hover rounded-lg">
                {task.startDate && task.endDate && (
                  <div
                    className="absolute h-full rounded-lg flex items-center justify-center text-white text-xs font-medium"
                    style={{
                      left: `${getTaskPosition(task.startDate)}px`,
                      width: `${getTaskWidth(task.startDate, task.endDate)}px`,
                      backgroundColor: task.progress === 100 ? '#3FB950' : '#2F81F7',
                    }}
                  >
                    {task.progress && task.progress > 20 && `${task.progress}%`}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-border flex gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary"></div>
            <span className="text-text-secondary">En cours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-success"></div>
            <span className="text-text-secondary">Complétée</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-text-secondary font-medium mb-2">📋 Tâches totales</p>
          <p className="text-3xl font-bold text-primary">{ganttData.tasks.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-text-secondary font-medium mb-2">⏰ Durée totale</p>
          <p className="text-3xl font-bold text-primary">{Math.ceil(totalDays)} jours</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-text-secondary font-medium mb-2">✅ Complétées</p>
          <p className="text-3xl font-bold text-success">
            {ganttData.tasks.filter((t) => t.progress === 100).length}
          </p>
        </Card>
      </div>

      {donutData && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">🍩 Distribution par statut</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-warning mb-2">{donutData.TODO}</div>
              <p className="text-sm text-text-secondary">À faire</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">{donutData.DOING}</div>
              <p className="text-sm text-text-secondary">En cours</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success mb-2">{donutData.DONE}</div>
              <p className="text-sm text-text-secondary">Complétées</p>
            </div>
          </div>
        </Card>
      )}

      {eisenhowerData && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">⚔️ Matrice Eisenhower</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-critical rounded-lg p-4 bg-critical/5">
              <p className="font-medium text-critical mb-2">🔴 Urgent & Important</p>
              <p className="text-sm text-text-secondary">{eisenhowerData.urgent_important.length} tâches</p>
            </div>
            <div className="border border-warning rounded-lg p-4 bg-warning/5">
              <p className="font-medium text-warning mb-2">🟡 Important seulement</p>
              <p className="text-sm text-text-secondary">{eisenhowerData.not_urgent_important.length} tâches</p>
            </div>
            <div className="border border-primary rounded-lg p-4 bg-primary/5">
              <p className="font-medium text-primary mb-2">🔵 Urgent seulement</p>
              <p className="text-sm text-text-secondary">{eisenhowerData.urgent_not_important.length} tâches</p>
            </div>
            <div className="border border-border rounded-lg p-4 bg-bg-surface-hover">
              <p className="font-medium text-text-secondary mb-2">⚪ Ni l'un ni l'autre</p>
              <p className="text-sm text-text-secondary">{eisenhowerData.not_urgent_not_important.length} tâches</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
