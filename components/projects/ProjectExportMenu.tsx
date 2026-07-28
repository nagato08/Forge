'use client';

import { useState } from 'react';
import { searchApi } from '@/lib/api/search.api';
import { ProjectExportTask } from '@/lib/types/planning.types';
import {
  ExportColumn,
  exportTimestamp,
  exportToExcel,
  exportToPdf,
} from '@/lib/utils/export';
import { getApiError } from '@/lib/utils/api-error';
import { toast } from '@/lib/stores/toast.store';
import Button from '@/components/ui/Button';
import { FileDown, FileSpreadsheet, FileText } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  TODO: 'À faire',
  DOING: 'En cours',
  DONE: 'Terminé',
};

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR') : '';

/**
 * Colonnes de l'export des tâches.
 *
 * Réutilise l'utilitaire générique écrit pour le journal d'audit : on décrit
 * les colonnes, il produit le fichier.
 */
const TASK_COLUMNS: ExportColumn<ProjectExportTask>[] = [
  { header: 'Tâche', value: (t) => t.title, width: 36 },
  { header: 'Statut', value: (t) => STATUS_LABELS[t.status] ?? t.status, width: 12 },
  { header: 'Priorité', value: (t) => t.priority, width: 12 },
  { header: 'Sprint', value: (t) => t.sprint, width: 20 },
  { header: 'Début', value: (t) => formatDate(t.startDate), width: 12 },
  { header: 'Fin', value: (t) => formatDate(t.endDate), width: 12 },
  { header: 'Échéance', value: (t) => formatDate(t.deadline), width: 12 },
  { header: 'Points', value: (t) => t.storyPoints, width: 8 },
  { header: 'Assignés', value: (t) => t.assignees, width: 28 },
  { header: 'Checklist', value: (t) => t.checklistProgress, width: 10 },
  { header: 'Temps passé (h)', value: (t) => t.timeSpentHours, width: 14 },
  {
    header: 'Dérive (j)',
    // Signe explicite : « +3 » se lit mieux que « 3 » pour un retard.
    value: (t) =>
      t.driftDays === null ? '' : t.driftDays > 0 ? `+${t.driftDays}` : t.driftDays,
    width: 10,
  },
];

interface ProjectExportMenuProps {
  projectId: string;
}

export default function ProjectExportMenu({
  projectId,
}: ProjectExportMenuProps) {
  const [pending, setPending] = useState<'excel' | 'pdf' | null>(null);

  const run = async (format: 'excel' | 'pdf') => {
    setPending(format);
    try {
      const data = await searchApi.exportProject(projectId);

      if (data.tasks.length === 0) {
        toast.error('Ce projet ne contient aucune tâche à exporter');
        return;
      }

      const options = {
        filename: `projet-${data.project.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')}-${exportTimestamp()}`,
        title: data.project.name,
        subtitle: `${data.tasks.length} tâche${
          data.tasks.length > 1 ? 's' : ''
        } — ${data.members.length} membre${
          data.members.length > 1 ? 's' : ''
        } — export du ${new Date().toLocaleDateString('fr-FR')}`,
      };

      if (format === 'excel') {
        await exportToExcel(data.tasks, TASK_COLUMNS, options);
      } else {
        await exportToPdf(data.tasks, TASK_COLUMNS, options);
      }

      toast.success(`${data.tasks.length} tâches exportées`);
    } catch (err) {
      toast.error(getApiError(err), { title: 'Export impossible' });
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="hidden sm:flex items-center gap-1.5 text-xs text-text-secondary">
        <FileDown className="w-3.5 h-3.5" />
        Exporter
      </span>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => run('excel')}
        isLoading={pending === 'excel'}
        disabled={pending !== null}
        className="flex items-center gap-1.5"
      >
        <FileSpreadsheet className="w-4 h-4" />
        Excel
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => run('pdf')}
        isLoading={pending === 'pdf'}
        disabled={pending !== null}
        className="flex items-center gap-1.5"
      >
        <FileText className="w-4 h-4" />
        PDF
      </Button>
    </div>
  );
}
