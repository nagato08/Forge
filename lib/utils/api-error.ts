import { AxiosError } from 'axios';
import { ApiError } from '@/lib/api/client';

export function getApiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.details && error.details.length > 1) {
      return error.details.join(' · ');
    }
    return error.message;
  }

  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined;
    if (data?.message) {
      return Array.isArray(data.message)
        ? data.message.join(' · ')
        : data.message;
    }
    if (error.message) return error.message;
  }

  if (error instanceof Error) return error.message;

  return 'Une erreur inconnue est survenue';
}