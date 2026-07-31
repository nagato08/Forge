'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useProjectRole } from '@/lib/hooks/useProjects';
import { useAuthStore } from '@/lib/stores/auth.store';
import DifficultiesView from '@/components/projects/issues/DifficultiesView';
import StatusReportView from '@/components/projects/issues/StatusReportView';
import { AlertOctagon, FileBarChart } from 'lucide-react';

type ViewMode = 'difficulties' | 'report';

/**
 * Deux vues volontairement séparées, jamais mélangées : le journal de
 * difficultés (vivant, un signalement à la fois) et le rapport d'état
 * (une photographie figée à imprimer). Les confondre dans un seul écran
 * aurait produit la confusion que ce basculement évite.
 */
export default function DifficultiesPage() {
  const params = useParams();
  const projectId = params.id as string;
  const userId = useAuthStore((state) => state.user?.id);
  const { canManage: canManageProject, canContribute: canContributeProject } =
    useProjectRole(projectId);

  const [view, setView] = useState<ViewMode>('difficulties');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Difficultés</h1>
          <p className="text-sm text-text-secondary mt-1">
            Ce que l'équipe rencontre sur le terrain, et la synthèse à
            imprimer pour un point d'avancement.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-bg-surface-hover border border-border">
          <button
            onClick={() => setView('difficulties')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'difficulties'
                ? 'bg-bg-surface text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            Difficultés
          </button>
          <button
            onClick={() => setView('report')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'report'
                ? 'bg-bg-surface text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <FileBarChart className="w-4 h-4" />
            Rapport d'état
          </button>
        </div>
      </div>

      {view === 'difficulties' ? (
        <DifficultiesView
          projectId={projectId}
          currentUserId={userId}
          canManageProject={canManageProject}
          canContribute={canContributeProject}
        />
      ) : (
        <StatusReportView projectId={projectId} />
      )}
    </div>
  );
}
