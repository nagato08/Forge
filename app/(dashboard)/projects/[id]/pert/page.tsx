'use client';

import { useParams } from 'next/navigation';
import { usePert } from '@/lib/hooks/usePlanning';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';

export default function PertPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { data: pertData, isLoading, error } = usePert(projectId);

  if (isLoading) {
    return <Spinner centered size="lg" label="Chargement du réseau PERT..." />;
  }

  if (error) {
    return (
      <Alert
        type="error"
        title="Erreur"
        message="Impossible de charger le réseau PERT"
      />
    );
  }

  if (!pertData || !pertData.nodes || pertData.nodes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🔗</div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Aucune tâche avec PERT
        </h2>
        <p className="text-text-secondary">
          Ajoutez des estimations PERT (optimiste, probable, pessimiste) aux tâches
        </p>
      </div>
    );
  }

  const criticalTasks = (pertData.nodes || []).filter((n) =>
    pertData.criticalPath?.includes(n.id)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">🔗 Réseau PERT</h1>
        <p className="text-text-secondary mt-1">Analyse des dépendances et du chemin critique</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-text-secondary font-medium mb-2">📋 Tâches totales</p>
          <p className="text-3xl font-bold text-primary">{pertData.nodes.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-text-secondary font-medium mb-2">🔗 Dépendances</p>
          <p className="text-3xl font-bold text-primary">{pertData.edges.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-text-secondary font-medium mb-2">🎯 Chemin critique</p>
          <p className="text-3xl font-bold text-critical">{pertData.criticalPath.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-text-secondary font-medium mb-2">⏱️ Durée critique</p>
          <p className="text-3xl font-bold text-critical">
            {criticalTasks.reduce((sum, t) => sum + (t.expectedTime || 0), 0)} jours
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">📊 Tâches du chemin critique</h2>
        <div className="space-y-3">
          {criticalTasks.length === 0 ? (
            <p className="text-text-secondary text-sm">Aucune tâche sur le chemin critique</p>
          ) : (
            criticalTasks.map((task) => (
              <div key={task.id} className="border border-critical/30 rounded-lg p-4 bg-critical/5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-text-primary">{task.title}</p>
                    <p className="text-xs text-text-secondary mt-1">
                      Durée estimée: <span className="font-semibold">{task.expectedTime} jours</span>
                    </p>
                  </div>
                  <div className="text-xs text-text-secondary">
                    <p>📊 Te = ({task.optimisticDays} + 4×{task.probableDays} + {task.pessimisticDays})/6</p>
                    {task.variance && <p className="mt-1">Variance: {task.variance.toFixed(2)}</p>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">📈 Toutes les tâches PERT</h2>
        <div className="space-y-2">
          {pertData.nodes.map((task) => (
            <div
              key={task.id}
              className={`p-3 rounded-lg ${
                pertData.criticalPath.includes(task.id)
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
                  {pertData.criticalPath.includes(task.id) && (
                    <p className="text-xs text-critical font-medium">Critique</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="bg-info/10 border border-info rounded-lg p-4">
        <p className="text-sm text-text-primary font-medium mb-2">ℹ️ Formule PERT</p>
        <p className="text-xs text-text-secondary">
          Durée estimée (Te) = (Optimiste + 4 × Probable + Pessimiste) / 6
        </p>
      </div>
    </div>
  );
}
