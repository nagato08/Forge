import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { useAuthStore } from '@/lib/stores/auth.store';

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

type ApiErrorPayload = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
};

export class ApiError extends Error {
  status: number;
  details?: string[];
  raw?: ApiErrorPayload;

  constructor(
    message: string,
    status: number,
    details?: string[],
    raw?: ApiErrorPayload
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.raw = raw;
  }
}

const STATUS_FALLBACK: Record<number, string> = {
  400: 'Données invalides. Vérifiez le formulaire.',
  401: 'Session expirée. Veuillez vous reconnecter.',
  403: "Vous n'avez pas les droits pour cette action.",
  404: 'Ressource introuvable.',
  409: 'Conflit : cette ressource existe déjà.',
  413: 'Fichier trop volumineux.',
  422: 'Données invalides.',
  429: 'Trop de requêtes. Patientez un instant.',
  500: 'Erreur serveur. Réessayez plus tard.',
  502: 'Serveur indisponible.',
  503: 'Service indisponible.',
};

function toApiError(error: AxiosError<ApiErrorPayload>): ApiError {
  const status = error.response?.status ?? 0;
  const payload = error.response?.data;

  if (!error.response) {
    const msg =
      error.code === 'ECONNABORTED'
        ? 'Délai dépassé. Vérifiez votre connexion.'
        : 'Impossible de joindre le serveur.';
    return new ApiError(msg, 0);
  }

  let message: string | undefined;
  let details: string[] | undefined;

  if (payload?.message) {
    if (Array.isArray(payload.message)) {
      details = payload.message;
      message = payload.message[0];
    } else {
      message = payload.message;
    }
  }

  if (!message) message = STATUS_FALLBACK[status] ?? `Erreur (${status})`;

  return new ApiError(message, status, details, payload);
}

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(toApiError(error));
  }
);

export default api;