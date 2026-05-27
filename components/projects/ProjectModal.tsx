'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Project, Priority, ProjectStatus } from '@/lib/types/project.types';
import { useCreateProject, useUpdateProject } from '@/lib/hooks/useProjects';
import Modal from '@/components/ui/Modal';
import { Button, Input, Textarea, Select } from '@/components/ui';
import { toast } from '@/lib/stores/toast.store';
import { getApiError } from '@/lib/utils/api-error';

const projectSchema = z.object({
  name: z.string().min(3, 'Nom requis (min 3 caractères)'),
  description: z.string().optional(),
  objectives: z.string().optional(),
  priority: z.nativeEnum(Priority),
  status: z.nativeEnum(ProjectStatus).optional(),
  startDate: z.string().min(1, 'Date de début requise'),
  endDate: z.string().optional(),
});

type ProjectForm = z.infer<typeof projectSchema>;

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
}

const priorityOptions = [
  { value: Priority.LOW, label: 'Basse' },
  { value: Priority.MEDIUM, label: 'Moyenne' },
  { value: Priority.HIGH, label: 'Haute' },
  { value: Priority.CRITICAL, label: 'Critique' },
];

const statusOptions = [
  { value: ProjectStatus.PLANNING, label: 'Planification' },
  { value: ProjectStatus.ACTIVE, label: 'Actif' },
  { value: ProjectStatus.ON_HOLD, label: 'Suspendu' },
  { value: ProjectStatus.COMPLETED, label: 'Terminé' },
  { value: ProjectStatus.CANCELLED, label: 'Annulé' },
];

export default function ProjectModal({
  isOpen,
  onClose,
  project,
}: ProjectModalProps) {
  const isEditing = !!project;
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: project ? {
      name: project.name,
      description: project.description,
      objectives: project.objectives,
      priority: project.priority,
      status: project.status,
      startDate: project.startDate.split('T')[0],
      endDate: project.endDate?.split('T')[0],
    } : {
      priority: Priority.MEDIUM,
      status: ProjectStatus.PLANNING,
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = (raw: ProjectForm) => {
    // Nettoyage : supprime les chaînes vides pour les champs optionnels
    // (sinon @IsDateString backend rejette les strings vides)
    const data = {
      ...raw,
      description: raw.description?.trim() || undefined,
      objectives: raw.objectives?.trim() || undefined,
      endDate: raw.endDate?.trim() || undefined,
    };

    if (isEditing && project) {
      console.log('📝 Updating project:', project.id, data.name);
      updateMutation.mutate(
        { projectId: project.id, data },
        {
          onSuccess: () => {
            console.log(' Project updated:', project.id);
            reset();
            onClose();
          },
          onError: (err) => {
            toast.error(getApiError(err), { title: 'Échec mise à jour' });
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          reset();
          onClose();
        },
        onError: (err) => {
          toast.error(getApiError(err), { title: 'Échec création' });
        },
      });
    }
  };

  const isLoading = isEditing
    ? updateMutation.isPending
    : createMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Éditer le projet' : 'Nouveau projet'}
      size="md"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={isLoading}>
            {isEditing ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nom du projet"
          placeholder="Mon super projet"
          error={errors.name?.message}
          {...register('name')}
          autoFocus
        />

        <Textarea
          label="Description"
          placeholder="Décrivez votre projet..."
          rows={3}
          error={errors.description?.message}
          {...register('description')}
        />

        <Textarea
          label="Objectifs"
          placeholder="Objectifs du projet..."
          rows={2}
          error={errors.objectives?.message}
          {...register('objectives')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Priorité"
            options={priorityOptions}
            error={errors.priority?.message}
            {...register('priority')}
          />
          {isEditing && (
            <Select
              label="Statut"
              options={statusOptions}
              error={errors.status?.message}
              {...register('status')}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date de début"
            type="date"
            error={errors.startDate?.message}
            {...register('startDate')}
          />
          <Input
            label="Date de fin"
            type="date"
            error={errors.endDate?.message}
            {...register('endDate')}
          />
        </div>
      </form>
    </Modal>
  );
}
