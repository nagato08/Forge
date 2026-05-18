'use client';

import type { Metadata } from 'next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useUIStore } from '@/lib/stores/ui.store';
import { Toaster } from '@/components/ui';
import './globals.css';

// Créer client QueryClient (stable entre re-renders)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min
      gcTime: 10 * 60 * 1000, // 10 min (anciennement cacheTime)
    },
  },
});

// Composant pour hydrater le thème côté client
function ThemeHydrator() {
  useEffect(() => {
    // Au premier chargement, appliquer le thème sauvegardé
    const theme = useUIStore.getState().theme;
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="description" content="Forge — Gestion de projets" />
      </head>
      <body className="h-full antialiased">
        <QueryClientProvider client={queryClient}>
          <ThemeHydrator />
          {children}
          <Toaster />
        </QueryClientProvider>
      </body>
    </html>
  );
}
