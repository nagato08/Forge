import * as Sentry from '@sentry/nextjs';
import { sentryOptions } from './sentry.shared';

/**
 * Instrumentation cote serveur — appelee une fois au demarrage, avant tout
 * traitement de requete (Next.js 15+).
 */
export function register() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  // `nodejs` et `edge` ont des runtimes distincts : chacun doit initialiser
  // son propre client.
  if (
    process.env.NEXT_RUNTIME === 'nodejs' ||
    process.env.NEXT_RUNTIME === 'edge'
  ) {
    Sentry.init(sentryOptions);
  }
}

/** Remonte les erreurs de rendu serveur (Server Components, route handlers). */
export const onRequestError = Sentry.captureRequestError;
