'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import Link from 'next/link';
import { useUsers, useProjects, useMyTasks } from '@/lib/hooks';
import { TaskAssignment } from '@/lib/types/task.types';
import {
  Users,
  FolderOpen,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Award,
  Calendar,
  ArrowUp,
  ArrowDown,
  Zap,
} from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const COLORS = {
  primary: '#2F81F7',
  success: '#3FB950',
  warning: '#D29922',
  critical: '#F85149',
  info: '#58A6FF',
};

function buildSparkline<T>(
  items: T[] | undefined,
  getDate: (item: T) => string | undefined,
  nowMs: number,
  days = 7
) {
  const dayMs = 24 * 60 * 60 * 1000;
  const total = (items || []).length;
  const createdInWindow: number[] = Array(days).fill(0);
  (items || []).forEach((it) => {
    const d = getDate(it);
    if (!d) return;
    const t = new Date(d).getTime();
    const diffDays = Math.floor((nowMs - t) / dayMs);
    if (diffDays >= 0 && diffDays < days) {
      createdInWindow[days - 1 - diffDays] += 1;
    }
  });
  let running = total - createdInWindow.reduce((a, b) => a + b, 0);
  const buckets: number[] = [];
  for (let i = 0; i < days; i++) {
    running += createdInWindow[i];
    buckets.push(running);
  }
  return buckets.map((value) => ({ value }));
}

function percentChange(current: number, prev: number): number {
  if (prev === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - prev) / prev) * 100);
}

function inWindow(dateStr: string | undefined, cutoffMs: number): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() >= cutoffMs;
}

function inRange(dateStr: string | undefined, fromMs: number, toMs: number): boolean {
  if (!dateStr) return false;
  const t = new Date(dateStr).getTime();
  return t >= fromMs && t < toMs;
}

export default function AdminDashboardPage() {
  const { data: users, isLoading: isLoadingUsers } = useUsers();
  const { data: projects, isLoading: isLoadingProjects } = useProjects();
  const { data: allTasks, isLoading: isLoadingTasks } = useMyTasks();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // All hooks BEFORE early returns and conditionals
  const totalUsers = users?.length || 0;
  const totalProjects = projects?.length || 0;
  const totalTasks = allTasks?.length || 0;

  const usersByRole = useMemo(
    () => ({
      ADMIN: users?.filter((u) => u.role === 'ADMIN').length || 0,
      PROJECT_MANAGER: users?.filter((u) => u.role === 'PROJECT_MANAGER').length || 0,
      EMPLOYEE: users?.filter((u) => u.role === 'EMPLOYEE').length || 0,
    }),
    [users]
  );

  const projectsByStatus = useMemo(
    () => ({
      PLANNING: projects?.filter((p) => p.status === 'PLANNING').length || 0,
      ACTIVE: projects?.filter((p) => p.status === 'ACTIVE').length || 0,
      ON_HOLD: projects?.filter((p) => p.status === 'ON_HOLD').length || 0,
      COMPLETED: projects?.filter((p) => p.status === 'COMPLETED').length || 0,
      CANCELLED: projects?.filter((p) => p.status === 'CANCELLED').length || 0,
    }),
    [projects]
  );

  const tasksByStatus = useMemo(
    () => ({
      TODO: allTasks?.filter((t) => t.status === 'TODO').length || 0,
      DOING: allTasks?.filter((t) => t.status === 'DOING').length || 0,
      DONE: allTasks?.filter((t) => t.status === 'DONE').length || 0,
    }),
    [allTasks]
  );

  const completionRate = useMemo(
    () => (totalTasks > 0 ? Math.round((tasksByStatus.DONE / totalTasks) * 100) : 0),
    [totalTasks, tasksByStatus.DONE]
  );

  const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const periodMs = periodDays * 24 * 60 * 60 * 1000;
  const [now] = useState<number>(() => Date.now());
  const cutoffStart = now - periodMs;
  const cutoffPrev = now - 2 * periodMs;

  const taskTrends = useMemo(
    () => buildSparkline(allTasks, (t) => t.createdAt, now, 7),
    [allTasks, now]
  );

  const userTrends = useMemo(
    () => buildSparkline(users, (u) => u.createdAt, now, 7),
    [users, now]
  );

  const projectTrends = useMemo(
    () => buildSparkline(projects, (p) => p.createdAt, now, 7),
    [projects, now]
  );

  const newUsersThisPeriod = useMemo(
    () => users?.filter((u) => inWindow(u.createdAt, cutoffStart)).length || 0,
    [users, cutoffStart]
  );

  const doneTasksThisPeriod = useMemo(
    () => allTasks?.filter((t) => t.status === 'DONE' && inWindow(t.updatedAt, cutoffStart)).length || 0,
    [allTasks, cutoffStart]
  );

  const doneTasksPrevPeriod = useMemo(
    () => allTasks?.filter((t) => t.status === 'DONE' && inRange(t.updatedAt, cutoffPrev, cutoffStart)).length || 0,
    [allTasks, cutoffPrev, cutoffStart]
  );

  const doneTasksChange = useMemo(
    () => percentChange(doneTasksThisPeriod, doneTasksPrevPeriod),
    [doneTasksThisPeriod, doneTasksPrevPeriod]
  );

  const activeProjectsNow = projectsByStatus.ACTIVE;
  const activeProjectsCreatedThisPeriod = useMemo(
    () => projects?.filter((p) => p.status === 'ACTIVE' && inWindow(p.createdAt, cutoffStart)).length || 0,
    [projects, cutoffStart]
  );
  const activeProjectsCreatedPrevPeriod = useMemo(
    () => projects?.filter((p) => p.status === 'ACTIVE' && inRange(p.createdAt, cutoffPrev, cutoffStart)).length || 0,
    [projects, cutoffPrev, cutoffStart]
  );
  const activeProjectsChange = useMemo(
    () => percentChange(activeProjectsCreatedThisPeriod, activeProjectsCreatedPrevPeriod),
    [activeProjectsCreatedThisPeriod, activeProjectsCreatedPrevPeriod]
  );

  const activeUserIds = useMemo(() => {
    const ids = new Set<string>();
    allTasks?.forEach((t) => {
      if (!inWindow(t.updatedAt, cutoffStart)) return;
      const users = t.assignments?.map((a: TaskAssignment) => a.user.id) || t.assignedUsers?.map((u) => u.id) || [];
      users.forEach((id) => ids.add(id));
    });
    return ids;
  }, [allTasks, cutoffStart]);

  const activeUserIdsPrev = useMemo(() => {
    const ids = new Set<string>();
    allTasks?.forEach((t) => {
      if (!inRange(t.updatedAt, cutoffPrev, cutoffStart)) return;
      const users = t.assignments?.map((a: TaskAssignment) => a.user.id) || t.assignedUsers?.map((u) => u.id) || [];
      users.forEach((id) => ids.add(id));
    });
    return ids;
  }, [allTasks, cutoffPrev, cutoffStart]);

  const activeUsersChange = useMemo(
    () => percentChange(activeUserIds.size, activeUserIdsPrev.size),
    [activeUserIds, activeUserIdsPrev]
  );

  const completionRatePrev = useMemo(() => {
    const tasksAtStartOfPeriod = allTasks?.filter((t) => new Date(t.createdAt).getTime() < cutoffStart) || [];
    if (tasksAtStartOfPeriod.length === 0) return 0;
    const doneBefore = tasksAtStartOfPeriod.filter(
      (t) => t.status === 'DONE' && new Date(t.updatedAt).getTime() < cutoffStart
    ).length;
    return Math.round((doneBefore / tasksAtStartOfPeriod.length) * 100);
  }, [allTasks, cutoffStart]);

  const completionRateChange = completionRate - completionRatePrev;

  const progressionData = useMemo(() => {
    const dayMs = 24 * 60 * 60 * 1000;
    const days = 30;
    const data: Array<{ date: string; completed: number; inProgress: number }> = [];
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(today.getTime() - i * dayMs);
      const dayEnd = new Date(dayStart.getTime() + dayMs);

      const completed =
        allTasks?.filter((t) => {
          if (t.status !== 'DONE') return false;
          const u = new Date(t.updatedAt).getTime();
          return u >= dayStart.getTime() && u < dayEnd.getTime();
        }).length || 0;

      const inProgress =
        allTasks?.filter((t) => {
          if (t.status !== 'DOING') return false;
          const u = new Date(t.updatedAt).getTime();
          return u >= dayStart.getTime() && u < dayEnd.getTime();
        }).length || 0;

      data.push({
        date: dayStart.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        completed,
        inProgress,
      });
    }
    return data;
  }, [allTasks, now]);

  const risks = useMemo(() => {
    const alerts: Array<{
      type: string;
      icon: React.ComponentType<{ className?: string }>;
      title: string;
      description: string;
      color: string;
    }> = [];

    const overdueTasks =
      allTasks?.filter((t) => {
        if (t.status === 'DONE' || !t.deadline) return false;
        return new Date(t.deadline).getTime() < now;
      }).length || 0;

    if (overdueTasks > 0) {
      alerts.push({
        type: 'critical',
        icon: AlertCircle,
        title: `${overdueTasks} tâches en retard`,
        description: 'Tâches deadline dépassée',
        color: 'text-critical',
      });
    }

    const projectsAtRisk =
      projects?.filter((p) => {
        if (p.status === 'COMPLETED' || p.status === 'CANCELLED' || !p.endDate) return false;
        const daysUntilEnd = Math.ceil(
          (new Date(p.endDate).getTime() - now) / (1000 * 60 * 60 * 24)
        );
        return daysUntilEnd < 7 && daysUntilEnd > 0;
      }).length || 0;

    if (projectsAtRisk > 0) {
      alerts.push({
        type: 'warning',
        icon: Calendar,
        title: `${projectsAtRisk} projets en retard potentiel`,
        description: 'Deadline dans moins de 7 jours',
        color: 'text-warning',
      });
    }

    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
    const activeUserIdsSet = new Set<string>();
    allTasks?.forEach((t) => {
      if (new Date(t.updatedAt).getTime() < twoWeeksAgo) return;
      const ids = t.assignments?.map((a: TaskAssignment) => a.user.id) || t.assignedUsers?.map((u) => u.id) || [];
      ids.forEach((id) => activeUserIdsSet.add(id));
    });
    const inactiveUsers = (users || []).filter((u) => !activeUserIdsSet.has(u.id)).length;
    if (inactiveUsers > 0) {
      alerts.push({
        type: 'info',
        icon: Users,
        title: `${inactiveUsers} utilisateurs inactifs`,
        description: 'Aucune activité sur tâche depuis 2 semaines',
        color: 'text-info',
      });
    }

    if (completionRate < 40) {
      alerts.push({
        type: 'warning',
        icon: TrendingUp,
        title: `Taux de completion bas (${completionRate}%)`,
        description: 'Pourrait indiquer une surcharge',
        color: 'text-warning',
      });
    }

    return alerts;
  }, [allTasks, projects, users, completionRate, now]);

  const topContributors = useMemo(() => {
    const contributorMap: {
      [userId: string]: { name: string; tasksCompleted: number; initials: string };
    } = {};

    allTasks?.forEach((task) => {
      if (task.status === 'DONE') {
        // Support both assignedUsers (legacy) and assignments (current)
        const assignedUsers = task.assignments?.map((a: TaskAssignment) => a.user) || task.assignedUsers || [];
        assignedUsers.forEach((user) => {
          if (!contributorMap[user.id]) {
            contributorMap[user.id] = {
              name: `${user.firstName} ${user.lastName}`,
              tasksCompleted: 0,
              initials: `${user.firstName[0]}${user.lastName[0]}`,
            };
          }
          contributorMap[user.id].tasksCompleted += 1;
        });
      }
    });

    return Object.values(contributorMap)
      .sort((a, b) => b.tasksCompleted - a.tasksCompleted)
      .slice(0, 5);
  }, [allTasks]);

  const activityMetrics = useMemo(
    () => [
      {
        label: 'Tâches complétées',
        value: tasksByStatus.DONE,
        change: `${doneTasksChange >= 0 ? '+' : ''}${doneTasksChange}%`,
        trend: (doneTasksChange >= 0 ? 'up' : 'down') as 'up' | 'down',
      },
      {
        label: 'Projets actifs',
        value: activeProjectsNow,
        change: `${activeProjectsChange >= 0 ? '+' : ''}${activeProjectsChange}%`,
        trend: (activeProjectsChange >= 0 ? 'up' : 'down') as 'up' | 'down',
      },
      {
        label: 'Utilisateurs actifs',
        value: activeUserIds.size,
        change: `${activeUsersChange >= 0 ? '+' : ''}${activeUsersChange}%`,
        trend: (activeUsersChange >= 0 ? 'up' : 'down') as 'up' | 'down',
      },
    ],
    [
      tasksByStatus.DONE,
      activeProjectsNow,
      activeUserIds,
      doneTasksChange,
      activeProjectsChange,
      activeUsersChange,
    ]
  );

  const projectsWithMetrics = useMemo(() => {
    return (projects || []).slice(0, 8).map((p) => {
      const projectTasks = allTasks?.filter((t) => t.projectId === p.id) || [];
      return {
        name: p.name.substring(0, 12),
        tasks: projectTasks.length,
        completed: projectTasks.filter((t) => t.status === 'DONE').length,
        members: p._count?.members ?? p.membersCount ?? p.members?.length ?? 0,
      };
    });
  }, [projects, allTasks]);

  const projectStatusData = useMemo(
    () => [
      { name: 'Planification', value: projectsByStatus.PLANNING },
      { name: 'Actif', value: projectsByStatus.ACTIVE },
      { name: 'Suspendu', value: projectsByStatus.ON_HOLD },
      { name: 'Terminé', value: projectsByStatus.COMPLETED },
      { name: 'Annulé', value: projectsByStatus.CANCELLED },
    ],
    [projectsByStatus]
  );

  const taskStatusData = useMemo(
    () => [
      { name: 'À faire', value: tasksByStatus.TODO, fill: COLORS.warning },
      { name: 'En cours', value: tasksByStatus.DOING, fill: COLORS.primary },
      { name: 'Complété', value: tasksByStatus.DONE, fill: COLORS.success },
    ],
    [tasksByStatus]
  );

  const userRoleData = useMemo(
    () => [
      { name: 'Admin', value: usersByRole.ADMIN },
      { name: 'Manager', value: usersByRole.PROJECT_MANAGER },
      { name: 'Employé', value: usersByRole.EMPLOYEE },
    ],
    [usersByRole]
  );

  if (isLoadingUsers || isLoadingProjects || isLoadingTasks) {
    return <Spinner centered size="lg" label="Chargement du tableau de bord admin..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header + Period Filter */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Tableau de bord Admin</h1>
          <p className="text-text-secondary text-sm mt-1">Vue d&apos;ensemble complète et analytics</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-primary text-white'
                  : 'bg-bg-surface-hover text-text-secondary hover:text-text-primary'
              }`}
            >
              {p === '7d' ? '7j' : p === '30d' ? '30j' : '90j'}
            </button>
          ))}
        </div>
      </div>

      {/* Top KPI Cards with Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users */}
        <Card className="p-6">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-secondary font-medium">Utilisateurs</p>
                <p className="text-3xl font-bold text-primary mt-1">{totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-primary/50" />
            </div>
            <div className="h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userTrends}>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    isAnimationActive={false}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {newUsersThisPeriod > 0 ? (
                <>
                  <ArrowUp className="w-4 h-4 text-success" />
                  <span className="text-success font-medium">
                    +{newUsersThisPeriod} sur {periodDays}j
                  </span>
                </>
              ) : (
                <span className="text-text-secondary">Aucun nouveau sur {periodDays}j</span>
              )}
            </div>
          </div>
        </Card>

        {/* Projects */}
        <Card className="p-6">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-secondary font-medium">Projets</p>
                <p className="text-3xl font-bold text-primary mt-1">{totalProjects}</p>
              </div>
              <FolderOpen className="w-8 h-8 text-primary/50" />
            </div>
            <div className="h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectTrends}>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    isAnimationActive={false}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-secondary">{projectsByStatus.ACTIVE} actifs</span>
            </div>
          </div>
        </Card>

        {/* Tasks */}
        <Card className="p-6">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-secondary font-medium">Tâches</p>
                <p className="text-3xl font-bold text-primary mt-1">{totalTasks}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-primary/50" />
            </div>
            <div className="h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={taskTrends}>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    isAnimationActive={false}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-secondary">{tasksByStatus.DONE} complétées</span>
            </div>
          </div>
        </Card>

        {/* Completion Rate */}
        <Card className="p-6">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-secondary font-medium">Completion</p>
                <p className="text-3xl font-bold text-success mt-1">{completionRate}%</p>
              </div>
              <Zap className="w-8 h-8 text-success/50" />
            </div>
            <div className="w-full bg-bg-surface-hover rounded-full h-2">
              <div
                className="bg-success h-2 rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              {completionRateChange === 0 ? (
                <span className="text-text-secondary">Stable</span>
              ) : completionRateChange > 0 ? (
                <>
                  <ArrowUp className="w-4 h-4 text-success" />
                  <span className="text-success font-medium">+{completionRateChange} pts</span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-4 h-4 text-warning" />
                  <span className="text-warning font-medium">{completionRateChange} pts</span>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Risks & Alerts Section */}
      {risks.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-critical" />
            Alertes et Risques
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {risks.map((risk, idx) => {
              const Icon = risk.icon;
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    risk.type === 'critical'
                      ? 'border-critical/20 bg-critical/5'
                      : risk.type === 'warning'
                      ? 'border-warning/20 bg-warning/5'
                      : 'border-info/20 bg-info/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 ${risk.color} shrink-0 mt-0.5`} />
                    <div className="min-w-0">
                      <p className={`font-medium text-sm ${risk.color}`}>{risk.title}</p>
                      <p className="text-xs text-text-secondary mt-1">{risk.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Activity Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {activityMetrics.map((metric) => (
          <Card key={metric.label} className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-text-secondary font-medium">{metric.label}</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-primary">{metric.value}</p>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    metric.trend === 'up' ? 'text-success' : 'text-critical'
                  }`}
                >
                  {metric.trend === 'up' ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )}
                  {metric.change}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Progression */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Progression des tâches (30j)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={progressionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--text-secondary)" style={{ fontSize: '12px' }} />
              <YAxis stroke="var(--text-secondary)" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
              <Area
                type="monotone"
                dataKey="completed"
                stackId="1"
                fill={COLORS.success}
                stroke={COLORS.success}
              />
              <Area
                type="monotone"
                dataKey="inProgress"
                stackId="1"
                fill={COLORS.primary}
                stroke={COLORS.primary}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Contributors */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Top Contributors
          </h2>
          <div className="space-y-3">
            {topContributors.length > 0 ? (
              topContributors.map((contributor, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-bg-surface-hover"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-white text-xs flex items-center justify-center font-semibold">
                      {contributor.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{contributor.name}</p>
                      <p className="text-xs text-text-secondary">{contributor.tasksCompleted} tâches</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">#{idx + 1}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-text-secondary">Aucun contributeur</p>
            )}
          </div>
        </Card>

        {/* Tasks by Status */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Distribution des tâches</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={taskStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" style={{ fontSize: '12px' }} />
              <YAxis stroke="var(--text-secondary)" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {taskStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Projects by Status */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Statut des projets</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={projectStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                <Cell fill={COLORS.warning} />
                <Cell fill={COLORS.primary} />
                <Cell fill={COLORS.info} />
                <Cell fill={COLORS.success} />
                <Cell fill={COLORS.critical} />
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Users by Role */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Utilisateurs par rôle</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userRoleData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                <Cell fill={COLORS.critical} />
                <Cell fill={COLORS.primary} />
                <Cell fill={COLORS.success} />
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Project Metrics */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Métriques projets</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectsWithMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" style={{ fontSize: '11px' }} />
              <YAxis stroke="var(--text-secondary)" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
              <Bar dataKey="tasks" fill={COLORS.primary} name="Tâches" radius={[8, 8, 0, 0]} />
              <Bar dataKey="completed" fill={COLORS.success} name="Complétées" radius={[8, 8, 0, 0]} />
              <Bar dataKey="members" fill={COLORS.info} name="Membres" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-text-primary">Gestion utilisateurs</h3>
          </div>
          <p className="text-sm text-text-secondary mb-4">Gérer les utilisateurs du système</p>
          <Link href="/settings/users">
            <Button variant="secondary" size="sm" className="w-full">
              Accéder
            </Button>
          </Link>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-text-primary">Paramètres</h3>
          </div>
          <p className="text-sm text-text-secondary mb-4">Configurer l&apos;entreprise</p>
          <Link href="/settings/company">
            <Button variant="secondary" size="sm" className="w-full">
              Accéder
            </Button>
          </Link>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <FolderOpen className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-text-primary">Projets</h3>
          </div>
          <p className="text-sm text-text-secondary mb-4">Voir tous les projets</p>
          <Link href="/projects">
            <Button variant="secondary" size="sm" className="w-full">
              Accéder
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
