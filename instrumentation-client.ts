import * as Sentry from '@sentry/nextjs';
import { sentryOptions } from './sentry.shared';

/**
 * Instrumentation cote navigateur (Next.js 15+).
 *
 * Inerte tant que `NEXT_PUBLIC_SENTRY_DSN` n'est pas fourni au build.
 */
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init(sentryOptions);
}

/** Instrumente les transitions de navigation pour le suivi de performance. */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
