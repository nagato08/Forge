'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth.store';
import { ROLE_ROUTES } from '@/lib/utils/auth-routes';
import Spinner from '@/components/ui/Spinner';

export default function Home() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);

  useEffect(() => {
    // Si connecté, rediriger vers le dashboard du rôle
    if (token && role) {
      const dashboardUrl = ROLE_ROUTES[role];
      router.push(dashboardUrl);
    } else {
      // Sinon, rediriger vers login
      router.push('/login');
    }
  }, [token, role, router]);

  // Afficher un spinner en attendant
  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
      <Spinner centered size="lg" label="Redirection en cours..." />
    </div>
  );
}
