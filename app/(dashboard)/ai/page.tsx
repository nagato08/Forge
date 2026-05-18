'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useInterpretMessage, useExecuteAction, useAIAct, useAnalyzeGantt, useAnalyzePert, useAnalyzeDelays } from '@/lib/hooks/useAI';
import { getApiError } from '@/lib/utils/api-error';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

export default function AIAssistantPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || null;

  const interpretMutation = useInterpretMessage();
  const executeMutation = useExecuteAction();
  const actMutation = useAIAct();
  const analyzeGanttMutation = useAnalyzeGantt(projectId);
  const analyzePertMutation = useAnalyzePert(projectId);
  const analyzeDelaysMutation = useAnalyzeDelays(projectId);

  const [inputMessage, setInputMessage] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: 'user' | 'ai'; message: string; timestamp: Date }>
  >([]);
  const [suggestedAction, setSuggestedAction] = useState<any>(null);
  const [analysisResults, setAnalysisResults] = useState<Record<string, string>>({});

  const handleInterpret = () => {
    if (!inputMessage.trim()) {
      setApiError('Veuillez entrer un message');
      return;
    }

    console.log('🤖 Interpreting message:', inputMessage);
    setApiError(null);
    setSuccessMessage(null);

    interpretMutation.mutate(
      {
        projectId: projectId || 'default',
        message: inputMessage,
      },
      {
        onSuccess: (response) => {
          console.log(' AI interpretation:', response);
          setConversationHistory([
            ...conversationHistory,
            { role: 'user', message: inputMessage, timestamp: new Date() },
          ]);
          setSuggestedAction(response);
        },
        onError: (err) => {
          console.error(' Interpretation error:', getApiError(err));
          setApiError(getApiError(err));
        },
      }
    );
  };

  const handleExecuteAction = () => {
    if (!suggestedAction) return;

    console.log('⚡ Executing action:', suggestedAction);
    setApiError(null);
    setSuccessMessage(null);

    executeMutation.mutate(
      {
        projectId: projectId || 'default',
        action: suggestedAction.action as 'create_task' | 'assign_task',
        params: suggestedAction.params || {},
      },
      {
        onSuccess: (result) => {
          console.log(' Action executed:', result);
          setSuccessMessage('Action exécutée avec succès !');
          setConversationHistory([
            ...conversationHistory,
            {
              role: 'ai',
              message: `Action exécutée : ${suggestedAction.action}`,
              timestamp: new Date(),
            },
          ]);
          setSuggestedAction(null);
          setInputMessage('');
          setTimeout(() => setSuccessMessage(null), 3000);
        },
        onError: (err) => {
          console.error(' Execution error:', getApiError(err));
          setApiError(getApiError(err));
        },
      }
    );
  };

  const handleAct = () => {
    if (!inputMessage.trim()) {
      setApiError('Veuillez entrer un message');
      return;
    }

    console.log('🤖 AI Act (interpret + execute):', inputMessage);
    setApiError(null);
    setSuccessMessage(null);

    actMutation.mutate(
      {
        projectId: projectId || 'default',
        message: inputMessage,
      },
      {
        onSuccess: (response) => {
          console.log(' AI Act result:', response);
          setConversationHistory([
            ...conversationHistory,
            { role: 'user', message: inputMessage, timestamp: new Date() },
            {
              role: 'ai',
              message: `Action complétée : ${response.action}`,
              timestamp: new Date(),
            },
          ]);
          setSuccessMessage('Action exécutée avec succès !');
          setInputMessage('');
          setSuggestedAction(null);
          setTimeout(() => setSuccessMessage(null), 3000);
        },
        onError: (err) => {
          console.error(' Act error:', getApiError(err));
          setApiError(getApiError(err));
        },
      }
    );
  };

  const handleAnalyzeGantt = () => {
    if (!projectId) {
      setApiError('Aucun projet sélectionné');
      return;
    }

    console.log(' Analyzing Gantt:', projectId);
    setApiError(null);

    analyzeGanttMutation.mutate(undefined, {
      onSuccess: (response) => {
        console.log(' Gantt analysis:', response);
        setAnalysisResults({ ...analysisResults, gantt: response.analysis });
        setSuccessMessage('Analyse Gantt terminée!');
        setTimeout(() => setSuccessMessage(null), 3000);
      },
      onError: (err) => {
        console.error(' Gantt analysis error:', getApiError(err));
        setApiError(getApiError(err));
      },
    });
  };

  const handleAnalyzePert = () => {
    if (!projectId) {
      setApiError('Aucun projet sélectionné');
      return;
    }

    console.log('🔗 Analyzing PERT:', projectId);
    setApiError(null);

    analyzePertMutation.mutate(undefined, {
      onSuccess: (response) => {
        console.log(' PERT analysis:', response);
        setAnalysisResults({ ...analysisResults, pert: response.analysis });
        setSuccessMessage('Analyse PERT terminée!');
        setTimeout(() => setSuccessMessage(null), 3000);
      },
      onError: (err) => {
        console.error(' PERT analysis error:', getApiError(err));
        setApiError(getApiError(err));
      },
    });
  };

  const handleAnalyzeDelays = () => {
    if (!projectId) {
      setApiError('Aucun projet sélectionné');
      return;
    }

    console.log(' Analyzing delays:', projectId);
    setApiError(null);

    analyzeDelaysMutation.mutate(undefined, {
      onSuccess: (response) => {
        console.log(' Delays analysis:', response);
        setAnalysisResults({ ...analysisResults, delays: response.analysis });
        setSuccessMessage('Analyse des retards terminée!');
        setTimeout(() => setSuccessMessage(null), 3000);
      },
      onError: (err) => {
        console.error(' Delays analysis error:', getApiError(err));
        setApiError(getApiError(err));
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">🤖 Assistant IA</h1>
        <p className="text-text-secondary text-sm mt-1">
          Utilisez l'IA pour obtenir des suggestions et exécuter des actions automatiquement
        </p>
      </div>

      {successMessage && (
        <Alert
          type="success"
          title="Succès"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {apiError && (
        <Alert
          type="error"
          title="Erreur"
          message={apiError}
          onClose={() => setApiError(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 space-y-4">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary"> Conversation</h2>
          </div>

          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {conversationHistory.length === 0 ? (
              <p className="text-center text-text-secondary py-12">
                Commencez une conversation avec l'assistant IA
              </p>
            ) : (
              conversationHistory.map((entry, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    entry.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs px-4 py-3 rounded-lg ${
                      entry.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-bg-surface-hover text-text-primary'
                    }`}
                  >
                    <p className="text-sm">{entry.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        entry.role === 'user'
                          ? 'text-white/70'
                          : 'text-text-weak'
                      }`}
                    >
                      {entry.timestamp.toLocaleTimeString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 border-t border-border space-y-3">
            <Input
              label="Message"
              placeholder="ex: Créer une tâche pour développer la page d'accueil"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAct();
              }}
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleInterpret}
                isLoading={interpretMutation.isPending}
                className="flex-1"
              >
                 Suggestions
              </Button>
              <Button
                variant="primary"
                onClick={handleAct}
                isLoading={actMutation.isPending}
                className="flex-1"
              >
                ⚡ Exécuter
              </Button>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-text-primary">💡 Suggestions</h3>
          </div>

          <div className="p-6 space-y-4">
            {!suggestedAction ? (
              <p className="text-center text-text-secondary py-8">
                Les suggestions apparaîtront ici
              </p>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium text-text-primary mb-2">Action</p>
                  <p className="text-lg font-semibold text-primary">
                    {suggestedAction.action}
                  </p>
                </div>

                {suggestedAction.params && (
                  <div className="p-4 bg-bg-surface-hover rounded-lg">
                    <p className="text-xs font-medium text-text-secondary mb-2">Paramètres</p>
                    <pre className="text-xs text-text-primary overflow-auto max-h-40">
                      {JSON.stringify(suggestedAction.params, null, 2)}
                    </pre>
                  </div>
                )}

                <Button
                  variant="primary"
                  onClick={handleExecuteAction}
                  isLoading={executeMutation.isPending}
                  className="w-full"
                >
                  ✓ Exécuter
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">📈 Analyses du projet</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={handleAnalyzeGantt}
            isLoading={analyzeGanttMutation.isPending}
            className="w-full"
          >
             Analyser Gantt
          </Button>
          <Button
            onClick={handleAnalyzePert}
            isLoading={analyzePertMutation.isPending}
            className="w-full"
          >
            🔗 Analyser PERT
          </Button>
          <Button
            onClick={handleAnalyzeDelays}
            isLoading={analyzeDelaysMutation.isPending}
            className="w-full"
          >
             Risques de retard
          </Button>
        </div>

        {Object.entries(analysisResults).map(([type, analysis]) => (
          <div key={type} className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h3 className="font-semibold text-text-primary mb-2">
              {type === 'gantt' && ' Analyse Gantt'}
              {type === 'pert' && '🔗 Analyse PERT'}
              {type === 'delays' && ' Risques de retard'}
            </h3>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">{analysis}</p>
          </div>
        ))}
      </Card>

      <Card className="p-6 bg-primary/5 border-primary/20">
        <h3 className="font-semibold text-text-primary mb-3">ℹ Conseils</h3>
        <ul className="text-sm text-text-secondary space-y-2">
          <li>• <span className="font-medium">Suggestions</span>: Voir ce que l'IA propose</li>
          <li>• <span className="font-medium">Exécuter</span>: Interpréter et exécuter en une action</li>
          <li>• <span className="font-medium">Analyses</span>: Insights IA sur vos plannings</li>
          <li>• <span className="font-medium">Rate limit</span>: 5 requêtes par minute</li>
          <li>• <span className="font-medium">Access</span>: Admin ou Owner du projet</li>
        </ul>
      </Card>
    </div>
  );
}
