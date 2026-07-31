import api from './client';

export type AbsenceType = 'LEAVE' | 'SICK' | 'REMOTE' | 'TRAINING' | 'OTHER';

export type CalendarEventKind = 'TASK' | 'MILESTONE' | 'SPRINT' | 'ABSENCE';

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
}

/** Disponibilité déclarée par l'utilisateur courant, motif compris. */
export interface Absence {
  id: string;
  userId: string;
  type: AbsenceType;
  startDate: string;
  endDate: string;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
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
   * Supprimer une de ses disponibilités.
   * DELETE /calendar/absences/:absenceId (JWT requis)
   */
  deleteAbsence: async (absenceId: string): Promise<void> => {
    await api.delete(`${BASE_URL}/absences/${absenceId}`);
  },
};
