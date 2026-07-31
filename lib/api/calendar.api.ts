import api from './client';

export type AbsenceType = 'LEAVE' | 'SICK' | 'REMOTE' | 'TRAINING' | 'OTHER';

export type CalendarEventKind = 'TASK' | 'MILESTONE' | 'SPRINT' | 'ABSENCE';

export type AbsenceStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * Événement d'agenda, toutes origines confondues. La grille se contente de
 * poser des pastilles sur des jours : elle n'a pas à distinguer une échéance
 * de tâche d'un congé, seul `kind` change la couleur et le libellé.
 */
export interface CalendarEvent {
  id: string;
  kind: CalendarEventKind;
  title: string;
  /** Bornes incluses, au format `YYYY-MM-DD`. */
  startDate: string;
  endDate: string;
  projectId: string | null;
  projectName: string | null;
  status: 'TODO' | 'DOING' | 'DONE' | null;
  userName: string | null;
  absenceType: AbsenceType | null;
  /** Une demande en attente ne vaut pas une absence acquise. */
  absenceStatus: AbsenceStatus | null;
}

/** Disponibilité déclarée par l'utilisateur courant, motif compris. */
export interface Absence {
  id: string;
  userId: string;
  type: AbsenceType;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: AbsenceStatus;
  approverId: string | null;
  decidedAt: string | null;
  /** Motif du refus, ou remarque accompagnant l'accord. */
  decisionNote: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Demande en attente, telle que la voit celui qui doit trancher. */
export interface PendingAbsence {
  id: string;
  userId: string;
  type: AbsenceType;
  status: AbsenceStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

export interface DecideAbsenceRequest {
  status: Extract<AbsenceStatus, 'APPROVED' | 'REJECTED'>;
  decisionNote?: string;
}

export interface CreateAbsenceRequest {
  type?: AbsenceType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export type UpdateAbsenceRequest = Partial<CreateAbsenceRequest>;

export interface CalendarRange {
  start: string;
  end: string;
}

const BASE_URL = '/calendar';

export const calendarApi = {
  /**
   * Agenda personnel : mes échéances de tâches et mes disponibilités.
   * GET /calendar/personal (JWT requis)
   */
  getPersonal: async (range: CalendarRange): Promise<CalendarEvent[]> => {
    const response = await api.get<CalendarEvent[]>(`${BASE_URL}/personal`, {
      params: range,
    });
    return response.data;
  },

  /**
   * Agenda d'organisation : activité de l'équipe sur les projets communs.
   * GET /calendar/organisation (JWT requis)
   */
  getOrganisation: async (range: CalendarRange): Promise<CalendarEvent[]> => {
    const response = await api.get<CalendarEvent[]>(
      `${BASE_URL}/organisation`,
      { params: range }
    );
    return response.data;
  },

  /**
   * Mes disponibilités déclarées sur la période.
   * GET /calendar/absences (JWT requis)
   */
  listAbsences: async (range: CalendarRange): Promise<Absence[]> => {
    const response = await api.get<Absence[]>(`${BASE_URL}/absences`, {
      params: range,
    });
    return response.data;
  },

  /**
   * Déclarer une indisponibilité (toujours pour soi-même).
   * POST /calendar/absences (JWT requis)
   */
  createAbsence: async (data: CreateAbsenceRequest): Promise<Absence> => {
    const response = await api.post<Absence>(`${BASE_URL}/absences`, data);
    return response.data;
  },

  /**
   * Modifier une de ses disponibilités.
   * PATCH /calendar/absences/:absenceId (JWT requis)
   */
  updateAbsence: async (
    absenceId: string,
    data: UpdateAbsenceRequest
  ): Promise<Absence> => {
    const response = await api.patch<Absence>(
      `${BASE_URL}/absences/${absenceId}`,
      data
    );
    return response.data;
  },

  /**
   * Demandes en attente de décision (chefs de projet et administrateurs).
   * GET /calendar/absences/pending (JWT requis)
   */
  listPendingAbsences: async (): Promise<PendingAbsence[]> => {
    const response = await api.get<PendingAbsence[]>(
      `${BASE_URL}/absences/pending`
    );
    return response.data;
  },

  /**
   * Approuver ou refuser une demande — jamais la sienne.
   * PATCH /calendar/absences/:absenceId/decision (JWT requis)
   */
  decideAbsence: async (
    absenceId: string,
    data: DecideAbsenceRequest
  ): Promise<Absence> => {
    const response = await api.patch<Absence>(
      `${BASE_URL}/absences/${absenceId}/decision`,
      data
    );
    return response.data;
  },

  /**
   * Supprimer une de ses disponibilités.
   * DELETE /calendar/absences/:absenceId (JWT requis)
   */
  deleteAbsence: async (absenceId: string): Promise<void> => {
    await api.delete(`${BASE_URL}/absences/${absenceId}`);
  },
};
