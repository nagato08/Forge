'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  useVerifyResetToken,
  useResetPassword,
} from '@/lib/hooks/useAuth';
import { Button, Input, Card, Alert, Spinner } from '@/components/ui';
import { getApiError } from '@/lib/utils/api-error';
import { toast } from '@/lib/stores/toast.store';

const resetSchema = z
  .object({
    password: z.string().min(8, 'Minimum 8 caractères'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordTokenPage() {
  const params = useParams();
  const token = params.token as string;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [success, setSuccess] = useState(false);

  const verifyMutation = useVerifyResetToken();
  const resetMutation = useResetPassword();
  const hasVerified = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  // Verify token on mount (once only)
  useEffect(() => {
    if (token && !hasVerified.current) {
      hasVerified.current = true;
      console.log('🔑 Verifying reset token:', token.substring(0, 8) + '...');
      verifyMutation.mutate(token, {
        onSuccess: (data) => {
          console.log(' Token verification result:', data.valid);
          setTokenValid(data.valid);
        },
        onError: (err) => {
          console.error(' Token verification failed:', getApiError(err));
          setTokenValid(false);
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onSubmit = async (data: ResetForm) => {
    console.log('🔒 Resetting password with token:', token.substring(0, 8) + '...');
    resetMutation.mutate(
      { token, password: data.password },
      {
        onSuccess: () => {
          console.log(' Password reset successful');
          setSuccess(true);
        },
        onError: (error) => {
          console.error(' Password reset error:', getApiError(error));
          toast.error(getApiError(error), { title: 'Erreur' });
        },
      }
    );
  };

  // Loading state
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
        <Spinner centered size="lg" label="Vérification du lien..." />
      </div>
    );
  }

  // Invalid token
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 py-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--critical)]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-block">
              <div className="text-4xl font-bold bg-gradient-to-r from-[var(--critical)] to-[var(--critical)]/80 bg-clip-text text-transparent">
                ✕
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Lien expiré
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Ce lien de réinitialisation n&apos;est plus valide
            </p>
          </div>

          <Card className="space-y-4 shadow-lg">
            <Alert
              type="error"
              title="Lien invalide ou expiré"
              message="Les liens de réinitialisation expirent après 24 heures."
            />

            <Link href="/reset-password" className="block">
              <Button className="w-full">
                Demander un nouveau lien
              </Button>
            </Link>

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

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 py-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--success)]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center space-y-3">
            <div className="inline-block">
              <div className="text-4xl font-bold bg-gradient-to-r from-[var(--success)] to-[var(--success)]/80 bg-clip-text text-transparent">
                ✓
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Mot de passe réinitialisé
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Vous pouvez maintenant vous connecter avec votre nouveau mot de passe
            </p>
          </div>

          <Card className="space-y-4 shadow-lg">
            <Alert
              type="success"
              title="Succès"
              message="Votre mot de passe a été réinitialisé avec succès."
            />

            <Link href="/login" className="block">
              <Button className="w-full">
                Se connecter
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  // Form state
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
            Nouveau mot de passe
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Choisissez un mot de passe sécurisé
          </p>
        </div>

        {/* Form Card */}
        <Card className="space-y-6 shadow-lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Password */}
            <div className="relative">
              <Input
                label="Nouveau mot de passe"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                error={errors.password?.message}
                {...register('password')}
                autoComplete="new-password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {showPassword ? '👁' : '👁‍🗨'}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Input
                label="Confirmer le mot de passe"
                placeholder="••••••••"
                type={showConfirm ? 'text' : 'password'}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-[38px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {showConfirm ? '👁' : '👁‍🗨'}
              </button>
            </div>

            <Button
              type="submit"
              isLoading={resetMutation.isPending}
              className="w-full mt-6"
            >
              Réinitialiser le mot de passe
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <Link
          href="/login"
          className="text-center text-sm text-[var(--primary)] hover:text-[var(--primary)]/80 font-medium transition-colors"
        >
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
