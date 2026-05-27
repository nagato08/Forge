'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRequestPasswordReset } from '@/lib/hooks/useAuth';
import { Button, Input, Card, Alert } from '@/components/ui';
import { toast } from '@/lib/stores/toast.store';
import { getApiError } from '@/lib/utils/api-error';

const resetSchema = z.object({
  email: z.string().email('Email invalide'),
});

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const resetMutation = useRequestPasswordReset();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const email = watch('email');

  const onSubmit = async (data: ResetForm) => {
    console.log('📧 Requesting password reset for:', data.email);
    resetMutation.mutate(data, {
      onSuccess: () => {
        console.log(' Password reset email sent to:', data.email);
        setSubmitted(true);
      },
      onError: (error) => {
        console.error(' Password reset request error:', getApiError(error));
        toast.error(getApiError(error), { title: 'Erreur' });
      },
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 py-12">
        {/* Background accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--success)]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[var(--success)]/3 rounded-full blur-3xl pointer-events-none" />

        {/* Content */}
        <div className="relative w-full max-w-md space-y-8 animate-fade-in">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-block">
              <div className="text-4xl font-bold bg-gradient-to-r from-[var(--success)] to-[var(--success)]/80 bg-clip-text text-transparent">
                ✓
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Email envoyé
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Vérifiez votre boîte mail pour réinitialiser votre mot de passe
            </p>
          </div>

          {/* Confirmation Card */}
          <Card className="space-y-4 shadow-lg">
            <Alert
              type="success"
              title="Instructions envoyées"
              message={`Un lien de réinitialisation a été envoyé à ${email}`}
            />

            <div className="space-y-2 text-sm text-[var(--text-secondary)]">
              <p>
                • Vérifiez votre dossier de spam si vous ne recevez pas l&apos;email
              </p>
              <p>• Le lien expire dans 24 heures</p>
              <p>• Cliquez sur le lien pour créer un nouveau mot de passe</p>
            </div>

            <Link href="/login" className="block">
              <Button variant="secondary" className="w-full">
                Retour à la connexion
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 py-12">
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--primary)]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-[var(--primary)]/3 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative w-full max-w-md space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-block">
            <div className="text-4xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 bg-clip-text text-transparent">
              Forge
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Réinitialiser le mot de passe
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Entrez votre email pour recevoir les instructions
          </p>
        </div>

        {/* Form Card */}
        <Card className="space-y-6 shadow-lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              placeholder="vous@exemple.fr"
              type="email"
              error={errors.email?.message}
              {...register('email')}
              autoComplete="email"
              autoFocus
            />

            <Button
              type="submit"
              isLoading={resetMutation.isPending}
              className="w-full mt-6"
            >
              Envoyer les instructions
            </Button>
          </form>

          {/* Login link */}
          <div className="text-center text-sm">
            <Link
              href="/login"
              className="text-[var(--primary)] hover:text-[var(--primary)]/80 font-medium transition-colors"
            >
              Retour à la connexion
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
