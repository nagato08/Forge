'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useJoinProjectByCode,
  useJoinProjectByToken,
} from '@/lib/hooks/useProjects';
import Modal from '@/components/ui/Modal';
import { Button, Input, Alert } from '@/components/ui';

const joinByCodeSchema = z.object({
  projectCode: z.string().min(1, 'Code requis'),
});

const joinByTokenSchema = z.object({
  inviteToken: z.string().min(1, 'Token requis'),
});

type JoinByCodeForm = z.infer<typeof joinByCodeSchema>;
type JoinByTokenForm = z.infer<typeof joinByTokenSchema>;

interface JoinProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinProjectModal({
  isOpen,
  onClose,
}: JoinProjectModalProps) {
  const [joinMethod, setJoinMethod] = useState<'code' | 'token'>('code');

  const joinByCodeMutation = useJoinProjectByCode();
  const joinByTokenMutation = useJoinProjectByToken();

  const {
    register: registerCode,
    handleSubmit: handleSubmitCode,
    formState: { errors: errorsCode },
    reset: resetCode,
  } = useForm<JoinByCodeForm>({
    resolver: zodResolver(joinByCodeSchema),
  });

  const {
    register: registerToken,
    handleSubmit: handleSubmitToken,
    formState: { errors: errorsToken },
    reset: resetToken,
  } = useForm<JoinByTokenForm>({
    resolver: zodResolver(joinByTokenSchema),
  });

  const onSubmitCode = (data: JoinByCodeForm) => {
    console.log('🔗 Joining project by code:', data.projectCode);
    joinByCodeMutation.mutate(data, {
      onSuccess: () => {
        console.log('✅ Joined project by code successfully');
        resetCode();
        onClose();
      },
      onError: (err) => {
        console.error('❌ Join by code error:', err);
      },
    });
  };

  const onSubmitToken = (data: JoinByTokenForm) => {
    console.log('🔗 Joining project by token');
    joinByTokenMutation.mutate(data, {
      onSuccess: () => {
        console.log('✅ Joined project by token successfully');
        resetToken();
        onClose();
      },
      onError: (err) => {
        console.error('❌ Join by token error:', err);
      },
    });
  };

  const isLoading =
    joinByCodeMutation.isPending || joinByTokenMutation.isPending;
  const error = joinByCodeMutation.error || joinByTokenMutation.error;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rejoindre un projet"
      size="md"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={
              joinMethod === 'code'
                ? handleSubmitCode(onSubmitCode)
                : handleSubmitToken(onSubmitToken)
            }
            isLoading={isLoading}
          >
            Rejoindre
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <Alert
            type="error"
            title="Erreur"
            message={error instanceof Error ? error.message : 'Une erreur est survenue'}
          />
        )}

        {/* Method selector */}
        <div className="flex gap-3 border-b border-[var(--border)]">
          <button
            onClick={() => setJoinMethod('code')}
            className={`pb-3 px-3 font-medium transition-colors ${
              joinMethod === 'code'
                ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Code
          </button>
          <button
            onClick={() => setJoinMethod('token')}
            className={`pb-3 px-3 font-medium transition-colors ${
              joinMethod === 'token'
                ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Lien d&apos;invitation
          </button>
        </div>

        {/* Code form */}
        {joinMethod === 'code' && (
          <form onSubmit={handleSubmitCode(onSubmitCode)} className="space-y-4">
            <Input
              label="Code du projet"
              placeholder="ABC123XYZ"
              error={errorsCode.projectCode?.message}
              {...registerCode('projectCode')}
              autoFocus
            />
            <p className="text-xs text-[var(--text-secondary)]">
              Le code du projet vous a été fourni par le responsable du projet.
            </p>
          </form>
        )}

        {/* Token form */}
        {joinMethod === 'token' && (
          <form onSubmit={handleSubmitToken(onSubmitToken)} className="space-y-4">
            <Input
              label="Lien d'invitation"
              placeholder="Collez le token d'invitation"
              error={errorsToken.inviteToken?.message}
              {...registerToken('inviteToken')}
              autoFocus
            />
            <p className="text-xs text-[var(--text-secondary)]">
              Utilisez le lien d'invitation fourni par email ou copié depuis le projet.
            </p>
          </form>
        )}
      </div>
    </Modal>
  );
}
