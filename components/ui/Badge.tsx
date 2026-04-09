import { forwardRef } from 'react';
import { Priority } from '@/lib/types/task.types';
import { TaskStatus } from '@/lib/types/task.types';
import { Role } from '@/lib/types/user.types';

export type BadgeVariant =
  | 'priority-low'
  | 'priority-medium'
  | 'priority-high'
  | 'priority-critical'
  | 'status-todo'
  | 'status-doing'
  | 'status-done'
  | 'role-admin'
  | 'role-pm'
  | 'role-employee'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant;
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

const variantClasses: Record<BadgeVariant, string> = {
  // Priority badges
  'priority-low': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'priority-medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'priority-high': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'priority-critical': 'bg-[var(--critical)]/20 text-[var(--critical)]',

  // Task status badges
  'status-todo': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  'status-doing': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'status-done': 'bg-[var(--success)]/20 text-[var(--success)]',

  // Role badges
  'role-admin': 'bg-[var(--critical)]/20 text-[var(--critical)]',
  'role-pm': 'bg-[var(--info)]/20 text-[var(--info)]',
  'role-employee': 'bg-[var(--success)]/20 text-[var(--success)]',

  // General badges
  info: 'bg-[var(--info)]/20 text-[var(--info)]',
  success: 'bg-[var(--success)]/20 text-[var(--success)]',
  warning: 'bg-[var(--warning)]/20 text-[var(--warning)]',
  danger: 'bg-[var(--critical)]/20 text-[var(--critical)]',
};

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { variant, children, size = 'md', className = '', ...props },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center gap-1
          font-medium rounded-full
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Helper functions
export function getPriorityBadge(priority: Priority) {
  const variantMap: Record<Priority, BadgeVariant> = {
    [Priority.LOW]: 'priority-low',
    [Priority.MEDIUM]: 'priority-medium',
    [Priority.HIGH]: 'priority-high',
    [Priority.CRITICAL]: 'priority-critical',
  };

  const labelMap: Record<Priority, string> = {
    [Priority.LOW]: 'Basse',
    [Priority.MEDIUM]: 'Moyenne',
    [Priority.HIGH]: 'Haute',
    [Priority.CRITICAL]: 'Critique',
  };

  return (
    <Badge variant={variantMap[priority]}>
      {labelMap[priority]}
    </Badge>
  );
}

export function getStatusBadge(status: TaskStatus) {
  const variantMap: Record<TaskStatus, BadgeVariant> = {
    [TaskStatus.TODO]: 'status-todo',
    [TaskStatus.DOING]: 'status-doing',
    [TaskStatus.DONE]: 'status-done',
  };

  const labelMap: Record<TaskStatus, string> = {
    [TaskStatus.TODO]: 'À faire',
    [TaskStatus.DOING]: 'En cours',
    [TaskStatus.DONE]: 'Fait',
  };

  return (
    <Badge variant={variantMap[status]}>
      {labelMap[status]}
    </Badge>
  );
}

export function getRoleBadge(role: Role) {
  const variantMap: Record<Role, BadgeVariant> = {
    [Role.ADMIN]: 'role-admin',
    [Role.PROJECT_MANAGER]: 'role-pm',
    [Role.EMPLOYEE]: 'role-employee',
  };

  const labelMap: Record<Role, string> = {
    [Role.ADMIN]: 'Admin',
    [Role.PROJECT_MANAGER]: 'Chef Projet',
    [Role.EMPLOYEE]: 'Employé',
  };

  return (
    <Badge variant={variantMap[role]}>
      {labelMap[role]}
    </Badge>
  );
}

export default Badge;
