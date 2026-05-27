'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRegister } from '@/lib/hooks/useAuth';
import { useGetDepartmentEnums } from '@/lib/hooks';
import { useAuthStore } from '@/lib/stores/auth.store';
import { Button, Input, Select, Card } from '@/components/ui';
import { toast } from '@/lib/stores/toast.store';
import { getApiError } from '@/lib/utils/api-error';
import { Role, Department } from '@/lib/types/user.types';
import { ROLE_ROUTES } from '@/lib/utils/auth-routes';
import { Eye, EyeOff } from 'lucide-react';

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'Prénom requis'),
    lastName: z.string().min(2, 'Nom requis'),
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Minimum 8 caractères'),
    confirmPassword: z.string(),
    role: z.nativeEnum(Role),
    department: z.nativeEnum(Department).optional(),
    jobTitle: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

const roleOptions = [
  { value: Role.EMPLOYEE, label: 'Employé' },
  { value: Role.PROJECT_MANAGER, label: 'Chef de projet' },
  // ADMIN ne peut pas s'inscrire (backend retourne 403)
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const registerMutation = useRegister();
  const { data: departments, isLoading: deptLoading } = useGetDepartmentEnums();

  const departmentOptions = departments?.map((dept) => ({
    value: dept,
    label: dept,
  })) || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    console.log('Register form submitted:', data.email, 'role:', data.role);
    registerMutation.mutate(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: data.role,
        department: data.department,
        jobTitle: data.jobTitle,
      },
      {
        onSuccess: () => {
          const userRole = useAuthStore.getState().role;
          const dashboardUrl = userRole ? ROLE_ROUTES[userRole] : '/dashboard';
          console.log('Registration successful, role:', userRole, '→ redirecting to:', dashboardUrl);
          router.push(dashboardUrl);
        },
        onError: (error) => {
          console.error('Registration error:', getApiError(error));
          toast.error(getApiError(error), { title: 'Erreur' });
        },
      }
    );
  };

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
            Créer un compte
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Rejoignez notre plateforme de gestion de projets
          </p>
        </div>

        {/* Form Card */}
        <Card className="space-y-6 shadow-lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Prénom"
                placeholder="Jean"
                error={errors.firstName?.message}
                {...register('firstName')}
                autoComplete="given-name"
              />
              <Input
                label="Nom"
                placeholder="Dupont"
                error={errors.lastName?.message}
                {...register('lastName')}
                autoComplete="family-name"
              />
            </div>

            {/* Email */}
            <Input
              label="Email"
              placeholder="vous@exemple.fr"
              type="email"
              error={errors.email?.message}
              {...register('email')}
              autoComplete="email"
            />

            {/* Password */}
            <div className="relative">
              <Input
                label="Mot de passe"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                error={errors.password?.message}
                {...register('password')}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1"
              >
                {showPassword ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeOff className="w-5 h-5" />
                )}
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
                className="absolute right-3 top-[38px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1"
              >
                {showConfirm ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeOff className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Role */}
            <Select
              label="Rôle"
              options={roleOptions}
              placeholder="Choisir un rôle"
              {...register('role')}
            />

            {/* Department */}
            <Select
              label="Département (optionnel)"
              options={departmentOptions}
              placeholder="Choisir un département"
              {...register('department')}
            />

            {/* Job Title */}
            <Input
              label="Titre du poste (optionnel)"
              placeholder="Chef de projet"
              {...register('jobTitle')}
              autoComplete="job-title"
            />

            {/* Submit */}
            <Button
              type="submit"
              isLoading={registerMutation.isPending}
              className="w-full mt-6"
            >
              S&apos;inscrire
            </Button>
          </form>

          {/* Login link */}
          <div className="text-center text-sm">
            <p className="text-[var(--text-secondary)]">
              Vous avez déjà un compte?{' '}
              <Link
                href="/login"
                className="text-[var(--primary)] hover:text-[var(--primary)]/80 font-medium transition-colors"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-xs text-center text-[var(--text-weak)]">
          En vous inscrivant, vous acceptez nos conditions d&apos;utilisation
        </p>
      </div>
    </div>
  );
}
