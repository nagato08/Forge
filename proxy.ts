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

interface JwtPayload {
  role?: string;
  exp?: number;
}

/**
 * Decode le payload d'un JWT, SANS verifier la signature.
 *
 * Le secret n'existe pas cote navigateur/edge : ce decodage sert uniquement a
 * choisir une redirection d'interface. Il n'a AUCUNE valeur de securite — un
 * utilisateur peut fabriquer un jeton pour atteindre une page, mais l'API
 * rejettera ses appels. Toute autorisation reelle reste cote serveur.
 *
 * Le payload d'un JWT est encode en base64url : `-` et `_` remplacent `+` et
 * `/`, et le padding `=` est omis. `atob` attend du base64 standard et echoue
 * sur ces caracteres — un jeton parfaitement valide etait donc parfois traite
 * comme malforme, deconnectant l'utilisateur au hasard.
 */
function decodeJwtPayload(token: string): JwtPayload | null {
  const segment = token.split('.')[1];
  if (!segment) return null;

  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '='
    );
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

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

  const payload = token ? decodeJwtPayload(token) : null;
  const role = payload?.role ?? null;

  // Un access token expire ne sert a rien : sans ce controle, l'utilisateur
  // atterrit sur un dashboard qui echoue ensuite en 401. On le renvoie au login.
  const isExpired =
    typeof payload?.exp === 'number' && payload.exp * 1000 <= Date.now();

  const isAuthenticated = !!token && !!role && !isExpired;
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
