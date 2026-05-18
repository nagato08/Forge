'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useBurndown } from '@/lib/hooks/usePlanning';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { TrendingDown, Target, CheckCircle2, CalendarRange } from 'lucide-react';

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
        <TrendingDown className="w-12 h-12 text-text-weak mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Aucune donnee de burndown
        </h2>
        <p className="text-text-secondary">
          Completez des taches pour voir la courbe de progression
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
      <div className="flex items-center gap-3">
        <TrendingDown className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Burndown Chart</h1>
          <p className="text-text-secondary text-sm">Progression ideale vs reelle</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarRange className="w-4 h-4 text-text-secondary" />
          <h2 className="text-sm font-semibold text-text-primary">Periode</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Date de debut"
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
              <path d="M 50 0 L 0 0 0 30" fill="none" stroke="var(--border)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="800" height="380" fill="url(#grid)" />

          {/* Axes */}
          <line x1="50" y1="20" x2="50" y2="350" stroke="var(--text-weak)" strokeWidth="2" />
          <line x1="50" y1="350" x2="800" y2="350" stroke="var(--text-weak)" strokeWidth="2" />

          {/* Ideal line (blue dashed) */}
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

          {/* Actual line (green solid) */}
          {actualData.length > 0 && (
            <polyline
              points={actualData.map((val, i) => {
                const x = 50 + (i / (actualData.length - 1)) * 750;
                const y = 350 - getY(val);
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#3FB950"
              strokeWidth="2.5"
            />
          )}

          {/* Axis labels */}
          <text x="20" y="360" fontSize="12" fill="var(--text-weak)">0</text>
          <text x="20" y="40" fontSize="12" fill="var(--text-weak)">{maxValue}</text>

          {/* Date labels */}
          {burndownData.dates.filter((_, i) => i % Math.ceil(burndownData.dates.length / 6) === 0).map((date, i, arr) => {
            const totalDates = burndownData.dates.length;
            const originalIndex = burndownData.dates.indexOf(date);
            const x = 50 + (originalIndex / (totalDates - 1)) * 750;
            return (
              <text key={i} x={x} y="375" fontSize="10" fill="var(--text-weak)" textAnchor="middle">
                {new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
              </text>
            );
          })}
        </svg>

        <div className="mt-6 flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-primary opacity-50" style={{ borderTop: '2px dashed #2F81F7' }}></div>
            <span className="text-text-secondary">Ideale</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-success"></div>
            <span className="text-text-secondary">Reelle</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <p className="text-sm text-text-secondary font-medium">Objectif initial</p>
          </div>
          <p className="text-3xl font-bold text-primary">{idealData[0] || 0}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <p className="text-sm text-text-secondary font-medium">Completees</p>
          </div>
          <p className="text-3xl font-bold text-success">{actualData[actualData.length - 1] || 0}</p>
        </Card>
      </div>
    </div>
  );
}
