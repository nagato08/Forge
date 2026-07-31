'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Spinner from '@/components/ui/Spinner';

/**
 * Ancienne adresse du chat de projet.
 *
 * Le chat est regroupé dans l'onglet Messages, où canaux de projet et
 * conversations directes cohabitent. La route est conservée en redirection
 * plutôt que supprimée : les liens déjà partagés continuent d'aboutir.
 */
export default function ProjectChatRedirect() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  useEffect(() => {
    router.replace(`/chat?project=${projectId}`);
  }, [router, projectId]);

  return <Spinner centered size="lg" label="Redirection vers les messages..." />;
}
