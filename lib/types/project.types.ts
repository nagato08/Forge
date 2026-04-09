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
  CANCELLED = 'CANCELLED',
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  user: User;
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
  createdAt: string;
  updatedAt: string;
  owner?: User;
  members: ProjectMember[];
  _count?: {
    tasks: number;
    members: number;
  };
  tasksCount?: number;
  completedTasksCount?: number;
  membersCount?: number;
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

export interface AddProjectMemberRequest {
  userId: string;
}

export interface RegenerateTokenResponse {
  project: Project;
}