'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useJoinProjectByToken } from '@/lib/hooks/useProjects';
import { useAuthStore } from '@/lib/stores/auth.store';
import { getApiError } from '@/lib/utils/api-error';
import { Button, Card, Spinner } from '@/components/ui';
import { XCircle } from 'lucide-react';

/**
 * Page d'atterrissage d'un lien d'invitation.
 *
 * Route protégée par le proxy comme toute page du dashboard : un visiteur non
 * connecté est renvoyé vers `/login?callbackUrl=/invite/:token`, et revient
 * ici automatiquement après connexion ou inscription (voir `getSafeCallbackUrl`
 * dans les pages login/register). Une fois authentifié, la jointure se
 * déclenche seule — aucune action de l'utilisateur n'est requise.
 */
export default function InviteTokenPage() {
  const router = useRouter();
  const params = useParams();
  const inviteToken = params.token as string;

  const authToken = useAuthStore((state) => state.token);
  const joinMutation = useJoinProjectByToken();
  const [error, setError] = useState<string | null>(null);
  // Évite un double appel (React StrictMode ou double montage) : la
  // jointure n'est pas idempotente à l'affichage (mais le backend renvoie une
  // 409 propre si on rejoue, donc ce garde-fou est surtout pour l'UX).
  const attempted = useRef(false);

  useEffect(() => {
    if (!authToken) {
      // Filet de sécurité si la page est atteinte sans passer par le proxy
      // (navigation client). Le cas normal est déjà couvert côté serveur.
      router.replace(
        `/login?callbackUrl=${encodeURIComponent(`/invite/${inviteToken}`)}`
      );
      return;
    }

    if (attempted.current) return;
    attempted.current = true;

    joinMutation.mutate(
      { inviteToken },
      {
        onSuccess: (member) => {
          // Redirection directe vers le tableau Kanban : c'est la page
          // d'atterrissage par défaut des autres points d'entrée du projet.
          router.replace(`/projects/${member.projectId}/kanban`);
        },
        onError: (err) => {
          setError(getApiError(err));
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, inviteToken]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center space-y-4 p-8">
        {error ? (
          <>
            <XCircle className="w-10 h-10 text-critical mx-auto" />
            <div>
              <h1 className="text-lg font-semibold text-text-primary">
                Invitation invalide
              </h1>
              <p className="text-sm text-text-secondary mt-1">{error}</p>
            </div>
            <Button variant="secondary" onClick={() => router.push('/projects')}>
              Voir mes projets
            </Button>
          </>
        ) : (
          <>
            <Spinner size="lg" />
            <div>
              <h1 className="text-lg font-semibold text-text-primary">
                Adhésion au projet en cours…
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                Un instant, nous vous ajoutons au projet.
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
