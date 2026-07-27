import type { init } from '@sentry/nextjs';

type SentryOptions = Parameters<typeof init>[0];

/**
 * Options Sentry communes au navigateur, au serveur Node et au runtime edge.
 *
 * Sans `NEXT_PUBLIC_SENTRY_DSN`, `dsn` est vide et le SDK reste inerte :
 * le suivi d'erreurs est optionnel et ne doit jamais bloquer l'application.
 */
export const sentryOptions: SentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT ?? process.env.NODE_ENV,

  // 10 % des transactions en production : de quoi voir les tendances sans
  // saturer le quota gratuit.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

  // Aucune donnée personnelle implicite (adresses IP, cookies, en-têtes).
  sendDefaultPii: false,

  // Bruit de fond typique d'un navigateur : extensions, coupures réseau.
  // Ces événements ne révèlent aucun défaut de l'application.
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Non-Error promise rejection captured',
    'NetworkError when attempting to fetch resource',
    'Failed to fetch',
    'AbortError',
  ],

  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
};
