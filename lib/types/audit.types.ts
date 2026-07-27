// Types du journal d'audit (miroir du backend)

export interface AuditLogUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AuditLog {
  id: string;
  /** Null si le compte auteur a été supprimé depuis. */
  userId: string | null;
  /** Dénormalisé : reste lisible même après suppression du compte. */
  userEmail: string | null;
  user: AuditLogUser | null;
  /** Verbe métier, ex. `project.delete`. */
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  /** Corrélation avec les logs applicatifs de la même requête. */
  requestId: string | null;
  createdAt: string;
}

export type AuditSeverity = 'critical' | 'warning' | 'info';

export type AuditPeriod = '7d' | '30d' | '90d';

/** Descripteur d'action, fourni par le serveur (source de vérité unique). */
export interface AuditActionDescriptor {
  action: string;
  label: string;
  description: string;
  severity: AuditSeverity;
  category: string;
}

export interface AuditLogFilters {
  /** Actions sélectionnées (multi-sélection). */
  actions?: string[];
  /** Catégories métier : Projet, Membres, Tâches, Documents, Comptes. */
  categories?: string[];
  /** Niveaux de gravité. */
  severities?: AuditSeverity[];
  /** Auteurs sélectionnés (multi-sélection). */
  userIds?: string[];
  /** Types d'objet visés (multi-sélection). */
  targetTypes?: string[];
  targetId?: string;
  ip?: string;
  requestId?: string;
  /** Raccourci de période ; ignoré si une date explicite est saisie. */
  period?: AuditPeriod;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sort?: 'asc' | 'desc';
}

export interface AuditLogListParams extends AuditLogFilters {
  skip?: number;
  take?: number;
}

export interface AuditLogListResponse {
  items: AuditLog[];
  total: number;
  skip: number;
  take: number;
}

export interface AuditLogExportResponse {
  items: AuditLog[];
  total: number;
  /** Vrai si le jeu dépasse le plafond serveur : l'export est incomplet. */
  truncated: boolean;
  limit: number;
}

export interface AuditLogActor {
  id: string;
  email: string | null;
  name: string;
}

export interface AuditLogFilterOptions {
  /** Catalogue complet des actions connues du serveur. */
  catalog: AuditActionDescriptor[];
  categories: string[];
  severities: AuditSeverity[];
  /** Actions réellement présentes en base. */
  actions: string[];
  targetTypes: string[];
  actors: AuditLogActor[];
  ips: string[];
}

export interface AuditLogStats {
  /** Entrées correspondant aux filtres courants. */
  total: number;
  /** Volume total du journal, tous filtres confondus. */
  overall: number;
  today: number;
  lastSevenDays: number;
  distinctActors: number;
  byAction: { action: string; count: number }[];
}
