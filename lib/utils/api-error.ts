import { AxiosError } from 'axios';

export function getApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    // Erreur avec réponse du serveur
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    // Erreur réseau ou autre
    if (error.message) {
      return error.message;
    }
  }

  // Erreur inconnue
  if (error instanceof Error) {
    return error.message;
  }

  return 'Une erreur inconnue est survenue';
}