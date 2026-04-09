'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useUIStore } from '@/lib/stores/ui.store';
import { getRoleBadge } from '@/components/ui/Badge';

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: '📊' },
  { href: '/projects', label: 'Projets', icon: '📁' },
  { href: '/my-tasks', label: 'Mes tâches', icon: '✓' },
  { href: '/time-tracking', label: 'Temps', icon: '⏱' },
  { href: '/settings/profile', label: 'Paramètres', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative top-0 left-0 h-screen
          bg-[var(--bg-surface)] border-r border-[var(--border)]
          w-64 z-40 transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              Forge
            </h1>
            {/* Close button mobile */}
            <button
              onClick={toggleSidebar}
              className="md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              ✕
            </button>
          </div>

          {/* User info */}
          {user && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {user.firstName} {user.lastName}
              </p>
              <div className="flex gap-2">
                {role && getRoleBadge(role)}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-colors duration-200
                  ${
                    active
                      ? 'bg-[var(--primary)]/15 text-[var(--primary)] font-medium'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border)] text-xs text-[var(--text-weak)]">
          <p>v0.1.0</p>
        </div>
      </aside>
    </>
  );
}
