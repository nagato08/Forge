import { ProjectRole } from '@/lib/types/project.types';
import { PROJECT_ROLE_LABELS } from '@/lib/utils/project-permissions';

const ROLE_STYLES: Record<ProjectRole, string> = {
  [ProjectRole.OWNER]: 'bg-primary/10 text-primary',
  [ProjectRole.ADMIN]: 'bg-warning/10 text-warning',
  [ProjectRole.MEMBER]: 'bg-success/10 text-success',
  [ProjectRole.VIEWER]: 'bg-text-secondary/10 text-text-secondary',
};

interface ProjectRoleBadgeProps {
  role: ProjectRole;
  className?: string;
}

/** Pastille de rôle projet, couleur dérivée du niveau de permission. */
export default function ProjectRoleBadge({
  role,
  className = '',
}: ProjectRoleBadgeProps) {
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${ROLE_STYLES[role]} ${className}`}
    >
      {PROJECT_ROLE_LABELS[role]}
    </span>
  );
}
