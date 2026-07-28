// Types pour les tâches (miroir du backend)

import { User } from './user.types';
import { ChecklistItem, TaskRecurrence } from './planning.types';

export enum TaskStatus {
  TODO = 'TODO',
  DOING = 'DOING',
  DONE = 'DONE',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  userId: string;
  user: User;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  deadline?: string;
  projectId: string;
  startDate?: string;
  endDate?: string;
  // PERT
  optimisticDays?: number;
  probableDays?: number;
  pessimisticDays?: number;
  // Burndown
  storyPoints?: number;
  // Sprint de rattachement. Absent = tâche au backlog.
  sprintId?: string | null;
  // Baseline : dates de référence figées à la validation du planning.
  baselineStart?: string | null;
  baselineEnd?: string | null;
  // Récurrence : présente si la tâche se régénère à son achèvement.
  recurrence?: TaskRecurrence | null;
  /** Tâche modèle dont celle-ci est une occurrence générée. */
  recurrenceOfId?: string | null;
  checklist?: ChecklistItem[];
  // Relations
  parentId?: string;
  assignedUsers?: User[];
  assignments?: TaskAssignment[];
  dependencies?: TaskDependency[];
  subTasks?: Task[];
  blockedBy?: TaskDependency[];
  comments?: TaskComment[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    comments?: number;
    timeEntries?: number;
  };
}

export interface TaskDependency {
  id: string;
  taskId?: string;           // Ancien format (compatibility)
  blockingTaskId?: string;   // ID de la tâche qui bloque
  blockedTaskId: string;
  blockingTask?: {           // Tâche qui bloque (quand incluse par le backend)
    id: string;
    title: string;
    status: TaskStatus;
    priority: Priority;
  };
  blockedTask?: Task;        // Tâche bloquée (quand incluse par le backend)
  createdAt?: string;
}

export interface TaskComment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  user: User;
  mentions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: Priority;
  deadline?: string;
  projectId: string;
  startDate?: string;
  endDate?: string;
  optimisticDays?: number;
  probableDays?: number;
  pessimisticDays?: number;
  storyPoints?: number;
  parentId?: string;
  assignedUserIds?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: Priority;
  deadline?: string;
  startDate?: string;
  endDate?: string;
  optimisticDays?: number;
  probableDays?: number;
  pessimisticDays?: number;
  storyPoints?: number;
  parentId?: string;
  assignedUserIds?: string[];
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
}

export interface AssignTaskRequest {
  userIds: string[];
}

export interface AddTaskDependencyRequest {
  blockedTaskId: string;
}

export interface AddTaskCommentRequest {
  content: string;
  mentions?: string[];
}