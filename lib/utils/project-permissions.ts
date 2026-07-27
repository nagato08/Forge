import { Project, ProjectRole } from '@/lib/types/project.types';

/**
 * Rang de chaque rôle projet. Miroir exact du backend
 * (`src/common/access/project-access.service.ts`).
 */
const PROJECT_ROLE_RANK: Record<ProjectRole, number> = {
  [ProjectRole.OWNER]: 4,
  [ProjectRole.ADMIN]: 3,
  [ProjectRole.MEMBER]: 2,
  [ProjectRole.VIEWER]: 1,
};

/** Libellés affichables, dans l'ordre hiérarchique. */
export const PROJECT_ROLE_LABELS: Record<ProjectRole, string> = {
  [ProjectRole.OWNER]: 'Propriétaire',
  [ProjectRole.ADMIN]: 'Administrateur',
  [ProjectRole.MEMBER]: 'Contributeur',
  [ProjectRole.VIEWER]: 'Lecteur',
};

/** Description courte, pour les menus de sélection de rôle. */
export const PROJECT_ROLE_DESCRIPTIONS: Record<ProjectRole, string> = {
  [ProjectRole.OWNER]: 'Tous les droits, dont la suppression du projet',
  [ProjectRole.ADMIN]: 'Gère les membres, les paramètres et les tâches',
  [ProjectRole.MEMBER]: 'Contribue aux tâches, documents et discussions',
  [ProjectRole.VIEWER]: 'Consultation uniquement',
};

/** Rôle attribuable directement : tout sauf OWNER, qui passe par le transfert. */
export type AssignableProjectRole = Exclude<ProjectRole, ProjectRole.OWNER>;

/** Rôles attribuables via l'interface (OWNER passe par le transfert). */
export const ASSIGNABLE_PROJECT_ROLES: readonly AssignableProjectRole[] = [
  ProjectRole.ADMIN,
  ProjectRole.MEMBER,
  ProjectRole.VIEWER,
];

/**
 * Rôle effectif de l'utilisateur sur un projet.
 *
 * Le backend renvoie `myRole` depuis la mise en place du RBAC par projet. Tant
 * qu'une API antérieure est déployée, le champ est absent (`undefined`) : on
 * retombe alors sur l'ancienne règle propriétaire/membre, pour que le front
 * reste utilisable quel que soit l'ordre de déploiement des deux services.
 *
 * À supprimer une fois le backend RBAC déployé partout.
 */
export function resolveMyRole(
  project: Pick<Project, 'myRole' | 'ownerId' | 'createdBy' | 'members'>,
  currentUserId: string | undefined
): ProjectRole | null {
  if (project.myRole !== undefined) return project.myRole;

  if (!currentUserId) return null;
  if (
    project.ownerId === currentUserId ||
    project.createdBy === currentUserId
  ) {
    return ProjectRole.OWNER;
  }
  const isMember = project.members?.some((m) => m.userId === currentUserId);
  return isMember ? ProjectRole.MEMBER : null;
}

/** `role` atteint-il au moins `minimum` ? */
export function hasProjectRole(
  role: ProjectRole | null | undefined,
  minimum: ProjectRole
): boolean {
  if (!role) return false;
  return PROJECT_ROLE_RANK[role] >= PROJECT_ROLE_RANK[minimum];
}

/** Peut consulter le projet. */
export const canView = (role: ProjectRole | null | undefined) =>
  hasProjectRole(role, ProjectRole.VIEWER);

/** Peut écrire du contenu : tâches, documents, commentaires, chat, temps. */
export const canContribute = (role: ProjectRole | null | undefined) =>
  hasProjectRole(role, ProjectRole.MEMBER);

/** Peut gérer le projet : membres, rôles, paramètres, création de tâches. */
export const canManage = (role: ProjectRole | null | undefined) =>
  hasProjectRole(role, ProjectRole.ADMIN);

/** Peut supprimer le projet ou transférer la propriété. */
export const isOwner = (role: ProjectRole | null | undefined) =>
  hasProjectRole(role, ProjectRole.OWNER);

/**
 * Reproduit les garde-fous anti-escalade du serveur : on n'agit que sur un
 * membre strictement en dessous de soi. Évite d'afficher une action qui
 * renverrait un 403.
 */
export function canActOnMember(
  myRole: ProjectRole | null | undefined,
  targetRole: ProjectRole
): boolean {
  if (!myRole) return false;
  if (targetRole === ProjectRole.OWNER) return false;
  return PROJECT_ROLE_RANK[myRole] > PROJECT_ROLE_RANK[targetRole];
}

/**
 * Rôles que l'utilisateur courant peut attribuer : strictement inférieurs au sien.
 */
export function assignableRolesFor(
  myRole: ProjectRole | null | undefined
): AssignableProjectRole[] {
  if (!myRole) return [];
  return ASSIGNABLE_PROJECT_ROLES.filter(
    (role) => PROJECT_ROLE_RANK[role] < PROJECT_ROLE_RANK[myRole]
  );
}
