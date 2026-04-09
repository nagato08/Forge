import { Role } from '@/lib/types/user.types';

/**
 * Redirection par rôle après login
 * Chaque rôle voit son dashboard spécifique
 */
export const ROLE_ROUTES: Record<Role, string> = {
  [Role.ADMIN]: '/dashboard/admin',
  [Role.PROJECT_MANAGER]: '/dashboard/project-manager',
  [Role.EMPLOYEE]: '/dashboard/employee',
};

/**
 * Routes publiques (sans auth)
 */
export const PUBLIC_ROUTES = ['/login', '/register', '/reset-password'];

/**
 * Routes protégées (auth requise)
 * Tout ce qui n'est pas public + pas /
 */
export function isProtectedRoute(pathname: string): boolean {
  return !PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  ) && pathname !== '/';
}
