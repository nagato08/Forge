'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutGrid,
  FolderOpen,
  CheckSquare,
  CalendarDays,
  Clock,
  Settings,
  Users,
  ShieldCheck,
  Trash2,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useUIStore } from '@/lib/stores/ui.store';
import SidebarAccountMenu from '@/components/layout/SidebarAccountMenu';
import { useEffect, useState } from 'react';

/**
 * Évite hydration mismatch SSR/client: rend null côté SSR, puis vrai contenu après mount.
 * Au mount, Zustand a déjà hydraté depuis localStorage → role/user lisibles via selector.
 */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

const mainNavItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutGrid },
  { href: '/projects', label: 'Projets', icon: FolderOpen },
  { href: '/my-tasks', label: 'Mes tâches', icon: CheckSquare },
  { href: '/calendar', label: 'Agenda', icon: CalendarDays },
  { href: '/time-tracking', label: 'Temps', icon: Clock },
];

const adminNavItems = [
  { href: '/settings/users', label: 'Utilisateurs', icon: Users },
  { href: '/settings/audit-logs', label: 'Journal d’audit', icon: ShieldCheck },
];

const settingsNavItems = [
  { href: '/settings/profile', label: 'Profil', icon: Settings },
];

/**
 * Réservée à ceux qui peuvent posséder un projet, donc en supprimer et en
 * restaurer un. Un EMPLOYEE n'a jamais rien à y voir : la corbeille lui
 * resterait vide en permanence.
 */
const trashNavItem = { href: '/settings/trash', label: 'Corbeille', icon: Trash2 };

export default function Sidebar() {
  const pathname = usePathname();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const collapsed = useUIStore((state) => state.sidebarCollapsed);
  const toggleCollapsed = useUIStore((state) => state.toggleSidebarCollapsed);
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const mounted = useMounted();

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isAdmin = mounted && role === 'ADMIN';
  const canOwnProjects =
    mounted && (role === 'ADMIN' || role === 'PROJECT_MANAGER');

  const handleNavClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const renderNavItem = (item: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={handleNavClick}
        title={collapsed ? item.label : undefined}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-lg
          transition-colors duration-200
          ${collapsed ? 'justify-center' : ''}
          ${
            active
              ? 'bg-[var(--primary)]/15 text-[var(--primary)] font-medium'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
          }
        `}
      >
        <Icon className="w-5 h-5 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
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
          z-40 transform transition-[transform,width] duration-300
          w-64 ${collapsed ? 'md:w-[72px]' : 'md:w-64'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div
          className={`flex items-center border-b border-[var(--border)] h-16 shrink-0 ${
            collapsed ? 'justify-center px-2' : 'justify-between px-4'
          }`}
        >
          <h1 className="text-xl font-bold text-[var(--text-primary)]" title="Forge">
            {collapsed ? 'F' : 'Forge'}
          </h1>
          {/* Close button mobile */}
          {!collapsed && (
            <button
              onClick={toggleSidebar}
              className="md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              aria-label="Fermer le menu"
            >
              ✕
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* Main navigation */}
          {mainNavItems.map(renderNavItem)}

          {/* Admin items (only for admins) — direct links, no collapsible parent */}
          {isAdmin && adminNavItems.map(renderNavItem)}

          {/* Settings section */}
          <div className="space-y-1 pt-3 border-t border-[var(--border)] mt-3">
            {[
              ...settingsNavItems,
              ...(canOwnProjects ? [trashNavItem] : []),
            ].map(renderNavItem)}
          </div>
        </nav>

        {/* Collapse toggle — desktop uniquement, le mobile utilise déjà son propre panneau off-canvas */}
        <button
          onClick={toggleCollapsed}
          className={`hidden md:flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors border-t border-[var(--border)] ${
            collapsed ? 'justify-center' : ''
          }`}
          aria-label={collapsed ? 'Déplier la barre latérale' : 'Réduire la barre latérale'}
          title={collapsed ? 'Déplier' : 'Réduire'}
        >
          {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          {!collapsed && 'Réduire'}
        </button>

        {/* Compte utilisateur */}
        {user && <SidebarAccountMenu user={user} role={role} collapsed={collapsed} />}
      </aside>
    </>
  );
}
