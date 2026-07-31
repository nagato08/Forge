'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import { useTasks } from '@/lib/hooks/useTasks';
import { useCreateIssue } from '@/lib/hooks/useProjectIssues';
import { IssueSeverity } from '@/lib/api/project-issue.api';
import { getApiError } from '@/lib/utils/api-error';
import { toast } from '@/lib/stores/toast.store';

const SEVERITY_OPTIONS: { value: IssueSeverity; label: string }[] = [
  { value: 'LOW', label: 'Faible' },
  { value: 'MEDIUM', label: 'Moyenne' },
  { value: 'HIGH', label: 'Élevée' },
];

interface IssueFormModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  /** Pré-remplit la tâche concernée quand le signalement part d'une tâche précise. */
  defaultTaskId?: string;
}

/**
 * Formulaire de signalement d'une difficulté — ouvert à tout contributeur, pas
 * seulement aux gestionnaires : c'est celui qui a les mains dans la tâche qui
 * sait ce qui bloque.
 */
export default function IssueFormModal({
  projectId,
  isOpen,
  onClose,
  defaultTaskId,
}: IssueFormModalProps) {
  const { data: tasks } = useTasks(projectId);
  const createMutation = useCreateIssue(projectId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<IssueSeverity>('MEDIUM');
  const [taskId, setTaskId] = useState(defaultTaskId ?? '');

  const reset = () => {
    setTitle('');
    setDescription('');
    setSeverity('MEDIUM');
    setTaskId(defaultTaskId ?? '');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    createMutation.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        severity,
        taskId: taskId || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Difficulté signalée');
          handleClose();
        },
        onError: (err) =>
          toast.error(getApiError(err), { title: 'Signalement impossible' }),
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Signaler une difficulté"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={createMutation.isPending}
          >
            Signaler
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="Titre"
          placeholder="Ex. : Blocage sur l'intégration du paiement"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <Textarea
          label="Description"
          placeholder="Ce qui bloque, depuis quand, ce qui a déjà été essayé..."
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Select
          label="Gravité"
          options={SEVERITY_OPTIONS}
          value={severity}
          onChange={(e) => setSeverity(e.target.value as IssueSeverity)}
        />
        <Select
          label="Tâche concernée"
          placeholder="Aucune tâche précise — difficulté générale au projet"
          options={(tasks ?? []).map((t) => ({ value: t.id, label: t.title }))}
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
        />
      </div>
    </Modal>
  );
}
