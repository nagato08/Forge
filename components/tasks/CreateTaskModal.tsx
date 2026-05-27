'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Priority, TaskStatus } from '@/lib/types/task.types';
import { useCreateTask } from '@/lib/hooks/useTasks';
import { getApiError } from '@/lib/utils/api-error';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { toast } from '@/lib/stores/toast.store';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Titre requis').max(200),
  description: z.string().optional(),
  priority: z.nativeEnum(Priority),
  deadline: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  storyPoints: z.string().optional(),
  optimisticDays: z.string().optional(),
  probableDays: z.string().optional(),
  pessimisticDays: z.string().optional(),
});

type CreateTaskForm = z.infer<typeof createTaskSchema>;

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  initialStatus: TaskStatus;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  projectId,
  initialStatus,
}: CreateTaskModalProps) {
  const createMutation = useCreateTask();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      priority: Priority.MEDIUM,
    },
  });

  const onSubmit = (data: CreateTaskForm) => {
    console.log(' Creating task:', data.title, 'priority:', data.priority, 'status:', initialStatus);

    createMutation.mutate(
      {
        title: data.title,
        description: data.description,
        priority: data.priority,
        deadline: data.deadline || undefined,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        storyPoints: data.storyPoints ? parseInt(data.storyPoints) : undefined,
        optimisticDays: data.optimisticDays ? parseInt(data.optimisticDays) : undefined,
        probableDays: data.probableDays ? parseInt(data.probableDays) : undefined,
        pessimisticDays: data.pessimisticDays ? parseInt(data.pessimisticDays) : undefined,
        projectId,
      },
      {
        onSuccess: (task) => {
          console.log(' Task created successfully:', task.id);
          reset();
          onClose();
        },
        onError: (error) => {
          console.error(' Task creation failed:', getApiError(error));
          toast.error(getApiError(error), { title: 'Échec' });
        },
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouvelle tâche"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            isLoading={createMutation.isPending}
          >
            Créer
          </Button>
        </div>
      }
    >
      <form className="space-y-4">
        <Input
          label="Titre"
          placeholder="Titre de la tâche"
          error={errors.title?.message}
          {...register('title')}
          autoFocus
        />

        <Textarea
          label="Description (optionnel)"
          placeholder="Description détaillée..."
          error={errors.description?.message}
          {...register('description')}
        />

        <Select
          label="Priorité"
          options={[
            { value: Priority.LOW, label: 'Basse' },
            { value: Priority.MEDIUM, label: 'Moyenne' },
            { value: Priority.HIGH, label: 'Haute' },
            { value: Priority.CRITICAL, label: 'Critique' },
          ]}
          error={errors.priority?.message}
          {...register('priority')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date de début (optionnel)"
            type="date"
            error={errors.startDate?.message}
            {...register('startDate')}
          />
          <Input
            label="Date de fin (optionnel)"
            type="date"
            error={errors.endDate?.message}
            {...register('endDate')}
          />
        </div>

        <Input
          label="Deadline (optionnel)"
          type="date"
          error={errors.deadline?.message}
          {...register('deadline')}
        />

        <Input
          label="Story Points (optionnel)"
          type="number"
          placeholder="5"
          error={errors.storyPoints?.message}
          {...register('storyPoints')}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">PERT (optionnel)</label>
          <div className="grid grid-cols-3 gap-2">
            <Input
              label="Optimiste"
              type="number"
              placeholder="jours"
              error={errors.optimisticDays?.message}
              {...register('optimisticDays')}
            />
            <Input
              label="Probable"
              type="number"
              placeholder="jours"
              error={errors.probableDays?.message}
              {...register('probableDays')}
            />
            <Input
              label="Pessimiste"
              type="number"
              placeholder="jours"
              error={errors.pessimisticDays?.message}
              {...register('pessimisticDays')}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
