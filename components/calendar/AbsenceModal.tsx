'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { Absence, AbsenceType } from '@/lib/api/calendar.api';
import { useCreateAbsence, useUpdateAbsence } from '@/lib/hooks/useCalendar';
import { getApiError } from '@/lib/utils/api-error';
import { toast } from '@/lib/stores/toast.store';

export const ABSENCE_TYPE_LABELS: Record<AbsenceType, string> = {
  LEAVE: 'Congé',
  SICK: 'Maladie',
  REMOTE: 'Télétravail',
  TRAINING: 'Formation',
  OTHER: 'Autre',
};

const TYPE_OPTIONS = (Object.keys(ABSENCE_TYPE_LABELS) as AbsenceType[]).map(
  (value) => ({ value, label: ABSENCE_TYPE_LABELS[value] })
);

interface AbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Renseigné pour une modification, absent pour une déclaration. */
  absence?: Absence | null;
  /** Jour cliqué dans la grille, pré-rempli comme date de début. */
  defaultDay?: string | null;
}

/**
 * Déclaration d'une indisponibilité — toujours pour soi-même, sans validation
 * hiérarchique : l'agenda sert à savoir qui est là quand, pas à arbitrer des
 * demandes de congés.
 */
export default function AbsenceModal({
  isOpen,
  onClose,
  absence,
  defaultDay,
}: AbsenceModalProps) {
  const createMutation = useCreateAbsence();
  const updateMutation = useUpdateAbsence();
  const isEditing = Boolean(absence);

  const [type, setType] = useState<AbsenceType>('LEAVE');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // Réaligne le formulaire à chaque ouverture : sur la période à modifier, ou
  // sur le jour cliqué dans la grille pour une nouvelle déclaration.
  useEffect(() => {
    if (!isOpen) return;
    if (absence) {
      setType(absence.type);
      setStartDate(absence.startDate.split('T')[0]);
      setEndDate(absence.endDate.split('T')[0]);
      setReason(absence.reason ?? '');
    } else {
      const day = defaultDay ?? new Date().toISOString().split('T')[0];
      setType('LEAVE');
      setStartDate(day);
      setEndDate(day);
      setReason('');
    }
  }, [isOpen, absence, defaultDay]);

  const handleSubmit = () => {
    if (!startDate || !endDate) {
      toast.error('Les deux dates sont requises');
      return;
    }
    if (endDate < startDate) {
      toast.error('La date de fin ne peut pas précéder la date de début');
      return;
    }

    const payload = {
      type,
      startDate,
      endDate,
      reason: reason.trim() || undefined,
    };

    const onSuccess = () => {
      toast.success(isEditing ? 'Disponibilité modifiée' : 'Indisponibilité déclarée');
      onClose();
    };
    const onError = (err: unknown) =>
      toast.error(getApiError(err), { title: 'Enregistrement impossible' });

    if (absence) {
      updateMutation.mutate({ absenceId: absence.id, ...payload }, { onSuccess, onError });
    } else {
      createMutation.mutate(payload, { onSuccess, onError });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Modifier la disponibilité' : 'Déclarer une indisponibilité'}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={createMutation.isPending || updateMutation.isPending}
          >
            {isEditing ? 'Enregistrer' : 'Déclarer'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Select
          label="Nature"
          options={TYPE_OPTIONS}
          value={type}
          onChange={(e) => setType(e.target.value as AbsenceType)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Du"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              // Une période d'un seul jour est le cas courant : on suit la
              // date de début tant que la fin n'a pas été reculée à la main.
              if (!endDate || endDate < e.target.value) setEndDate(e.target.value);
            }}
          />
          <Input
            label="Au"
            type="date"
            min={startDate}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <Textarea
          label="Motif"
          placeholder="Visible de vous seul"
          helperText="Le motif reste privé : l’équipe ne voit que la période et sa nature."
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </Modal>
  );
}
