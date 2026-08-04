'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLogin } from '@/lib/hooks/useAuth';
import { useAuthStore } from '@/lib/stores/auth.store';
import { Button, Input, Card } from '@/components/ui';
import { getApiError } from '@/lib/utils/api-error';
import { toast } from '@/lib/stores/toast.store';
import { Eye, EyeOff, ShieldCheck, Briefcase, User } from 'lucide-react';
import { ROLE_ROUTES, getSafeCallbackUrl } from '@/lib/utils/auth-routes';

/**
 * Comptes de démonstration, alignés sur `prisma/seed-demo.ts`.
 *
 * Affichés uniquement quand `NEXT_PUBLIC_DEMO_MODE` vaut « true » : sur une
 * instance portant de vraies données, publier des identifiants
 * d'administration sur la page de connexion serait une faille béante.
 */
const DEMO_ACCOUNTS = [
  {
    role: 'Administrateur',
    email: 'admin@forge.dev',
    description: 'Comptes, habilitations, journal d’audit',
    icon: ShieldCheck,
  },
  {
    role: 'Chef de projet',
    email: 'chef@forge.dev',
    description: 'Pilotage, planning, validation des absences',
    icon: Briefcase,
  },
  {
    role: 'Employé',
    email: 'employe@forge.dev',
    description: 'Tâches assignées, pointage, signalements',
    icon: User,
  },
] as const;

const DEMO_PASSWORD = 'Demo1234!';
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}

// `useSearchParams` (pour `callbackUrl`) exige une frontière Suspense en App
// Router, faute de quoi le pré-rendu statique échoue au build.
function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  /** Remplit le formulaire sans le soumettre : on voit ce avec quoi on entre. */
  const fillDemoAccount = (email: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', DEMO_PASSWORD, { shouldValidate: true });
  };

  const onSubmit = async (data: LoginForm) => {
    loginMutation.mutate(
      { email: data.email, password: data.password },
      {
        onSuccess: () => {
          const userRole = useAuthStore.getState().role;
          const dashboardUrl = userRole ? ROLE_ROUTES[userRole] : '/dashboard';
          toast.success('Connexion réussie');
          // Ramène vers la page visée avant redirection au login (ex. un
          // lien d'invitation), sinon vers le dashboard du rôle.
          const callbackUrl = getSafeCallbackUrl(searchParams.get('callbackUrl'));
          router.push(callbackUrl ?? dashboardUrl);
        },
        onError: (error) => {
          toast.error(getApiError(error), { title: 'Erreur de connexion' });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4 py-12">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-(--primary)/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-(--primary)/3 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative w-full max-w-md space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-block">
            <div className="text-4xl font-bold bg-linear-to-r from-primary to-(--primary)/80 bg-clip-text text-transparent">
              Forge
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Connexion
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Gérez vos projets avec efficacité
          </p>
        </div>

        {/* Form Card */}
        <Card className="space-y-6 shadow-lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <Input
              label="Email"
              placeholder="vous@exemple.fr"
              type="email"
              error={errors.email?.message}
              {...register('email')}
              autoComplete="email"
              autoFocus
            />

            {/* Password */}
            <div className="relative">
              <Input
                label="Mot de passe"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                error={errors.password?.message}
                {...register('password')}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeOff className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                {...register('rememberMe')}
                className="w-4 h-4 rounded border-[var(--border)] cursor-pointer"
              />
              <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                Se souvenir de moi
              </span>
            </label>

            {/* Submit */}
            <Button
              type="submit"
              isLoading={loginMutation.isPending}
              className="w-full mt-6"
            >
              Se connecter
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[var(--bg-surface)] text-[var(--text-weak)]">
                ou
              </span>
            </div>
          </div>

          {/* Links */}
          <div className="text-center text-sm">
            <Link
              href="/reset-password"
              className="text-[var(--primary)] hover:text-[var(--primary)]/80 font-medium transition-colors"
            >
              Mot de passe oublié?
            </Link>
          </div>
        </Card>

        {/* Comptes de démonstration */}
        {DEMO_MODE && (
          <Card className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Comptes de démonstration
              </h2>
              <span className="text-xs text-[var(--text-weak)]">
                Cliquez pour remplir
              </span>
            </div>

            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((account) => {
                const Icon = account.icon;
                return (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => fillDemoAccount(account.email)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-[var(--border)] text-left hover:border-[var(--primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                  >
                    <span className="w-8 h-8 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-[var(--text-primary)]">
                        {account.role}
                      </span>
                      <span className="block text-xs text-[var(--text-secondary)] truncate">
                        {account.description}
                      </span>
                    </span>
                    <span className="text-xs font-mono text-[var(--text-weak)] hidden sm:block shrink-0">
                      {account.email}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-[var(--text-secondary)] pt-1 border-t border-[var(--border)]">
              Mot de passe commun :{' '}
              <code className="font-mono text-[var(--text-primary)]">
                {DEMO_PASSWORD}
              </code>
            </p>
          </Card>
        )}

        {/* Footer */}
        <p className="text-xs text-center text-[var(--text-weak)]">
          En vous connectant, vous acceptez nos conditions d&apos;utilisation
        </p>
      </div>
    </div>
  );
}
