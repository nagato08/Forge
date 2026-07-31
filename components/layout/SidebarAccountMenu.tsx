'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Role } from '@/lib/stores/auth.store';
import { useLogout } from '@/lib/hooks/useAuth';
import { getRoleBadge } from '@/components/ui/Badge';
import { Settings, LogOut } from 'lucide-react';

interface SidebarAccountMenuProps {
  user: User;
  role: Role | null;
  /** Sidebar réduite aux icônes : n'affiche que l'avatar, popover ouvert à droite. */
  collapsed: boolean;
}

function initials(user: User) {
  return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
}

/**
 * Bloc compte ancré en bas de la sidebar — pattern des outils fréquentés
 * (Slack, Notion, Linear) plutôt qu'un email et un bouton Déconnexion perdus
 * dans l'appbar. Un popover ancré, pas une Modal : l'action est trop légère
 * pour justifier un plein écran assombri.
 */
export default function SidebarAccountMenu({
  user,
  role,
  collapsed,
}: SidebarAccountMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const logoutMutation = useLogout();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    logoutMutation.mutate(undefined, {
      onSuccess: () => router.push('/login'),
    });
  };

  return (
    <div ref={containerRef} className="relative p-3 border-t border-[var(--border)]">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Menu du compte"
        className={`
          w-full flex items-center gap-3 rounded-lg p-2
          text-left transition-colors duration-200
          hover:bg-[var(--bg-surface-hover)]
          ${collapsed ? 'justify-center' : ''}
        `}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt=""
            className="w-8 h-8 rounded-full shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white text-xs font-semibold flex items-center justify-center shrink-0">
            {initials(user)}
          </div>
        )}
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
              {user.firstName} {user.lastName}
            </p>
            {role && <div className="mt-0.5">{getRoleBadge(role)}</div>}
          </div>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={`
            absolute z-50 w-64 rounded-lg border border-[var(--border)]
            bg-[var(--bg-surface)] shadow-lg py-1.5
            ${collapsed ? 'left-full bottom-0 ml-2' : 'left-3 right-3 bottom-full mb-2'}
          `}
        >
          <div className="px-3 py-2 border-b border-[var(--border)]">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-[var(--text-secondary)] truncate">{user.email}</p>
          </div>
          <Link
            href="/settings/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            <Settings className="w-4 h-4" />
            Profil
          </Link>
          <button
            role="menuitem"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--critical)] hover:bg-[var(--bg-surface-hover)] transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            {logoutMutation.isPending ? 'Déconnexion...' : 'Déconnexion'}
          </button>
        </div>
      )}
    </div>
  );
}
