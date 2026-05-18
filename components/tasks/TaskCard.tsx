'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRouter } from 'next/navigation';
import { Task } from '@/lib/types/task.types';
import { getPriorityBadge } from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { AlertCircle, Calendar, Zap, MessageSquare, CheckSquare } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const router = useRouter();
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

  // Check if overdue
  const isOverdue = task.deadline && new Date(task.deadline) < new Date();

  // Assignees
  const assignees = task.assignedUsers || [];
  const displayedAssignees = assignees.slice(0, 3);
  const moreCount = assignees.length - 3;

  // Counts
  const commentCount = task._count?.comments || 0;
  const timeEntriesCount = task._count?.timeEntries || 0;
  const subTaskCount = task.subTasks?.length || 0;

  const handleCardClick = (e: React.MouseEvent) => {
    // Empêcher le drag si on clique normalement
    if (!isDragging) {
      console.log('TaskCard clicked, navigating to detail');
      router.push(`/projects/${task.projectId}/tasks/${task.id}`);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className="cursor-grab active:cursor-grabbing"
    >
      <Card className="text-sm hover:shadow-md transition-all h-full"
      >
        <div className="space-y-2">
          {/* Title */}
          <p className="font-medium text-text-primary line-clamp-2">
            {task.title}
          </p>

          {/* Priority Badge */}
          <div className="flex items-center gap-2">
            {getPriorityBadge(task.priority)}
            {task.storyPoints && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-info/10 text-info font-medium flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {task.storyPoints}
              </span>
            )}
          </div>

          {/* Meta info: Deadline + Dates */}
          <div className="space-y-1">
            {task.deadline && (
              <div
                className={`text-xs flex items-center gap-1.5 ${
                  isOverdue
                    ? 'text-critical font-medium'
                    : 'text-text-secondary'
                }`}
              >
                <AlertCircle className="w-3 h-3" />
                {new Date(task.deadline).toLocaleDateString('fr-FR', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            )}
            {task.startDate && task.endDate && (
              <div className="text-xs text-text-weak flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {new Date(task.startDate).toLocaleDateString('fr-FR', {
                  month: 'short',
                  day: 'numeric',
                })}
                {' → '}
                {new Date(task.endDate).toLocaleDateString('fr-FR', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            )}
          </div>

          {/* Footer: Metadata + Assignees */}
          {(commentCount > 0 || subTaskCount > 0 || timeEntriesCount > 0 || assignees.length > 0) && (
            <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
              {/* Left: Comments + SubTasks */}
              <div className="flex items-center gap-1.5">
                {commentCount > 0 && (
                  <div className="text-xs text-text-secondary flex items-center gap-0.5">
                    <MessageSquare className="w-3 h-3" />
                    {commentCount}
                  </div>
                )}
                {subTaskCount > 0 && (
                  <div className="text-xs text-text-secondary flex items-center gap-0.5">
                    <CheckSquare className="w-3 h-3" />
                    {subTaskCount}
                  </div>
                )}
              </div>

              {/* Right: Assignees avatars */}
              {assignees.length > 0 && (
                <div className="flex items-center">
                  <div className="flex -space-x-1.5">
                    {displayedAssignees.map((user) => (
                      <div
                        key={user.id}
                        className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center border border-bg-surface font-bold"
                        title={`${user.firstName} ${user.lastName}`}
                      >
                        {user.firstName[0]}
                      </div>
                    ))}
                    {moreCount > 0 && (
                      <div className="w-5 h-5 rounded-full bg-text-secondary/50 text-white text-[10px] flex items-center justify-center border border-bg-surface font-bold">
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
