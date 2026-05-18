'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TaskStatus, Task } from '@/lib/types/task.types';
import Button from '@/components/ui/Button';
import TaskCard from './TaskCard';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  onAddTask: () => void;
  onTaskClick?: (task: Task) => void;
}

export default function KanbanColumn({
  status,
  tasks,
  title,
  icon: IconComponent,
  onAddTask,
  onTaskClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  console.log('Column rendered:', status, tasks.length, 'tasks');

  return (
    <div
      ref={setNodeRef}
      className={`space-y-3 p-4 rounded-lg min-h-[400px] transition-colors ${
        isOver
          ? 'bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]'
          : 'bg-[var(--bg-surface-hover)]/50'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconComponent className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-[var(--text-primary)]">{title}</h2>
          <span className="text-xs bg-[var(--primary)]/20 text-[var(--primary)] px-2 py-1 rounded">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddTask}
          className="text-lg"
        >
          +
        </Button>
      </div>

      {/* Tasks */}
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <p className="text-sm text-[var(--text-weak)] text-center py-8">
              Aucune tâche
            </p>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick?.(task)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
