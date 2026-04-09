// Types pour le planning (miroir du backend)

export interface GanttTask {
  id: string;
  title: string;
  startDate?: string;
  endDate?: string;
  progress?: number;
  dependencies?: string[];
}

export interface GanttData {
  tasks: GanttTask[];
}

export interface PertNode {
  id: string;
  title: string;
  optimisticDays?: number;
  probableDays?: number;
  pessimisticDays?: number;
  expectedTime?: number;
  variance?: number;
}

export interface PertEdge {
  from: string;
  to: string;
}

export interface PertData {
  nodes: PertNode[];
  edges: PertEdge[];
  criticalPath: string[];
}

export interface BurndownData {
  ideal: number[];
  actual: number[];
  dates: string[];
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