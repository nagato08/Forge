import { describeAction } from '@/lib/utils/audit-labels';

const SEVERITY_STYLES = {
  critical: 'bg-critical/10 text-critical border-critical/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  info: 'bg-primary/10 text-primary border-primary/30',
} as const;

interface AuditActionBadgeProps {
  action: string;
  className?: string;
}

/**
 * Pastille d'action, colorée selon la gravité : l'irréversible (suppression,
 * transfert de propriété) doit sauter aux yeux dans une longue liste.
 */
export default function AuditActionBadge({
  action,
  className = '',
}: AuditActionBadgeProps) {
  const { label, severity } = describeAction(action);

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-md border text-xs font-medium whitespace-nowrap ${SEVERITY_STYLES[severity]} ${className}`}
      title={action}
    >
      {label}
    </span>
  );
}
