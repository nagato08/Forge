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

/**
 * Valide un `callbackUrl` avant d'y rediriger après login/register.
 *
 * Le proxy pose ce paramètre pour ramener l'utilisateur sur la page qu'il
 * visait (ex. un lien d'invitation). Sans validation, un lien fabriqué avec
 * `callbackUrl=https://site-malveillant.example` détournerait la redirection
 * post-connexion vers un site externe (open redirect) : on n'accepte donc
 * qu'un chemin relatif simple, jamais une URL absolue ni un `//host`.
 */
export function getSafeCallbackUrl(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;
  return raw;
}
