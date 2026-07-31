'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  calendarApi,
  CalendarRange,
  CreateAbsenceRequest,
  DecideAbsenceRequest,
  UpdateAbsenceRequest,
} from '@/lib/api/calendar.api';

const CACHE_KEYS = {
  personal: (range: CalendarRange) => ['calendar', 'personal', range.start, range.end],
  organisation: (range: CalendarRange) => [
    'calendar',
    'organisation',
    range.start,
    range.end,
  ],
  absences: (range: CalendarRange) => ['calendar', 'absences', range.start, range.end],
};

/**
 * Une absence déclarée apparaît à la fois sur l'agenda personnel et sur celui
 * de l'organisation : on invalide toute la branche plutôt que la seule vue
 * courante, sinon l'autre onglet reste sur des données périmées.
 */
function invalidateCalendar(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['calendar'] });
}

export function usePersonalCalendar(range: CalendarRange) {
  return useQuery({
    queryKey: CACHE_KEYS.personal(range),
    queryFn: () => calendarApi.getPersonal(range),
  });
}

export function useOrganisationCalendar(range: CalendarRange, enabled = true) {
  return useQuery({
    queryKey: CACHE_KEYS.organisation(range),
    queryFn: () => calendarApi.getOrganisation(range),
    enabled,
  });
}

export function useMyAbsences(range: CalendarRange) {
  return useQuery({
    queryKey: CACHE_KEYS.absences(range),
    queryFn: () => calendarApi.listAbsences(range),
  });
}

export function useCreateAbsence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAbsenceRequest) => calendarApi.createAbsence(data),
    onSuccess: () => invalidateCalendar(queryClient),
  });
}

export function useUpdateAbsence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      absenceId,
      ...data
    }: UpdateAbsenceRequest & { absenceId: string }) =>
      calendarApi.updateAbsence(absenceId, data),
    onSuccess: () => invalidateCalendar(queryClient),
  });
}

/** Réservé aux chefs de projet et administrateurs : inutile de l'appeler ailleurs. */
export function usePendingAbsences(enabled: boolean) {
  return useQuery({
    queryKey: ['calendar', 'absences', 'pending'],
    queryFn: () => calendarApi.listPendingAbsences(),
    enabled,
  });
}

export function useDecideAbsence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      absenceId,
      ...data
    }: DecideAbsenceRequest & { absenceId: string }) =>
      calendarApi.decideAbsence(absenceId, data),
    onSuccess: () => invalidateCalendar(queryClient),
  });
}

export function useDeleteAbsence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (absenceId: string) => calendarApi.deleteAbsence(absenceId),
    onSuccess: () => invalidateCalendar(queryClient),
  });
}
