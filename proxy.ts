import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Routes publiques (pas besoin d'auth)
 */
const PUBLIC_ROUTES = ['/login', '/register', '/reset-password'];

/**
 * Redirection par role apres login
 */
const ROLE_DASHBOARD: Record<string, string> = {
  ADMIN: '/dashboard/admin',
  PROJECT_MANAGER: '/dashboard/project-manager',
  EMPLOYEE: '/dashboard/employee',
};

/**
 * Proxy Next.js 16 — protection des routes et redirection par role JWT
 *
 * Logique :
 * 1. Routes publiques → si deja connecte, redirige vers le bon dashboard
 * 2. Routes protegees → si pas connecte, redirige vers /login
 * 3. Route / → redirige vers /login ou dashboard selon auth
 * 4. Route /dashboard → redirige vers le dashboard specifique au role
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lire le cookie auth-token (pose lors du login dans useAuth.ts)
  const token = request.cookies.get('auth-token')?.value;

  // Decoder le role depuis le JWT (payload base64 sans verification crypto)
  let role: string | null = null;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      role = payload.role || null;
    } catch {
      // Token malformed → traiter comme non-connecte
      role = null;
    }
  }

  const isAuthenticated = !!token && !!role;
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // 1. Route racine → login ou dashboard
  if (pathname === '/') {
    if (isAuthenticated) {
      const dashboardUrl = ROLE_DASHBOARD[role!] || '/dashboard/employee';
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Routes publiques (login, register, reset-password)
  //    Si deja connecte → redirige vers le bon dashboard
  if (isPublicRoute) {
    if (isAuthenticated) {
      const dashboardUrl = ROLE_DASHBOARD[role!] || '/dashboard/employee';
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
    return NextResponse.next();
  }

  // 3. Routes protegees — pas connecte → login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Route /dashboard (sans sous-chemin) → redirige vers le dashboard du role
  if (pathname === '/dashboard') {
    const dashboardUrl = ROLE_DASHBOARD[role!] || '/dashboard/employee';
    return NextResponse.redirect(new URL(dashboardUrl, request.url));
  }

  // 5. Connecte + route protegee → continuer
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf :
     * - api (API routes)
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation images)
     * - favicon.ico
     * - fichiers publics (.png, .svg, .ico, .jpg)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|jpg|jpeg|gif|webp)$).*)',
  ],
};
