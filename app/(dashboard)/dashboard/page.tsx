'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth.store';
import Spinner from '@/components/ui/Spinner';

export default function DashboardPage() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);

  useEffect(() => {
    if (role === 'ADMIN') {
      router.push('/dashboard/admin');
    } else if (role === 'PROJECT_MANAGER') {
      router.push('/dashboard/project-manager');
    } else if (role === 'EMPLOYEE') {
      router.push('/dashboard/employee');
    }
  }, [role, router]);

  return <Spinner centered size="lg" label="Redirection vers votre tableau de bord..." />;
}
