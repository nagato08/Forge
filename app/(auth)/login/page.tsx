'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLogin } from '@/lib/hooks/useAuth';
import { useAuthStore } from '@/lib/stores/auth.store';
import { Button, Input, Card, Alert } from '@/components/ui';
import { getApiError } from '@/lib/utils/api-error';
import { Eye, EyeOff } from 'lucide-react';
import { ROLE_ROUTES } from '@/lib/utils/auth-routes';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    console.log('Form submitted:', data.email);
    setApiError(null);
    loginMutation.mutate(
      { email: data.email, password: data.password },
      {
        onSuccess: () => {
          const userRole = useAuthStore.getState().role;
          const dashboardUrl = userRole ? ROLE_ROUTES[userRole] : '/dashboard';
          console.log('Login success, role:', userRole, '→ redirecting to:', dashboardUrl);
          router.push(dashboardUrl);
        },
        onError: (error) => {
          console.error('Login mutation error callback:', error);
          setApiError(getApiError(error));
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
          {apiError && (
            <Alert
              type="error"
              title="Erreur de connexion"
              message={apiError}
              onClose={() => setApiError(null)}
            />
          )}

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
          <div className="space-y-2 text-center text-sm">
            <div>
              <Link
                href="/reset-password"
                className="text-[var(--primary)] hover:text-[var(--primary)]/80 font-medium transition-colors"
              >
                Mot de passe oublié?
              </Link>
            </div>
            <p className="text-[var(--text-secondary)]">
              Pas encore de compte?{' '}
              <Link
                href="/register"
                className="text-[var(--primary)] hover:text-[var(--primary)]/80 font-medium transition-colors"
              >
                S&apos;inscrire
              </Link>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-xs text-center text-[var(--text-weak)]">
          En vous connectant, vous acceptez nos conditions d&apos;utilisation
        </p>
      </div>
    </div>
  );
}
