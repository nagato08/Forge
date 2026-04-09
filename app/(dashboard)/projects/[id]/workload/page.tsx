'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useWorkload } from '@/lib/hooks/usePlanning';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function WorkloadPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [groupBy, setGroupBy] = useState<'day' | 'week'>('week');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const { data: workloadData, isLoading, error } = useWorkload({
    projectId,
    startDate,
    endDate,
    groupBy,
  });

  if (isLoading) {
    return <Spinner centered size="lg" label="Chargement de la charge de travail..." />;
  }

  if (error) {
    return (
      <Alert
        type="error"
        title="Erreur"
        message="Impossible de charger la charge de travail"
      />
    );
  }

  if (!workloadData || workloadData.entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚙️</div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Aucune donnée de charge
        </h2>
        <p className="text-text-secondary">
          Assignez des tâches et enregistrez du temps pour voir la charge de travail
        </p>
      </div>
    );
  }

  // Grouper par utilisateur
  const userGroups = new Map<string, number>();
  workloadData.entries.forEach((entry) => {
    const current = userGroups.get(entry.userId) || 0;
    userGroups.set(entry.userId, current + entry.hours);
  });

  const maxHours = Math.max(...Array.from(userGroups.values()), 40);
  const overloadThreshold = 40;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">⚙️ Charge de travail</h1>
        <p className="text-text-secondary mt-1">Répartition du travail par utilisateur</p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text-primary">Date de début</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary">Date de fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={groupBy === 'day' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setGroupBy('day')}
            >
              Par jour
            </Button>
            <Button
              variant={groupBy === 'week' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setGroupBy('week')}
            >
              Par semaine
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-6">📊 Charge par utilisateur</h2>
        <div className="space-y-4">
          {Array.from(userGroups.entries()).map(([userId, hours]) => {
            const isOverloaded = hours > overloadThreshold;
            const percentage = (hours / maxHours) * 100;

            return (
              <div key={userId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text-primary">
                    {workloadData.entries.find((e) => e.userId === userId)?.userName}
                  </p>
                  <div className="flex gap-3 text-sm">
                    <span className="font-semibold text-text-primary">{hours}h</span>
                    {isOverloaded && (
                      <span className="text-critical font-medium">
                        ⚠️ Surchargé
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full h-3 bg-bg-surface-hover rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all rounded-full ${
                      isOverloaded ? 'bg-critical' : 'bg-success'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <p className="text-sm text-text-secondary font-medium mb-2">⏱️ Heures totales</p>
          <p className="text-3xl font-bold text-primary">{workloadData.totalHours}h</p>
          <p className="text-xs text-text-secondary mt-2">
            Moyenne: {(workloadData.totalHours / userGroups.size).toFixed(1)}h/personne
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-text-secondary font-medium mb-2">👥 Charge</p>
          <p className="text-3xl font-bold text-primary">{userGroups.size}</p>
          <p className="text-xs text-text-secondary mt-2">
            Personnes
          </p>
        </Card>
      </div>

      <div className="bg-warning/10 border border-warning rounded-lg p-4">
        <p className="text-sm text-text-primary font-medium mb-2">⚠️ Seuil de surcharge</p>
        <p className="text-xs text-text-secondary">
          Au-delà de {overloadThreshold}h par semaine, l'utilisateur est considéré comme surchargé
        </p>
      </div>
    </div>
  );
}
