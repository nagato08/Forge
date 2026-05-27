'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  DndContext,
  DragStartEvent,
  DragEndEvent,
  DragCancelEvent,
  closestCorners,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { DragOverlay } from '@dnd-kit/core';
import { useParams } from 'next/navigation';
import { TaskStatus } from '@/lib/types/task.types';
import { useTasks, useUpdateTaskStatus } from '@/lib/hooks/useTasks';
import { toast } from '@/lib/stores/toast.store';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import KanbanColumn from '@/components/tasks/KanbanColumn';
import TaskCard from '@/components/tasks/TaskCard';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';
import { ListTodo, Play, CheckCircle2 } from 'lucide-react';

export default function KanbanPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const { data: tasks, isLoading, error } = useTasks(projectId);
  const updateStatus = useUpdateTaskStatus();

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [createModalStatus, setCreateModalStatus] = useState<TaskStatus | null>(
    null
  );

  // Auto-open create modal if createTask param is present
  useEffect(() => {
    if (searchParams.get('createTask') === 'true') {
      setCreateModalStatus(TaskStatus.TODO);
    }
  }, [searchParams]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  if (isLoading) {
    return (
      <Spinner centered size="lg" label="Chargement du tableau Kanban..." />
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        title="Erreur"
        message="Impossible de charger les tâches"
      />
    );
  }

  console.log(
    ' Kanban loaded:',
    tasks?.length || 0,
    'tasks for project:',
    projectId
  );

  const todoTasks = tasks?.filter((t) => t.status === TaskStatus.TODO) || [];
  const doingTasks = tasks?.filter((t) => t.status === TaskStatus.DOING) || [];
  const doneTasks = tasks?.filter((t) => t.status === TaskStatus.DONE) || [];

  const activeTask =
    activeTaskId && tasks ? tasks.find((t) => t.id === activeTaskId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    console.log('🔄 Drag started:', event.active.id);
    setActiveTaskId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTaskId(null);

    if (!over || active.id === over.id) {
      console.log('🔄 Drag cancelled (same position)');
      return;
    }

    const newStatus = over.id as TaskStatus;
    const taskId = active.id as string;
    const task = tasks?.find((t) => t.id === taskId);

    if (!task) return;

    if (task.status === newStatus) {
      return;
    }

    // Empêcher de modifier une tâche terminée
    if (task.status === TaskStatus.DONE) {
      toast.error('Impossible de modifier une tâche terminée', {
        title: 'Tâche terminée',
      });
      return;
    }

    // Empêcher de déplacer une tâche non assignée
    if (!task.assignedUsers || task.assignedUsers.length === 0) {
      toast.error('Impossible de déplacer une tâche non assignée', {
        title: 'Tâche non assignée',
      });
      return;
    }

    // Verifier les dependances avant de passer en DOING ou DONE
    if (newStatus !== TaskStatus.TODO && task.blockedBy && task.blockedBy.length > 0) {
      const unblockedTasks = task.blockedBy
        .map((dep) => tasks?.find((t) => t.id === dep.taskId))
        .filter((t) => t && t.status !== TaskStatus.DONE);

      if (unblockedTasks.length > 0) {
        const names = unblockedTasks.map((t) => t!.title).join(', ');
        toast.error(`Cette tâche est bloquée par "${names}" qui n'est pas encore terminée`, {
          title: 'Tâche bloquée',
        });
        return;
      }
    }

    console.log('Drag ended:', taskId, task.status, '->', newStatus);
    updateStatus.mutate({ taskId, status: { status: newStatus } });
  };

  const handleDragCancel = () => {
    console.log('🔄 Drag cancelled');
    setActiveTaskId(null);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KanbanColumn
            status={TaskStatus.TODO}
            tasks={todoTasks}
            title="À faire"
            icon={ListTodo}
            onAddTask={() => setCreateModalStatus(TaskStatus.TODO)}
          />
          <KanbanColumn
            status={TaskStatus.DOING}
            tasks={doingTasks}
            title="En cours"
            icon={Play}
            onAddTask={() => {}}
          />
          <KanbanColumn
            status={TaskStatus.DONE}
            tasks={doneTasks}
            title="Fait"
            icon={CheckCircle2}
            onAddTask={() => {}}
          />
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} onClick={() => {}} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <CreateTaskModal
        isOpen={createModalStatus !== null}
        onClose={() => setCreateModalStatus(null)}
        projectId={projectId}
        initialStatus={createModalStatus || TaskStatus.TODO}
      />
    </>
  );
}
