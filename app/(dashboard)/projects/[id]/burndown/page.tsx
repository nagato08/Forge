'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useBurndown } from '@/lib/hooks/usePlanning';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';

export default function BurndownPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const { data: burndownData, isLoading, error } = useBurndown(projectId, {
    startDate,
    endDate,
  });

  if (isLoading) {
    return <Spinner centered size="lg" label="Chargement du burndown..." />;
  }

  if (error) {
    return (
      <Alert
        type="error"
        title="Erreur"
        message="Impossible de charger le burndown"
      />
    );
  }

  if (!burndownData || !burndownData.dates || burndownData.dates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📈</div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Aucune donnée de burndown
        </h2>
        <p className="text-text-secondary">
          Complétez des tâches pour voir la courbe de progression
        </p>
      </div>
    );
  }

  const idealData = burndownData.ideal || [];
  const actualData = burndownData.actual || [];
  const maxValue = Math.max(...idealData, ...actualData) || 100;
  const getY = (value: number) => ((maxValue - value) / maxValue) * 300;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">📈 Burndown Chart</h1>
        <p className="text-text-secondary mt-1">Progression idéale vs réelle</p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Date de début"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="Date de fin"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </Card>

      <Card className="p-6 overflow-x-auto">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Courbe de progression</h2>
        <svg width="100%" height="400" viewBox="0 0 800 380" className="min-w-max">
          {/* Grid */}
          <defs>
            <pattern id="grid" width="50" height="30" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 30" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="800" height="380" fill="url(#grid)" />

          {/* Axes */}
          <line x1="50" y1="20" x2="50" y2="350" stroke="#94a3b8" strokeWidth="2" />
          <line x1="50" y1="350" x2="800" y2="350" stroke="#94a3b8" strokeWidth="2" />

          {/* Ideal line (blue) */}
          {idealData.length > 0 && (
            <polyline
              points={idealData.map((val, i) => {
                const x = 50 + (i / (idealData.length - 1)) * 750;
                const y = 350 - getY(val);
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#2F81F7"
              strokeWidth="2"
              opacity="0.5"
              strokeDasharray="5,5"
            />
          )}

          {/* Actual line (green) */}
          {actualData.length > 0 && (
            <polyline
              points={actualData.map((val, i) => {
                const x = 50 + (i / (actualData.length - 1)) * 750;
                const y = 350 - getY(val);
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#3FB950"
              strokeWidth="2"
            />
          )}

          {/* Labels */}
          <text x="20" y="360" fontSize="12" fill="#64748b">
            0
          </text>
          <text x="20" y="40" fontSize="12" fill="#64748b">
            {maxValue}
          </text>
        </svg>

        <div className="mt-6 flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-primary opacity-50"></div>
            <span className="text-text-secondary">Idéale</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-success"></div>
            <span className="text-text-secondary">Réelle</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <p className="text-sm text-text-secondary font-medium mb-2">🎯 Objectif initial</p>
          <p className="text-3xl font-bold text-primary">{idealData[0] || 0}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-text-secondary font-medium mb-2">✅ Complétées</p>
          <p className="text-3xl font-bold text-success">{actualData[actualData.length - 1] || 0}</p>
        </Card>
      </div>
    </div>
  );
}
