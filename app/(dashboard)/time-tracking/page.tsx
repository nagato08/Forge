'use client';

import { useState, useEffect, useRef } from 'react';
import {
  useActiveTimer,
  useStartTimer,
  useStopTimer,
  useMyEntries,
  useMyTimeStats,
  useAddManualEntry,
  useDeleteTimeEntry,
} from '@/lib/hooks';
import { getApiError } from '@/lib/utils/api-error';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Card from '@/components/ui/Card';

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR');
};

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function TimeTrackingPage() {
  const { data: activeTimer, isLoading: isLoadingTimer } = useActiveTimer();
  const { data: entries, isLoading: isLoadingEntries } = useMyEntries();
  const { data: stats } = useMyTimeStats();

  const startMutation = useStartTimer();
  const stopMutation = useStopTimer();
  const addManualMutation = useAddManualEntry();
  const deleteMutation = useDeleteTimeEntry();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showManualModal, setShowManualModal] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [manualForm, setManualForm] = useState({
    taskId: '',
    startTime: '',
    endTime: '',
    duration: '',
  });

  // Update elapsed time for active timer
  useEffect(() => {
    if (activeTimer && activeTimer.startTime) {
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - new Date(activeTimer.startTime).getTime()) / 1000
        );
        setElapsedSeconds(elapsed);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setElapsedSeconds(0);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [activeTimer]);

  const handleStartTimer = () => {
    if (!manualForm.taskId.trim()) {
      setApiError('Veuillez sélectionner une tâche');
      return;
    }
    console.log('⏱️ Starting timer for task:', manualForm.taskId);
    setApiError(null);

    startMutation.mutate(manualForm.taskId, {
      onSuccess: (timer) => {
        console.log('✅ Timer started:', timer.id);
        setManualForm({ ...manualForm, taskId: '' });
      },
      onError: (err) => {
        console.error('❌ Start timer error:', getApiError(err));
        setApiError(getApiError(err));
      },
    });
  };

  const handleStopTimer = () => {
    console.log('⏱️ Stopping active timer');
    setApiError(null);

    stopMutation.mutate(undefined, {
      onSuccess: (entry) => {
        console.log('✅ Timer stopped:', entry.id);
      },
      onError: (err) => {
        console.error('❌ Stop timer error:', getApiError(err));
        setApiError(getApiError(err));
      },
    });
  };

  const handleAddManualEntry = () => {
    if (!manualForm.taskId.trim()) {
      setApiError('Veuillez sélectionner une tâche');
      return;
    }
    if (!manualForm.startTime) {
      setApiError('Veuillez entrer une heure de début');
      return;
    }

    console.log('📝 Adding manual time entry:', manualForm.taskId);
    setApiError(null);

    const data: any = {
      taskId: manualForm.taskId,
      startTime: manualForm.startTime,
    };

    if (manualForm.endTime) {
      data.endTime = manualForm.endTime;
    } else if (manualForm.duration) {
      data.duration = parseInt(manualForm.duration);
    }

    addManualMutation.mutate(data, {
      onSuccess: () => {
        console.log('✅ Manual entry added');
        setManualForm({ taskId: '', startTime: '', endTime: '', duration: '' });
        setShowManualModal(false);
      },
      onError: (err) => {
        console.error('❌ Add manual entry error:', getApiError(err));
        setApiError(getApiError(err));
      },
    });
  };

  const handleDeleteEntry = (entryId: string) => {
    console.log('🗑️ Deleting time entry:', entryId);
    setApiError(null);

    deleteMutation.mutate(entryId, {
      onSuccess: () => {
        console.log('✅ Entry deleted');
      },
      onError: (err) => {
        console.error('❌ Delete entry error:', getApiError(err));
        setApiError(getApiError(err));
      },
    });
  };

  if (isLoadingTimer || isLoadingEntries) {
    return <Spinner centered size="lg" label="Chargement du suivi du temps..." />;
  }

  console.log('⏱️ Time tracking loaded:', entries?.length || 0, 'entries');

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  return (
    <div className="space-y-6">
      {/* Active Timer Card */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">
              ⏱️ Chronomètre actif
            </h2>
            {activeTimer && (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/20 text-primary">
                En cours
              </span>
            )}
          </div>

          {activeTimer ? (
            <div className="space-y-4">
              {/* Task info */}
              <div className="p-3 bg-bg-surface rounded">
                <p className="text-sm text-text-secondary">Tâche</p>
                <p className="text-lg font-semibold text-text-primary">
                  {activeTimer.task?.title || 'Tâche inconnue'}
                </p>
              </div>

              {/* Timer display */}
              <div className="text-center">
                <div className="text-5xl font-bold text-primary font-mono">
                  {String(hours).padStart(2, '0')}:
                  {String(minutes).padStart(2, '0')}:
                  {String(seconds).padStart(2, '0')}
                </div>
                <p className="text-xs text-text-secondary mt-2">
                  Démarré : {formatTime(activeTimer.startTime)}
                </p>
              </div>

              {/* Stop button */}
              <Button
                variant="danger"
                size="lg"
                onClick={handleStopTimer}
                isLoading={stopMutation.isPending}
                className="w-full"
              >
                ⏸️ Arrêter
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-text-secondary py-4">
                Aucun chronomètre actif
              </p>
              <div className="space-y-2">
                <Input
                  label="ID de tâche"
                  placeholder="ex: task-123"
                  value={manualForm.taskId}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, taskId: e.target.value })
                  }
                />
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleStartTimer}
                  isLoading={startMutation.isPending}
                  className="w-full"
                >
                  ▶️ Démarrer
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Error Alert */}
      {apiError && (
        <Alert
          type="error"
          title="Erreur"
          message={apiError}
          onClose={() => setApiError(null)}
        />
      )}

      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total time */}
          <Card className="p-4">
            <p className="text-xs text-text-secondary font-medium mb-1">
              Temps total
            </p>
            <p className="text-2xl font-bold text-primary">
              {formatDuration(stats.totalMinutes)}
            </p>
          </Card>

          {/* By task */}
          <Card className="p-4">
            <p className="text-xs text-text-secondary font-medium mb-2">
              Top tâche
            </p>
            {stats.byTask.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-text-primary truncate">
                  {stats.byTask[0].taskTitle}
                </p>
                <p className="text-lg font-bold text-text-secondary">
                  {formatDuration(stats.byTask[0].totalMinutes)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-text-weak">Aucune tâche</p>
            )}
          </Card>

          {/* By project */}
          <Card className="p-4">
            <p className="text-xs text-text-secondary font-medium mb-2">
              Top projet
            </p>
            {stats.byProject.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-text-primary truncate">
                  {stats.byProject[0].projectName}
                </p>
                <p className="text-lg font-bold text-text-secondary">
                  {formatDuration(stats.byProject[0].totalMinutes)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-text-weak">Aucun projet</p>
            )}
          </Card>
        </div>
      )}

      {/* Time Entries Section */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">
            📋 Historique du temps
          </h3>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowManualModal(true)}
          >
            + Saisie manuelle
          </Button>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {!entries || entries.length === 0 ? (
            <p className="text-center py-8 text-text-secondary">
              Aucune entrée de temps pour le moment
            </p>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 border-b border-border hover:bg-bg-surface-hover transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-text-primary">
                        {entry.task?.title || 'Tâche inconnue'}
                      </p>
                      <p className="text-xs text-text-weak">
                        {formatDate(entry.startTime)} •{' '}
                        {formatTime(entry.startTime)}
                        {entry.endTime ? ` - ${formatTime(entry.endTime)}` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-text-primary">
                      {entry.duration ? formatDuration(entry.duration) : '—'}
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteEntry(entry.id)}
                    isLoading={deleteMutation.isPending}
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Manual Entry Modal */}
      <Modal
        isOpen={showManualModal}
        onClose={() => {
          setShowManualModal(false);
          setManualForm({ taskId: '', startTime: '', endTime: '', duration: '' });
          setApiError(null);
        }}
        title="Saisie manuelle de temps"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowManualModal(false);
                setManualForm({
                  taskId: '',
                  startTime: '',
                  endTime: '',
                  duration: '',
                });
                setApiError(null);
              }}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddManualEntry}
              isLoading={addManualMutation.isPending}
            >
              Ajouter
            </Button>
          </div>
        }
      >
        {apiError && (
          <Alert
            type="error"
            title="Erreur"
            message={apiError}
            onClose={() => setApiError(null)}
          />
        )}

        <div className="space-y-4">
          <Input
            label="ID de tâche"
            placeholder="ex: task-123"
            value={manualForm.taskId}
            onChange={(e) =>
              setManualForm({ ...manualForm, taskId: e.target.value })
            }
          />

          <Input
            label="Heure de début"
            type="datetime-local"
            value={manualForm.startTime}
            onChange={(e) =>
              setManualForm({ ...manualForm, startTime: e.target.value })
            }
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Durée (OU heure de fin)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Heure de fin (optionnel)"
                type="datetime-local"
                value={manualForm.endTime}
                onChange={(e) =>
                  setManualForm({ ...manualForm, endTime: e.target.value })
                }
              />
              <Input
                label="Durée en minutes (optionnel)"
                type="number"
                placeholder="ex: 120"
                value={manualForm.duration}
                onChange={(e) =>
                  setManualForm({ ...manualForm, duration: e.target.value })
                }
              />
            </div>
            <p className="text-xs text-text-weak">
              Spécifiez soit l'heure de fin, soit la durée
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
