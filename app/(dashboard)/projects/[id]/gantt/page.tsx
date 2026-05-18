'use client';

import { useParams } from 'next/navigation';
import { useGantt, useStatusDonut, useEisenhower } from '@/lib/hooks/usePlanning';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import {
  BarChart3,
  ClipboardList,
  Clock,
  CheckCircle2,
  PieChart,
  Target,
  AlertTriangle,
  Star,
  Zap,
  Minus,
  CalendarRange,
} from 'lucide-react';

export default function GanttPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { data: tasks, isLoading, error } = useGantt(projectId);
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

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-text-weak mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Aucune tache planifiee
        </h2>
        <p className="text-text-secondary">
          Creez des taches avec des dates de debut et fin pour voir le diagramme Gantt
        </p>
      </div>
    );
  }

  const allDates = tasks
    .flatMap((t) => [t.startDate, t.endDate])
    .filter(Boolean) as string[];

  const minDate = allDates.length ? new Date(allDates.sort()[0]) : new Date();
  const maxDate = allDates.length ? new Date(allDates.sort().reverse()[0]) : new Date();

  const timelineStart = minDate.getTime();
  const timelineEnd = maxDate.getTime();
  const totalDays = (timelineEnd - timelineStart) / (1000 * 60 * 60 * 24) || 1;
  const pixelsPerDay = 60 / Math.max(totalDays, 1);

  const getTaskPosition = (startDate: string) => {
    const start = new Date(startDate).getTime();
    return ((start - timelineStart) / (1000 * 60 * 60 * 24)) * pixelsPerDay;
  };

  const getTaskWidth = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const days = (end - start) / (1000 * 60 * 60 * 24);
    return Math.max(days * pixelsPerDay, 40);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return '#3FB950';
      case 'DOING': return '#2F81F7';
      default: return '#D29922';
    }
  };

  const completedCount = tasks.filter((t) => t.status === 'DONE').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Diagramme Gantt</h1>
          <p className="text-text-secondary text-sm">Planification temporelle des taches</p>
        </div>
      </div>

      <Card className="overflow-x-auto p-6">
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="flex gap-4 items-center">
              <div className="w-64 shrink-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {task.title}
                </p>
                <p className="text-xs text-text-weak flex items-center gap-1">
                  <CalendarRange className="w-3 h-3" />
                  {new Date(task.startDate).toLocaleDateString('fr-FR')}
                  {` \u2192 ${new Date(task.endDate).toLocaleDateString('fr-FR')}`}
                </p>
                {task.assignees.length > 0 && (
                  <p className="text-xs text-text-weak mt-0.5">
                    {task.assignees.map((a) => `${a.firstName} ${a.lastName}`).join(', ')}
                  </p>
                )}
              </div>

              <div className="flex-1 relative h-10 bg-bg-surface-hover rounded-lg">
                <div
                  className="absolute h-full rounded-lg flex items-center justify-center text-white text-xs font-medium"
                  style={{
                    left: `${getTaskPosition(task.startDate)}px`,
                    width: `${getTaskWidth(task.startDate, task.endDate)}px`,
                    backgroundColor: getStatusColor(task.status),
                  }}
                >
                  {task.durationDays > 5 && `${task.durationDays}j`}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-border flex gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#D29922' }}></div>
            <span className="text-text-secondary">A faire</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary"></div>
            <span className="text-text-secondary">En cours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-success"></div>
            <span className="text-text-secondary">Terminee</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="w-4 h-4 text-primary" />
            <p className="text-sm text-text-secondary font-medium">Taches totales</p>
          </div>
          <p className="text-3xl font-bold text-primary">{tasks.length}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-warning" />
            <p className="text-sm text-text-secondary font-medium">Duree totale</p>
          </div>
          <p className="text-3xl font-bold text-primary">{Math.ceil(totalDays)} jours</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <p className="text-sm text-text-secondary font-medium">Terminees</p>
          </div>
          <p className="text-3xl font-bold text-success">{completedCount}</p>
        </Card>
      </div>

      {donutData && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary" />
            Distribution par statut
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-warning mb-2">{donutData.TODO}</div>
              <p className="text-sm text-text-secondary">A faire</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">{donutData.DOING}</div>
              <p className="text-sm text-text-secondary">En cours</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success mb-2">{donutData.DONE}</div>
              <p className="text-sm text-text-secondary">Terminees</p>
            </div>
          </div>
        </Card>
      )}

      {eisenhowerData && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Matrice Eisenhower
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-critical rounded-lg p-4 bg-critical/5">
              <p className="font-medium text-critical mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Urgent et Important
              </p>
              <p className="text-sm text-text-secondary">{eisenhowerData.urgent_important?.length ?? 0} taches</p>
            </div>
            <div className="border border-warning rounded-lg p-4 bg-warning/5">
              <p className="font-medium text-warning mb-2 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Important seulement
              </p>
              <p className="text-sm text-text-secondary">{eisenhowerData.not_urgent_important?.length ?? 0} taches</p>
            </div>
            <div className="border border-primary rounded-lg p-4 bg-primary/5">
              <p className="font-medium text-primary mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Urgent seulement
              </p>
              <p className="text-sm text-text-secondary">{eisenhowerData.urgent_not_important?.length ?? 0} taches</p>
            </div>
            <div className="border border-border rounded-lg p-4 bg-bg-surface-hover">
              <p className="font-medium text-text-secondary mb-2 flex items-center gap-2">
                <Minus className="w-4 h-4" />
                Ni l'un ni l'autre
              </p>
              <p className="text-sm text-text-secondary">{eisenhowerData.not_urgent_not_important?.length ?? 0} taches</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
