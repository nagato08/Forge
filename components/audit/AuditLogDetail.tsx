'use client';

import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import AuditActionBadge from './AuditActionBadge';
import { AuditLog } from '@/lib/types/audit.types';
import {
  actorName,
  describeAction,
  formatAuditDate,
  formatRelative,
  formatUserAgent,
  metadataLabel,
  metadataValue,
  targetTypeLabel,
} from '@/lib/utils/audit-labels';

interface AuditLogDetailProps {
  log: AuditLog | null;
  onClose: () => void;
}

/** Ligne étiquette / valeur du panneau de détail. */
function Field({
  label,
  children,
  mono = false,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-3 py-2 border-b border-border last:border-0">
      <dt className="text-xs font-medium text-text-secondary sm:pt-0.5">
        {label}
      </dt>
      <dd
        className={`sm:col-span-2 text-sm text-text-primary break-words ${
          mono ? 'font-mono text-xs' : ''
        }`}
      >
        {children}
      </dd>
    </div>
  );
}

/**
 * Détail complet d'une entrée : ce que l'action signifie, qui l'a faite, sur
 * quoi, depuis où, et avec quel identifiant de corrélation.
 */
export default function AuditLogDetail({ log, onClose }: AuditLogDetailProps) {
  if (!log) return null;

  const { description, category } = describeAction(log.action);
  const metadataEntries = Object.entries(log.metadata ?? {});

  return (
    <Modal
      isOpen={!!log}
      onClose={onClose}
      title="Détail de l’entrée"
      size="lg"
      footer={
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Explication en clair, avant toute donnée technique */}
        <div className="p-3 rounded-lg bg-bg-surface-hover border border-border">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <AuditActionBadge action={log.action} />
            <span className="text-xs text-text-secondary">{category}</span>
          </div>
          <p className="text-sm text-text-secondary">{description}</p>
        </div>

        <dl>
          <Field label="Date">
            {formatAuditDate(log.createdAt)}
            <span className="text-text-secondary">
              {' '}
              ({formatRelative(log.createdAt)})
            </span>
          </Field>

          <Field label="Auteur">
            <div>
              {actorName(log)}
              {log.userEmail && (
                <span className="text-text-secondary"> — {log.userEmail}</span>
              )}
            </div>
            {!log.user && log.userId === null && (
              <p className="text-xs text-warning mt-1">
                Le compte a été supprimé depuis. L’entrée est conservée.
              </p>
            )}
          </Field>

          <Field label="Objet visé">
            {log.targetType || log.targetId ? (
              <>
                {targetTypeLabel(log.targetType)}
                {log.targetId && (
                  <span className="font-mono text-xs text-text-secondary">
                    {' '}
                    {log.targetId}
                  </span>
                )}
              </>
            ) : (
              '—'
            )}
          </Field>

          {metadataEntries.length > 0 && (
            <Field label="Contexte">
              <ul className="space-y-1">
                {metadataEntries.map(([key, value]) => (
                  <li key={key}>
                    <span className="text-text-secondary">
                      {metadataLabel(key)} :{' '}
                    </span>
                    <span className="font-mono text-xs">
                      {metadataValue(value, key)}
                    </span>
                  </li>
                ))}
              </ul>
            </Field>
          )}

        </dl>

        {/*
          Origine et corrélation sont repliées : ces champs servent à l'enquête,
          pas à la lecture courante. Ils restent enregistrés en base dans tous
          les cas — seul leur affichage est mis au second plan.
        */}
        <details className="group border border-border rounded-lg">
          <summary className="px-3 py-2 text-xs font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary transition-colors">
            Détails techniques
          </summary>

          <div className="px-3 pb-3">
            <dl>
              <Field label="Adresse IP" mono>
                {log.ip ?? '—'}
              </Field>

              {/* Chaîne brute au survol : lisible par défaut, complète si besoin */}
              <Field label="Navigateur">
                <span title={log.userAgent ?? undefined}>
                  {formatUserAgent(log.userAgent)}
                </span>
              </Field>

              <Field label="Identifiant de requête" mono>
                {log.requestId ?? '—'}
              </Field>
            </dl>

            {log.requestId && (
              <p className="text-xs text-text-secondary mt-2">
                Cet identifiant figure dans les logs du serveur : il permet de
                retrouver toutes les traces techniques de la même opération.
              </p>
            )}
          </div>
        </details>
      </div>
    </Modal>
  );
}
