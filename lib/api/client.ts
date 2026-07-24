import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { useAuthStore } from '@/lib/stores/auth.store';

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  // Nécessaire pour que le cookie httpOnly du refresh token soit envoyé/reçu (cross-sous-domaine)
  withCredentials: true,
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

// --- Rafraîchissement automatique de l'access token sur 401 ---
// Un seul refresh à la fois : les requêtes 401 concurrentes attendent le même refresh.
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

function flushQueue(token: string | null) {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

function forceLogout() {
  useAuthStore.getState().logout();
  if (
    typeof window !== 'undefined' &&
    !window.location.pathname.startsWith('/login')
  ) {
    window.location.href = '/login';
  }
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiErrorPayload>) => {
    const original = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';

    // On ne tente pas de refresh sur les routes d'auth elles-mêmes (évite la boucle)
    const isAuthRoute =
      url.includes('/auth/refresh') ||
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/logout');

    if (status !== 401 || !original || original._retry || isAuthRoute) {
      return Promise.reject(toApiError(error));
    }

    original._retry = true;

    // Un refresh est déjà en cours : on met la requête en file d'attente
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((token) => {
          if (token) {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          } else {
            reject(toApiError(error));
          }
        });
      });
    }

    isRefreshing = true;
    try {
      const { data } = await api.post<{ access_token: string }>(
        '/auth/refresh'
      );
      const newToken = data.access_token;
      useAuthStore.getState().refreshToken(newToken);
      flushQueue(newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch {
      flushQueue(null);
      forceLogout();
      return Promise.reject(toApiError(error));
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;