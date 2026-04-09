'use client';

import { useMyTasks, useMyTimeStats } from '@/lib/hooks';
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

export default function EmployeeDashboardPage() {
  const { data: myTasks, isLoading: isLoadingTasks } = useMyTasks();
  const { data: timeStats, isLoading: isLoadingStats } = useMyTimeStats();

  if (isLoadingTasks || isLoadingStats) {
    return <Spinner centered size="lg" label="Chargement de votre tableau de bord..." />;
  }

  console.log('👥 Employee dashboard loaded:', {
    tasks: myTasks?.length || 0,
    totalTime: timeStats?.totalMinutes || 0,
  });

  const tasksByStatus = {
    TODO: myTasks?.filter((t) => t.status === 'TODO').length || 0,
    DOING: myTasks?.filter((t) => t.status === 'DOING').length || 0,
    DONE: myTasks?.filter((t) => t.status === 'DONE').length || 0,
  };

  const recentTasks = myTasks?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">
          👥 Mon espace de travail
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Vue d&apos;ensemble de vos tâches et productivité
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <Card className="p-6">
          <div className="space-y-3">
            <p className="text-sm text-text-secondary font-medium">📋 Tâches</p>
            <p className="text-3xl font-bold text-primary">
              {myTasks?.length || 0}
            </p>
            <p className="text-xs text-text-weak">
              {tasksByStatus.DOING} en cours
            </p>
          </div>
        </Card>

        {/* To Do */}
        <Card className="p-6">
          <div className="space-y-3">
            <p className="text-sm text-text-secondary font-medium">⏳ À faire</p>
            <p className="text-3xl font-bold text-warning">
              {tasksByStatus.TODO}
            </p>
            <p className="text-xs text-text-weak">
              en attente
            </p>
          </div>
        </Card>

        {/* Done */}
        <Card className="p-6">
          <div className="space-y-3">
            <p className="text-sm text-text-secondary font-medium">✓ Complétées</p>
            <p className="text-3xl font-bold text-success">
              {tasksByStatus.DONE}
            </p>
            <p className="text-xs text-text-weak">
              {myTasks && myTasks.length > 0
                ? Math.round((tasksByStatus.DONE / myTasks.length) * 100)
                : 0}
              % du total
            </p>
          </div>
        </Card>

        {/* Time Tracked */}
        <Card className="p-6">
          <div className="space-y-3">
            <p className="text-sm text-text-secondary font-medium">⏱️ Temps suivi</p>
            <p className="text-3xl font-bold text-primary">
              {timeStats ? formatDuration(timeStats.totalMinutes) : '—'}
            </p>
            <p className="text-xs text-text-weak">
              cette semaine
            </p>
          </div>
        </Card>
      </div>

      {/* Task Status Overview */}
      <Card className="space-y-4">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            📊 État de mes tâches
          </h2>
        </div>

        <div className="p-6 space-y-4">
          {/* Status Bars */}
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">À faire</span>
                <span className="font-semibold text-text-primary">
                  {tasksByStatus.TODO}
                </span>
              </div>
              <div className="w-full bg-border rounded-full h-3">
                <div
                  className="bg-warning h-3 rounded-full"
                  style={{
                    width: myTasks
                      ? `${(tasksByStatus.TODO / myTasks.length) * 100}%`
                      : '0%',
                  }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">En cours</span>
                <span className="font-semibold text-text-primary">
                  {tasksByStatus.DOING}
                </span>
              </div>
              <div className="w-full bg-border rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full"
                  style={{
                    width: myTasks
                      ? `${(tasksByStatus.DOING / myTasks.length) * 100}%`
                      : '0%',
                  }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Complétées</span>
                <span className="font-semibold text-text-primary">
                  {tasksByStatus.DONE}
                </span>
              </div>
              <div className="w-full bg-border rounded-full h-3">
                <div
                  className="bg-success h-3 rounded-full"
                  style={{
                    width: myTasks
                      ? `${(tasksByStatus.DONE / myTasks.length) * 100}%`
                      : '0%',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Tasks */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            📝 Tâches récentes
          </h2>
          <Link href="/my-tasks" onClick={() => console.log('🔗 Navigating to all my tasks')}>
            <Button variant="secondary" size="sm">
              Voir toutes
            </Button>
          </Link>
        </div>

        <div className="space-y-0 max-h-100 overflow-y-auto">
          {!recentTasks || recentTasks.length === 0 ? (
            <p className="text-center py-8 text-text-secondary">
              Aucune tâche assignée
            </p>
          ) : (
            recentTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 border-b border-border hover:bg-bg-surface-hover transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-text-primary">
                    {task.title}
                  </p>
                  <p className="text-xs text-text-weak mt-1">
                    ID projet : {task.projectId}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      task.status === 'TODO'
                        ? 'bg-warning/10 text-warning'
                        : task.status === 'DOING'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-success/10 text-success'
                    }`}
                  >
                    {task.status === 'TODO'
                      ? 'À faire'
                      : task.status === 'DOING'
                        ? 'En cours'
                        : 'Complétée'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Time Stats */}
      {timeStats && (
        <Card className="space-y-4">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary">
              ⏱️ Temps suivi par projet
            </h2>
          </div>

          <div className="p-6">
            {timeStats.byProject.length === 0 ? (
              <p className="text-center text-text-secondary py-4">
                Aucun temps suivi pour le moment
              </p>
            ) : (
              <div className="space-y-3">
                {timeStats.byProject.map((proj) => (
                  <div
                    key={proj.projectId}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-text-secondary">
                      {proj.projectName}
                    </span>
                    <span className="font-semibold text-text-primary">
                      {formatDuration(proj.totalMinutes)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm font-medium text-text-primary mb-3">📋 Mes tâches</p>
          <Link href="/my-tasks" onClick={() => console.log('🔗 Navigating to my tasks (quick action)')}>
            <Button variant="secondary" size="sm" className="w-full">
              Voir toutes
            </Button>
          </Link>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-text-primary mb-3">⏱️ Temps</p>
          <Link href="/time-tracking" onClick={() => console.log('🔗 Navigating to time tracking (quick action)')}>
            <Button variant="secondary" size="sm" className="w-full">
              Suivi du temps
            </Button>
          </Link>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-text-primary mb-3">⚙️ Profil</p>
          <Link href="/settings/profile" onClick={() => console.log('🔗 Navigating to profile settings')}>
            <Button variant="secondary" size="sm" className="w-full">
              Paramètres
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
