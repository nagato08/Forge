'use client';

import { useProjects, useMyTasks } from '@/lib/hooks';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function ProjectManagerDashboardPage() {
  const { data: projects, isLoading: isLoadingProjects } = useProjects();
  const { data: myTasks, isLoading: isLoadingTasks } = useMyTasks();

  if (isLoadingProjects || isLoadingTasks) {
    return <Spinner centered size="lg" label="Chargement du tableau de bord..." />;
  }

  console.log(' Project manager dashboard loaded:', {
    projects: projects?.length || 0,
    tasks: myTasks?.length || 0,
  });

  const tasksByStatus = {
    TODO: myTasks?.filter((t) => t.status === 'TODO').length || 0,
    DOING: myTasks?.filter((t) => t.status === 'DOING').length || 0,
    DONE: myTasks?.filter((t) => t.status === 'DONE').length || 0,
  };

  const recentProjects = projects?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">
           Tableau de bord Manager
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Vue d&apos;ensemble de vos projets et tâches assignées
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* My Projects */}
        <Card className="p-6">
          <div className="space-y-3">
            <p className="text-sm text-text-secondary font-medium">📋 Mes projets</p>
            <p className="text-3xl font-bold text-primary">
              {projects?.length || 0}
            </p>
            <p className="text-xs text-text-weak">
              {projects?.filter((p) => p.status === 'ACTIVE').length || 0} actifs
            </p>
          </div>
        </Card>

        {/* My Tasks */}
        <Card className="p-6">
          <div className="space-y-3">
            <p className="text-sm text-text-secondary font-medium">✓ Mes tâches</p>
            <p className="text-3xl font-bold text-primary">
              {myTasks?.length || 0}
            </p>
            <p className="text-xs text-text-weak">
              {tasksByStatus.DOING} en cours
            </p>
          </div>
        </Card>

        {/* In Progress */}
        <Card className="p-6">
          <div className="space-y-3">
            <p className="text-sm text-text-secondary font-medium">⏳ En cours</p>
            <p className="text-3xl font-bold text-warning">
              {tasksByStatus.DOING}
            </p>
            <p className="text-xs text-text-weak">
              {tasksByStatus.TODO} à faire
            </p>
          </div>
        </Card>

        {/* Completion */}
        <Card className="p-6">
          <div className="space-y-3">
            <p className="text-sm text-text-secondary font-medium">📈 Complétées</p>
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
      </div>

      {/* Projects Grid */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            📋 Mes projets récents
          </h2>
          <Link href="/projects" onClick={() => console.log('🔗 Navigating to all projects')}>
            <Button variant="secondary" size="sm">
              Voir tous
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          {!recentProjects || recentProjects.length === 0 ? (
            <p className="col-span-2 text-center py-8 text-text-secondary">
              Aucun projet. Commencez par en créer un !
            </p>
          ) : (
            recentProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}/kanban`}
                onClick={() => console.log('🔗 Opening project kanban:', project.id, project.name)}
              >
                <div className="p-4 rounded-lg border border-border hover:border-primary hover:bg-bg-surface-hover transition-all cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-text-primary">
                        {project.name}
                      </p>
                      <p className="text-xs text-text-weak mt-1">
                        {project.description
                          ? project.description.substring(0, 60) + '...'
                          : 'Pas de description'}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      {project.status || 'ACTIVE'}
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-text-secondary">
                    Créé : {new Date(project.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </Card>

      {/* My Tasks Overview */}
      <Card className="space-y-4">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            📝 Tâches assignées
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
              <div className="w-full bg-border rounded-full h-2">
                <div
                  className="bg-warning h-2 rounded-full"
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
              <div className="w-full bg-border rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
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
              <div className="w-full bg-border rounded-full h-2">
                <div
                  className="bg-success h-2 rounded-full"
                  style={{
                    width: myTasks
                      ? `${(tasksByStatus.DONE / myTasks.length) * 100}%`
                      : '0%',
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <Link href="/my-tasks" onClick={() => console.log('🔗 Navigating to my tasks details')}>
              <Button variant="primary" size="sm" className="w-full">
                Voir mes tâches en détail
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm font-medium text-text-primary mb-3">➕ Actions</p>
          <Link href="/projects" onClick={() => console.log('🔗 Navigating to projects (quick action)')}>
            <Button variant="secondary" size="sm" className="w-full">
              Nouveau projet
            </Button>
          </Link>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-text-primary mb-3"> Suivi</p>
          <Button variant="secondary" size="sm" className="w-full" onClick={() => console.log(' View reports clicked')}>
            Voir rapports
          </Button>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-text-primary mb-3">⏲ Temps</p>
          <Link href="/time-tracking" onClick={() => console.log('🔗 Navigating to time tracking')}>
            <Button variant="secondary" size="sm" className="w-full">
              Suivi du temps
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
