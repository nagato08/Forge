'use client';

import { useUIStore } from '@/lib/stores/ui.store';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useLogout } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { NotificationBell } from './NotificationBell';
import Button from '@/components/ui/Button';

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

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
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
            aria-label="Toggle theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
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
