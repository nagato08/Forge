'use client';

import { useUIStore } from '@/lib/stores/ui.store';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useLogout } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { NotificationBell } from './NotificationBell';
import Button from '@/components/ui/Button';
import { Moon, Sun } from 'lucide-react';

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void> };
};

export default function Header() {
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();
  const router = useRouter();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        router.push('/login');
      },
    });
  };

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    const doc = document as ViewTransitionDocument;
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // Pas de support View Transitions ou mouvement réduit → bascule directe
    if (!doc.startViewTransition || prefersReducedMotion) {
      setTheme(newTheme);
      return;
    }

    // Centre du cercle = centre du bouton cliqué
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = doc.startViewTransition(() => {
      setTheme(newTheme);
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  };

  return (
    <header className="bg-[var(--bg-surface)] border-b border-[var(--border)] sticky top-0 z-20">
      <div className="flex items-center justify-between px-4 py-3 gap-4">
        {/* Left: Menu button + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Forge
          </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label={theme === 'light' ? 'Activer le thème sombre' : 'Activer le thème clair'}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          {/* Notifications */}
          <NotificationBell />

          {/* User menu */}
          <div className="flex items-center gap-3">
            {user && (
              <>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {user.firstName}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {user.email}
                  </p>
                </div>

                {user.avatar && (
                  <img
                    src={user.avatar}
                    alt={user.firstName}
                    className="w-8 h-8 rounded-full"
                  />
                )}
              </>
            )}

            {/* Logout button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              isLoading={logoutMutation.isPending}
              aria-label="Logout"
            >
              Déconnexion
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
