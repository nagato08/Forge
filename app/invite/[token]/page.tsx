'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useAcceptInvitation,
  useInvitationPreview,
} from '@/lib/hooks/useProjects';
import { useAuthStore } from '@/lib/stores/auth.store';
import { InvitationStatus } from '@/lib/types/project.types';
import { getApiError } from '@/lib/utils/api-error';
import { Button, Card, Spinner } from '@/components/ui';
import { LogIn, Mail, XCircle } from 'lucide-react';

/**
 * Page d'atterrissage d'une invitation nominative.
 *
 * Elle est publique : l'invité doit pouvoir lire « vous êtes invité au projet
 * X, connectez-vous avec telle adresse » avant même d'avoir un compte. La
 * jointure ne se déclenche qu'une fois authentifié, et le serveur vérifie que
 * l'email du compte correspond bien à celui invité.
 */
export default function InviteTokenPage() {
  const router = useRouter();
  const params = useParams();
  const inviteToken = params.token as string;

  const authToken = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);

  const { data: preview, isLoading, error: previewError } =
    useInvitationPreview(inviteToken);
  const acceptMutation = useAcceptInvitation();
  const [error, setError] = useState<string | null>(null);

  // Évite un double appel en cas de double montage (StrictMode).
  const attempted = useRef(false);

  const loginUrl = `/login?callbackUrl=${encodeURIComponent(`/invite/${inviteToken}`)}`;

  useEffect(() => {
    // On n'accepte que si l'invitation est exploitable et l'utilisateur connu.
    if (!authToken || !preview) return;
    if (preview.status !== InvitationStatus.PENDING || preview.isExpired) return;
    if (attempted.current) return;

    attempted.current = true;

    acceptMutation.mutate(inviteToken, {
      onSuccess: (member) => {
        router.replace(`/projects/${member.projectId}/kanban`);
      },
      onError: (err) => setError(getApiError(err)),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, preview, inviteToken]);

  if (isLoading) {
    return (
      <Shell>
        <Spinner size="lg" />
        <p className="text-sm text-text-secondary">Vérification du lien…</p>
      </Shell>
    );
  }

  if (previewError || !preview) {
    return (
      <Shell>
        <XCircle className="w-10 h-10 text-critical mx-auto" />
        <Title>Invitation introuvable</Title>
        <p className="text-sm text-text-secondary">
          Ce lien n’est pas valide. Il a peut-être été remplacé par une
          invitation plus récente.
        </p>
        <Button variant="secondary" onClick={() => router.push('/projects')}>
          Voir mes projets
        </Button>
      </Shell>
    );
  }

  // Invitations non exploitables : on l'explique plutôt que de laisser
  // l'utilisateur face à une erreur technique après connexion.
  if (preview.status === InvitationStatus.REVOKED) {
    return (
      <Shell>
        <XCircle className="w-10 h-10 text-critical mx-auto" />
        <Title>Invitation révoquée</Title>
        <p className="text-sm text-text-secondary">
          Cette invitation à «&nbsp;{preview.projectName}&nbsp;» a été annulée
          par un responsable du projet.
        </p>
      </Shell>
    );
  }

  if (preview.isExpired) {
    return (
      <Shell>
        <XCircle className="w-10 h-10 text-warning mx-auto" />
        <Title>Invitation expirée</Title>
        <p className="text-sm text-text-secondary">
          Cette invitation à «&nbsp;{preview.projectName}&nbsp;» n’est plus
          valable. Demandez qu’on vous en envoie une nouvelle.
        </p>
      </Shell>
    );
  }

  if (preview.status === InvitationStatus.ACCEPTED) {
    return (
      <Shell>
        <Title>Invitation déjà utilisée</Title>
        <p className="text-sm text-text-secondary">
          Vous avez déjà rejoint «&nbsp;{preview.projectName}&nbsp;».
        </p>
        <Button variant="primary" onClick={() => router.push('/projects')}>
          Voir mes projets
        </Button>
      </Shell>
    );
  }

  // Visiteur non connecté : on annonce le projet et l'adresse attendue.
  if (!authToken) {
    return (
      <Shell>
        <Mail className="w-10 h-10 text-primary mx-auto" />
        <Title>Invitation à «&nbsp;{preview.projectName}&nbsp;»</Title>
        <p className="text-sm text-text-secondary">
          Cette invitation est destinée à{' '}
          <span className="font-medium text-text-primary">{preview.email}</span>
          . Connectez-vous ou créez un compte avec cette adresse pour rejoindre
          le projet.
        </p>
        <Button
          variant="primary"
          onClick={() => router.push(loginUrl)}
          className="flex items-center gap-2 mx-auto"
        >
          <LogIn className="w-4 h-4" />
          Continuer
        </Button>
      </Shell>
    );
  }

  // Connecté avec la mauvaise adresse : le serveur refuserait, autant le dire
  // tout de suite et proposer la bonne action.
  const emailMismatch =
    currentUser?.email &&
    currentUser.email.toLowerCase() !== preview.email.toLowerCase();

  if (emailMismatch || error) {
    return (
      <Shell>
        <XCircle className="w-10 h-10 text-warning mx-auto" />
        <Title>Mauvais compte</Title>
        <p className="text-sm text-text-secondary">
          {error ??
            `Cette invitation est destinée à ${preview.email}, mais vous êtes connecté en tant que ${currentUser?.email}.`}
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            useAuthStore.getState().logout();
            router.push(loginUrl);
          }}
        >
          Changer de compte
        </Button>
      </Shell>
    );
  }

  return (
    <Shell>
      <Spinner size="lg" />
      <Title>Adhésion en cours…</Title>
      <p className="text-sm text-text-secondary">
        Un instant, nous vous ajoutons à «&nbsp;{preview.projectName}&nbsp;».
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center space-y-4 p-8">
        {children}
      </Card>
    </div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-lg font-semibold text-text-primary">{children}</h1>
  );
}
