'use client';

import type { LucideIcon } from 'lucide-react';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Timer,
  Activity,
  ListChecks,
  BarChart3,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { useMyTasks, useMyTimeStats } from '@/lib/hooks';
import { useAuthStore } from '@/lib/stores/auth.store';
import Spinner from '@/components/ui/Spinner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 6) return 'Bonne nuit';
  if (h < 18) return 'Bonjour';
  return 'Bonsoir';
};

type StatAccent = 'primary' | 'warning' | 'success';

const accentMap: Record<StatAccent, { chip: string; icon: string; value: string }> = {
  primary: { chip: 'bg-primary/10', icon: 'text-primary', value: 'text-primary' },
  warning: { chip: 'bg-warning/10', icon: 'text-warning', value: 'text-warning' },
  success: { chip: 'bg-success/10', icon: 'text-success', value: 'text-success' },
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub: string;
  accent: StatAccent;
}) {
  const c = accentMap[accent];
  return (
    <Card className="p-5 transition-all hover:shadow-md hover:border-primary/30">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-text-secondary font-medium">{label}</p>
          <p className={`text-3xl font-bold tracking-tight ${c.value}`}>{value}</p>
          <p className="text-xs text-text-weak">{sub}</p>
        </div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${c.chip}`}>
          <Icon className={`w-5 h-5 ${c.icon}`} strokeWidth={2} />
        </div>
      </div>
    </Card>
  );
}

export default function EmployeeDashboardPage() {
  const { data: myTasks, isLoading: isLoadingTasks } = useMyTasks();
  const { data: timeStats, isLoading: isLoadingStats } = useMyTimeStats();
  const user = useAuthStore((state) => state.user);

  if (isLoadingTasks || isLoadingStats) {
    return <Spinner centered size="lg" label="Chargement de votre tableau de bord..." />;
  }

  const total = myTasks?.length || 0;
  const tasksByStatus = {
    TODO: myTasks?.filter((t) => t.status === 'TODO').length || 0,
    DOING: myTasks?.filter((t) => t.status === 'DOING').length || 0,
    DONE: myTasks?.filter((t) => t.status === 'DONE').length || 0,
  };
  const completion = total > 0 ? Math.round((tasksByStatus.DONE / total) * 100) : 0;
  const recentTasks = myTasks?.slice(0, 5) || [];
  const maxProjectMinutes = timeStats?.byProject.length
    ? Math.max(...timeStats.byProject.map((p) => p.totalMinutes))
    : 0;

  const statusMeta = {
    TODO: { label: 'À faire', dot: 'bg-warning', badge: 'bg-warning/10 text-warning' },
    DOING: { label: 'En cours', dot: 'bg-primary', badge: 'bg-primary/10 text-primary' },
    DONE: { label: 'Complétée', dot: 'bg-success', badge: 'bg-success/10 text-success' },
  } as const;

  const progressRows = [
    { key: 'TODO', label: 'À faire', value: tasksByStatus.TODO, bar: 'bg-warning' },
    { key: 'DOING', label: 'En cours', value: tasksByStatus.DOING, bar: 'bg-primary' },
    { key: 'DONE', label: 'Complétées', value: tasksByStatus.DONE, bar: 'bg-success' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          {getGreeting()}
          {user?.firstName ? `, ${user.firstName}` : ''}
        </h1>
        <p className="text-text-secondary text-sm">
          Voici l&apos;essentiel de vos tâches et de votre productivité aujourd&apos;hui.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={ClipboardList}
          label="Tâches"
          value={total}
          sub={`${tasksByStatus.DOING} en cours`}
          accent="primary"
        />
        <StatCard
          icon={Clock}
          label="À faire"
          value={tasksByStatus.TODO}
          sub="en attente"
          accent="warning"
        />
        <StatCard
          icon={CheckCircle2}
          label="Complétées"
          value={tasksByStatus.DONE}
          sub={`${completion}% du total`}
          accent="success"
        />
        <StatCard
          icon={Timer}
          label="Temps suivi"
          value={timeStats ? formatDuration(timeStats.totalMinutes) : '—'}
          sub="cette semaine"
          accent="primary"
        />
      </div>

      {/* Task Status Overview + Completion Ring */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-text-secondary" />
          <h2 className="text-lg font-semibold text-text-primary">État de mes tâches</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 items-center">
          {/* Completion ring */}
          <div className="flex items-center justify-center md:justify-start">
            <div
              className="relative w-32 h-32 rounded-full"
              style={{
                background: `conic-gradient(var(--success) ${completion * 3.6}deg, var(--border) 0deg)`,
              }}
            >
              <div className="absolute inset-[10px] rounded-full bg-bg-surface flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-text-primary">{completion}%</span>
                <span className="text-xs text-text-weak">complété</span>
              </div>
            </div>
          </div>

          {/* Status Bars */}
          <div className="space-y-4">
            {progressRows.map((row) => (
              <div key={row.key} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{row.label}</span>
                  <span className="font-semibold text-text-primary tabular-nums">{row.value}</span>
                </div>
                <div className="w-full bg-border/60 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`${row.bar} h-2.5 rounded-full transition-[width] duration-500`}
                    style={{ width: total ? `${(row.value / total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Recent Tasks */}
      <Card>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-text-secondary" />
            <h2 className="text-lg font-semibold text-text-primary">Tâches récentes</h2>
          </div>
          <Link href="/my-tasks">
            <Button variant="secondary" size="sm">
              Voir toutes
            </Button>
          </Link>
        </div>

        <div className="max-h-100 overflow-y-auto">
          {recentTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-bg-surface-hover">
                <ClipboardList className="w-6 h-6 text-text-weak" />
              </div>
              <p className="text-sm text-text-secondary">Aucune tâche assignée</p>
            </div>
          ) : (
            recentTasks.map((task) => {
              const meta = statusMeta[task.status as keyof typeof statusMeta] ?? statusMeta.TODO;
              return (
                <div
                  key={task.id}
                  className="group flex items-center gap-4 px-6 py-4 border-b border-border last:border-b-0 hover:bg-bg-surface-hover transition-colors"
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">{task.title}</p>
                    <p className="text-xs text-text-weak mt-0.5 truncate">
                      Projet · {task.projectId}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${meta.badge}`}
                  >
                    {meta.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Time Stats */}
      {timeStats && (
        <Card>
          <div className="flex items-center gap-2 p-6 border-b border-border">
            <BarChart3 className="w-5 h-5 text-text-secondary" />
            <h2 className="text-lg font-semibold text-text-primary">Temps suivi par projet</h2>
          </div>

          <div className="p-6">
            {timeStats.byProject.length === 0 ? (
              <p className="text-center text-text-secondary py-4">
                Aucun temps suivi pour le moment
              </p>
            ) : (
              <div className="space-y-4">
                {timeStats.byProject.map((proj) => (
                  <div key={proj.projectId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary truncate pr-4">{proj.projectName}</span>
                      <span className="font-semibold text-text-primary tabular-nums shrink-0">
                        {formatDuration(proj.totalMinutes)}
                      </span>
                    </div>
                    <div className="w-full bg-border/60 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-2 rounded-full transition-[width] duration-500"
                        style={{
                          width: maxProjectMinutes
                            ? `${(proj.totalMinutes / maxProjectMinutes) * 100}%`
                            : '0%',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/my-tasks', label: 'Mes tâches', desc: 'Voir toutes', icon: ClipboardList },
          { href: '/time-tracking', label: 'Temps', desc: 'Suivi du temps', icon: Clock },
          { href: '/settings/profile', label: 'Profil', desc: 'Paramètres', icon: Settings },
        ].map((action) => (
          <Link key={action.href} href={action.href} className="group">
            <Card className="p-5 transition-all hover:shadow-md hover:border-primary/30">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                  <action.icon className="w-5 h-5 text-primary" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text-primary">{action.label}</p>
                  <p className="text-xs text-text-weak">{action.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-text-weak transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
