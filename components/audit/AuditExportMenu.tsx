'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { toast } from '@/lib/stores/toast.store';
import { auditApi } from '@/lib/api/audit.api';
import { AuditLog, AuditLogFilters } from '@/lib/types/audit.types';
import {
  ExportColumn,
  exportTimestamp,
  exportToExcel,
  exportToPdf,
} from '@/lib/utils/export';
import {
  actorName,
  describeAction,
  formatAuditDateShort,
  metadataLabel,
  metadataValue,
  targetTypeLabel,
} from '@/lib/utils/audit-labels';
import { FileDown, FileSpreadsheet, FileText } from 'lucide-react';

/**
 * Colonnes de l'export. Volontairement plus riches que le tableau à l'écran :
 * un fichier d'audit sert de pièce justificative, il doit être auto-portant.
 */
const EXPORT_COLUMNS: ExportColumn<AuditLog>[] = [
  { header: 'Date', value: (l) => formatAuditDateShort(l.createdAt), width: 18, pdfWeight: 1.2 },
  { header: 'Action', value: (l) => describeAction(l.action).label, width: 26, pdfWeight: 1.6 },
  { header: 'Code action', value: (l) => l.action, width: 26, excelOnly: true },
  { header: 'Catégorie', value: (l) => describeAction(l.action).category, width: 14 },
  { header: 'Auteur', value: (l) => actorName(l), width: 24, pdfWeight: 1.3 },
  { header: 'Email auteur', value: (l) => l.userEmail, width: 28, pdfWeight: 1.6 },
  { header: 'Type d’objet', value: (l) => targetTypeLabel(l.targetType), width: 14 },
  { header: 'Identifiant objet', value: (l) => l.targetId, width: 26, excelOnly: true },
  {
    header: 'Contexte',
    value: (l) =>
      Object.entries(l.metadata ?? {})
        .map(
          ([key, value]) => `${metadataLabel(key)}: ${metadataValue(value, key)}`
        )
        .join(' | '),
    width: 40,
    // Colonne la plus dense : elle porte le detail metier de chaque action.
    pdfWeight: 3,
  },
  { header: 'Adresse IP', value: (l) => l.ip, width: 16, excelOnly: true },
  { header: 'Requête', value: (l) => l.requestId, width: 30, excelOnly: true },
];

interface AuditExportMenuProps {
  filters: AuditLogFilters;
  /** Résumé des filtres, imprimé en sous-titre du document. */
  filterSummary: string;
  disabled?: boolean;
}

export default function AuditExportMenu({
  filters,
  filterSummary,
  disabled,
}: AuditExportMenuProps) {
  const [pending, setPending] = useState<'excel' | 'pdf' | null>(null);

  const run = async (format: 'excel' | 'pdf') => {
    setPending(format);
    try {
      // On exporte l'intégralité du jeu filtré, pas seulement la page affichée.
      const data = await auditApi.export(filters);

      if (data.items.length === 0) {
        toast.error('Aucune entrée à exporter avec ces filtres');
        return;
      }

      const options = {
        filename: `journal-audit-${exportTimestamp()}`,
        title: 'Journal d’audit',
        subtitle: `${data.items.length} entrée${
          data.items.length > 1 ? 's' : ''
        } — ${filterSummary} — export du ${formatAuditDateShort(
          new Date().toISOString()
        )}`,
      };

      if (format === 'excel') {
        await exportToExcel(data.items, EXPORT_COLUMNS, options);
      } else {
        await exportToPdf(data.items, EXPORT_COLUMNS, options);
      }

      // Le serveur plafonne l'export : mieux vaut le dire que livrer un
      // fichier silencieusement incomplet.
      if (data.truncated) {
        toast.error(
          `Export limité aux ${data.limit} entrées les plus récentes sur ${data.total}. Affinez les filtres pour un export complet.`,
          { title: 'Export tronqué' }
        );
      } else {
        toast.success(`${data.items.length} entrées exportées`);
      }
    } catch {
      toast.error('L’export a échoué');
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
        disabled={disabled || pending !== null}
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
        disabled={disabled || pending !== null}
        className="flex items-center gap-1.5"
      >
        <FileText className="w-4 h-4" />
        PDF
      </Button>
    </div>
  );
}
