// Types pour le planning (miroir du backend)

export interface GanttAssignee {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
}

/** Dépendance entrante : la tâche bloquante et le décalage imposé. */
export interface GanttDependency {
  taskId: string;
  lagDays: number;
}

export interface GanttTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  startDate: string | null;
  endDate: string | null;
  deadline?: string | null;
  durationDays: number | null;
  /** Dates figées lors de la validation du planning. */
  baselineStart: string | null;
  baselineEnd: string | null;
  /** Écart en jours par rapport à la référence. Positif = en retard. */
  driftDays: number | null;
  dependencies: GanttDependency[];
  assignees: GanttAssignee[];
}

export interface Milestone {
  id: string;
  name: string;
  description?: string | null;
  date: string;
  reached: boolean;
  reachedAt?: string | null;
  /** Date passée sans que le jalon soit atteint. */
  overdue: boolean;
}

/** Phase macro de la feuille de route — conception, recette, déploiement… */
export interface Phase {
  id: string;
  name: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  order: number;
  /** Nombre de tâches rattachées à cette phase. */
  taskCount: number;
  /** Nombre de ces tâches terminées. */
  doneCount: number;
  /** Toujours en nombre de tâches : une phase peut couvrir plusieurs
   * sprints à l'usage des points hétérogène. */
  progressPercent: number;
  /** Échéance dépassée avec du travail restant. Jamais vrai pour une phase
   * sans aucune tâche rattachée. */
  isLate: boolean;
}

export interface GanttData {
  tasks: GanttTask[];
  milestones: Milestone[];
  /** Faux tant qu'aucune référence n'a été figée. */
  hasBaseline: boolean;
}

/** Résultat d'un déplacement de barre : tâches effectivement décalées. */
export interface RescheduleResult {
  updated: { id: string; startDate: string; endDate: string }[];
  /** Tâches repoussées par effet de cascade, hors celle déplacée. */
  cascadedCount: number;
}

export enum SprintStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  projectId: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  taskCount: number;
  doneCount: number;
  totalWork: number;
  completedWork: number;
  usesStoryPoints: boolean;
  progressPercent: number;
}

export interface PertNode {
  id: string;
  title: string;
  status?: string;
  optimisticDays?: number | null;
  probableDays?: number | null;
  pessimisticDays?: number | null;
  expectedDays?: number | null;
  /** Dates au plus tôt / au plus tard, en jours depuis le début. */
  earliestStart: number | null;
  earliestFinish: number | null;
  latestStart: number | null;
  latestFinish: number | null;
  /** Retard absorbable sans décaler la fin du projet. */
  slackDays: number | null;
  /** Marge nulle : tout retard décale le projet. */
  isCritical: boolean;
}

export interface PertEdge {
  from: string;
  to: string;
}

export interface PertData {
  nodes: PertNode[];
  edges: PertEdge[];
  criticalPath: string[];
  milestones: Milestone[];
  projectDurationDays: number;
}

export interface BurndownData {
  startDate: string;
  endDate: string;
  totalWork: number;
  useStoryPoints: boolean;
  ideal: number[];
  actual: number[];
  dates: string[];
  /** Null quand la courbe porte sur le projet entier. */
  sprint: {
    id: string;
    name: string;
    goal: string | null;
    status: SprintStatus;
  } | null;
}

export interface WorkloadEntry {
  userId: string;
  userName: string;
  hours: number;
  date: string;
}

export interface WorkloadData {
  entries: WorkloadEntry[];
  totalHours: number;
}

export interface DashboardStatusDonut {
  TODO: number;
  DOING: number;
  DONE: number;
}

export interface EisenhowerTask {
  id: string;
  title: string;
  urgent: boolean;
  important: boolean;
}

export interface EisenhowerData {
  urgent_important: EisenhowerTask[];
  urgent_not_important: EisenhowerTask[];
  not_urgent_important: EisenhowerTask[];
  not_urgent_not_important: EisenhowerTask[];
}
// --- Modèles de projet ---

export interface ProjectTemplateSummary {
  id: string;
  name: string;
  description: string | null;
  isShared: boolean;
  createdById: string | null;
  createdBy: { firstName: string; lastName: string } | null;
  createdAt: string;
  _count: { tasks: number };
}

export interface ProjectTemplateTask {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  /** Décalage en jours par rapport au démarrage du projet. */
  startOffsetDays: number;
  durationDays: number;
  storyPoints: number | null;
  position: number;
  /** Positions des tâches du modèle qui bloquent celle-ci. */
  blockedByPositions: number[];
  checklist: string[];
}

export interface ProjectTemplateDetail extends ProjectTemplateSummary {
  tasks: ProjectTemplateTask[];
}

// --- Liste de contrôle & récurrence ---

export interface ChecklistItem {
  id: string;
  taskId: string;
  label: string;
  done: boolean;
  position: number;
}

export enum RecurrenceFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export interface TaskRecurrence {
  id: string;
  taskId: string;
  frequency: RecurrenceFrequency;
  /** Toutes les N périodes. */
  interval: number;
  until: string | null;
  lastGeneratedAt: string | null;
  active: boolean;
}

// --- Recherche globale ---

export type SearchResultType = 'project' | 'task' | 'document' | 'user';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string | null;
  url: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
  countsByType?: Record<SearchResultType, number>;
}

// --- Export projet ---

export interface ProjectExportTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  sprint: string | null;
  startDate: string | null;
  endDate: string | null;
  deadline: string | null;
  storyPoints: number | null;
  assignees: string;
  checklistProgress: string | null;
  timeSpentHours: number;
  driftDays: number | null;
}

export interface ProjectExportData {
  project: {
    name: string;
    description: string | null;
    status: string;
    priority: string;
    startDate: string;
    endDate: string | null;
    ownerName: string | null;
  };
  tasks: ProjectExportTask[];
  members: {
    name: string;
    email: string;
    role: string;
    joinedAt: string;
  }[];
  exportedAt: string;
}
