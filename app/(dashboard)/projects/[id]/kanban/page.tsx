'use client';

import { useState } from 'react';
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
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import KanbanColumn from '@/components/tasks/KanbanColumn';
import TaskCard from '@/components/tasks/TaskCard';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';

export default function KanbanPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { data: tasks, isLoading, error } = useTasks(projectId);
  const updateStatus = useUpdateTaskStatus();

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [createModalStatus, setCreateModalStatus] = useState<TaskStatus | null>(
    null
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
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
    '📊 Kanban loaded:',
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
      console.log('🔄 Drag cancelled (same status)');
      return;
    }

    console.log(
      '🔄 Drag ended:',
      taskId,
      task.status,
      '→',
      newStatus
    );
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
            icon="📋"
            onAddTask={() => setCreateModalStatus(TaskStatus.TODO)}
            onTaskClick={(task) => setSelectedTaskId(task.id)}
          />
          <KanbanColumn
            status={TaskStatus.DOING}
            tasks={doingTasks}
            title="En cours"
            icon="▶️"
            onAddTask={() => setCreateModalStatus(TaskStatus.DOING)}
            onTaskClick={(task) => setSelectedTaskId(task.id)}
          />
          <KanbanColumn
            status={TaskStatus.DONE}
            tasks={doneTasks}
            title="Fait"
            icon="✓"
            onAddTask={() => setCreateModalStatus(TaskStatus.DONE)}
            onTaskClick={(task) => setSelectedTaskId(task.id)}
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

      <TaskDetailModal
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </>
  );
}
