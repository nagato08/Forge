'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/lib/types/task.types';
import { getPriorityBadge } from '@/components/ui/Badge';
import Card from '@/components/ui/Card';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = () => {
    console.log('🎯 TaskCard clicked:', task.id, task.title);
    onClick();
  };

  // Format deadline
  const isOverdue = task.deadline && new Date(task.deadline) < new Date();

  // Get first 3 assignees
  const displayedAssignees = task.assignedUsers.slice(0, 3);
  const moreCount = task.assignedUsers.length - 3;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className="cursor-grab active:cursor-grabbing text-sm hover:shadow-md transition-all"
        clickable
        onClick={handleClick}
      >
        <div className="space-y-2">
          {/* Title */}
          <p className="font-medium text-[var(--text-primary)] line-clamp-2">
            {task.title}
          </p>

          {/* Priority Badge */}
          <div className="flex items-center gap-2">
            {getPriorityBadge(task.priority)}
          </div>

          {/* Deadline + Assignees */}
          {(task.deadline || task.assignedUsers.length > 0) && (
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
              {/* Deadline */}
              {task.deadline && (
                <div
                  className={`text-xs flex items-center gap-1 ${
                    isOverdue
                      ? 'text-[var(--critical)]'
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  ⏰{' '}
                  {new Date(task.deadline).toLocaleDateString('fr-FR', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              )}

              {/* Assignees avatars */}
              {task.assignedUsers.length > 0 && (
                <div className="flex items-center">
                  <div className="flex -space-x-2">
                    {displayedAssignees.map((user) => (
                      <div
                        key={user.id}
                        className="w-6 h-6 rounded-full bg-[var(--primary)] text-white text-xs flex items-center justify-center border border-[var(--bg-surface)]"
                        title={`${user.firstName} ${user.lastName}`}
                      >
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </div>
                    ))}
                    {moreCount > 0 && (
                      <div className="w-6 h-6 rounded-full bg-[var(--text-secondary)]/50 text-white text-xs flex items-center justify-center border border-[var(--bg-surface)]">
                        +{moreCount}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
