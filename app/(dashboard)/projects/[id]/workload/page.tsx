'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useWorkload } from '@/lib/hooks/usePlanning';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Activity, Clock, Users, AlertTriangle, Info, Cpu } from 'lucide-react';

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

  if (!workloadData || !workloadData.entries || workloadData.entries.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="w-12 h-12 text-text-weak mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Aucune donnee de charge
        </h2>
        <p className="text-text-secondary">
          Assignez des taches et enregistrez du temps pour voir la charge de travail
        </p>
      </div>
    );
  }

  // Le backend agrège déjà par utilisateur et calcule la surcharge — pas
  // besoin de resommer côté client, ce qui avait fini par ignorer le vrai
  // seuil (paramètres du projet) au profit d'une constante à 40h en dur.
  const { entries, overloadThresholdHours, chargeUnit, machine } = workloadData;
  const unitLabel = chargeUnit === 'PERSON_DAYS' ? 'j' : 'h';
  const maxHours = Math.max(...entries.map((e) => e.hours), overloadThresholdHours);
  const periodLabel = groupBy === 'week' ? 'semaine' : 'jour';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Charge de travail</h1>
          <p className="text-text-secondary text-sm">Repartition du travail par utilisateur</p>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text-primary">Date de debut</label>
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
        <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Charge par utilisateur
        </h2>
        <div className="space-y-4">
          {entries.map((entry) => {
            const percentage = (entry.hours / maxHours) * 100;

            return (
              <div key={entry.userId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text-primary">{entry.userName}</p>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-semibold text-text-primary">
                      {entry.hours}{unitLabel}
                    </span>
                    {entry.isOverloaded && (
                      <span className="text-critical font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Surcharge
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full h-3 bg-bg-surface-hover rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all rounded-full ${
                      entry.isOverloaded ? 'bg-critical' : 'bg-success'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Capacité machine : un plafond collectif, pas un score individuel —
          affichée séparément pour ne pas laisser croire qu'elle mesure une
          personne. */}
      {machine && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-1 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            Capacité machine
          </h2>
          <p className="text-xs text-text-secondary mb-6">
            Plafond de l'équipe entière par {periodLabel} — {machine.capacityPerPeriod}
            {unitLabel}, indépendant du nombre de personnes qui s'y relaient.
          </p>
          <div className="space-y-3">
            {machine.byPeriod.map((period) => {
              const percentage = (period.hours / Math.max(machine.capacityPerPeriod, period.hours)) * 100;
              return (
                <div key={period.date} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">
                      {new Date(period.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-primary">
                        {period.hours}{unitLabel} / {machine.capacityPerPeriod}{unitLabel}
                      </span>
                      {period.overCapacity && (
                        <span className="text-critical font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Dépassée
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full h-2 bg-bg-surface-hover rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all rounded-full ${
                        period.overCapacity ? 'bg-critical' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-primary" />
            <p className="text-sm text-text-secondary font-medium">
              {chargeUnit === 'PERSON_DAYS' ? 'Jours-homme totaux' : 'Heures totales'}
            </p>
          </div>
          <p className="text-3xl font-bold text-primary">
            {workloadData.totalHours}{unitLabel}
          </p>
          <p className="text-xs text-text-secondary mt-2">
            Moyenne: {(workloadData.totalHours / entries.length).toFixed(1)}{unitLabel}/personne
          </p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-primary" />
            <p className="text-sm text-text-secondary font-medium">Personnes</p>
          </div>
          <p className="text-3xl font-bold text-primary">{entries.length}</p>
        </Card>
      </div>

      <div className="bg-warning/10 border border-warning rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-text-primary font-medium mb-1">Seuil de surcharge</p>
          <p className="text-xs text-text-secondary">
            Au-dela de {overloadThresholdHours}{unitLabel} par {periodLabel}, l'utilisateur est considere comme surcharge
          </p>
        </div>
      </div>
    </div>
  );
}
