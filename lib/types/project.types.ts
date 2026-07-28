// Types pour les projets (miroir du backend)

import { User } from './user.types';

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Rôle d'un membre DANS un projet, indépendant du rôle global.
 * Hiérarchie : OWNER > ADMIN > MEMBER > VIEWER.
 */
export enum ProjectRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: ProjectRole;
  user: User;
}

/**
 * Projet dans la corbeille : le lot renvoyé par la corbeille, plus l'urgence
 * de restauration avant purge définitive.
 */
export interface TrashedProject {
  id: string;
  name: string;
  status: ProjectStatus;
  deletedAt: string;
  owner: { id: string; firstName: string; lastName: string };
  _count: { tasks: number; members: number; documents: number };
  /** Jours restants avant suppression définitive automatique. */
  daysUntilPurge: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  objectives?: string;
  priority: Priority;
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  projectCode: string;
  inviteToken: string;
  createdBy: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  /** Rôle de l'utilisateur courant sur ce projet, calculé par le backend. */
  myRole?: ProjectRole | null;
  members: ProjectMember[];
  _count?: {
    tasks: number;
    members: number;
  };
  tasksCount?: number;
  completedTasksCount?: number;
  membersCount?: number;
  deletedAt?: string | null;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  objectives?: string;
  priority: Priority;
  status?: ProjectStatus;
  startDate: string;
  endDate?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  objectives?: string;
  priority?: Priority;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
}

export interface JoinProjectByCodeRequest {
  projectCode: string;
}

export interface JoinProjectByTokenRequest {
  inviteToken: string;
}

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REVOKED = 'REVOKED',
}

export interface InviteProjectMemberRequest {
  email: string;
  /** Rôle attribué à l'acceptation. MEMBER par défaut, OWNER refusé. */
  role?: Exclude<ProjectRole, ProjectRole.OWNER>;
}

/** Invitation nominative, telle que listée dans les paramètres du projet. */
export interface ProjectInvitation {
  id: string;
  email: string;
  role: ProjectRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  acceptedAt: string | null;
  invitedBy: { firstName: string; lastName: string } | null;
}

/** Vue publique d'une invitation, avant même d'avoir un compte. */
export interface InvitationPreview {
  projectName: string;
  email: string;
  status: InvitationStatus;
  expiresAt: string;
  isExpired: boolean;
}

export interface AddProjectMemberRequest {
  userId: string;
  /** MEMBER par défaut côté serveur. OWNER est refusé (voir transfert de propriété). */
  role?: Exclude<ProjectRole, ProjectRole.OWNER>;
}

export interface UpdateMemberRoleRequest {
  userId: string;
  role: Exclude<ProjectRole, ProjectRole.OWNER>;
}

export interface TransferOwnershipRequest {
  newOwnerId: string;
}

export interface RegenerateTokenResponse {
  project: Project;
}