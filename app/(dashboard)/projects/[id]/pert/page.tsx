'use client';

import { useParams } from 'next/navigation';
import { usePert } from '@/lib/hooks/usePlanning';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import {
  Network,
  ClipboardList,
  GitBranch,
  Route,
  Timer,
  AlertTriangle,
  Info,
} from 'lucide-react';

export default function PertPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { data: pertData, isLoading, error } = usePert(projectId);

  if (isLoading) {
    return <Spinner centered size="lg" label="Chargement du reseau PERT..." />;
  }

  if (error) {
    return (
      <Alert
        type="error"
        title="Erreur"
        message="Impossible de charger le reseau PERT"
      />
    );
  }

  if (!pertData || !pertData.nodes || pertData.nodes.length === 0) {
    return (
      <div className="text-center py-12">
        <Network className="w-12 h-12 text-text-weak mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Aucune tache avec PERT
        </h2>
        <p className="text-text-secondary">
          Ajoutez des estimations PERT (optimiste, probable, pessimiste) aux taches
        </p>
      </div>
    );
  }

  const criticalTasks = (pertData.nodes || []).filter((n) =>
    pertData.criticalPath?.includes(n.id)
  );

  const totalCriticalDuration = criticalTasks.reduce((sum, t) => sum + (t.expectedTime || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Network className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Reseau PERT</h1>
          <p className="text-text-secondary text-sm">Analyse des dependances et du chemin critique</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="w-4 h-4 text-primary" />
            <p className="text-sm text-text-secondary font-medium">Taches totales</p>
          </div>
          <p className="text-3xl font-bold text-primary">{pertData.nodes.length}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="w-4 h-4 text-primary" />
            <p className="text-sm text-text-secondary font-medium">Dependances</p>
          </div>
          <p className="text-3xl font-bold text-primary">{pertData.edges.length}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Route className="w-4 h-4 text-critical" />
            <p className="text-sm text-text-secondary font-medium">Chemin critique</p>
          </div>
          <p className="text-3xl font-bold text-critical">{pertData.criticalPath.length}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="w-4 h-4 text-critical" />
            <p className="text-sm text-text-secondary font-medium">Duree critique</p>
          </div>
          <p className="text-3xl font-bold text-critical">{totalCriticalDuration} jours</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-critical" />
          Taches du chemin critique
        </h2>
        <div className="space-y-3">
          {criticalTasks.length === 0 ? (
            <p className="text-text-secondary text-sm">Aucune tache sur le chemin critique</p>
          ) : (
            criticalTasks.map((task) => (
              <div key={task.id} className="border border-critical/30 rounded-lg p-4 bg-critical/5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-text-primary">{task.title}</p>
                    <p className="text-xs text-text-secondary mt-1">
                      Duree estimee: <span className="font-semibold">{task.expectedTime} jours</span>
                    </p>
                  </div>
                  <div className="text-xs text-text-secondary text-right">
                    <p>Te = ({task.optimisticDays} + 4x{task.probableDays} + {task.pessimisticDays})/6</p>
                    {task.variance != null && <p className="mt-1">Variance: {task.variance.toFixed(2)}</p>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          Toutes les taches PERT
        </h2>
        <div className="space-y-2">
          {pertData.nodes.map((task) => {
            const isCritical = pertData.criticalPath.includes(task.id);
            return (
              <div
                key={task.id}
                className={`p-3 rounded-lg ${
                  isCritical
                    ? 'border border-critical/50 bg-critical/5'
                    : 'bg-bg-surface-hover'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{task.title}</p>
                    <p className="text-xs text-text-secondary mt-1">
                      Optimiste: {task.optimisticDays}j | Probable: {task.probableDays}j | Pessimiste: {task.pessimisticDays}j
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">{task.expectedTime}j</p>
                    {isCritical && (
                      <p className="text-xs text-critical font-medium">Critique</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="bg-info/10 border border-info rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-info shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-text-primary font-medium mb-1">Formule PERT</p>
          <p className="text-xs text-text-secondary">
            Duree estimee (Te) = (Optimiste + 4 x Probable + Pessimiste) / 6
          </p>
        </div>
      </div>
    </div>
  );
}
