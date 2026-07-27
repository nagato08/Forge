import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Génère un serveur Node minimal autonome (.next/standalone/server.js)
  // → image Docker beaucoup plus légère
  output: "standalone",
};

// Note : la config n'est volontairement PAS enveloppée dans `withSentryConfig`.
// Ce wrapper sert à téléverser les source maps au build, ce qui exige un
// SENTRY_AUTH_TOKEN et une organisation Sentry. Le suivi d'erreurs fonctionne
// sans lui (via instrumentation.ts / instrumentation-client.ts) ; seules les
// piles d'appels côté navigateur restent minifiées. À ajouter le jour où un
// compte Sentry est configuré.

export default nextConfig;
