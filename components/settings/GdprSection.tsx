'use client';

import { useState } from 'react';
import { useExportMyData, useDeleteMyAccount } from '@/lib/hooks';
import { getApiError } from '@/lib/utils/api-error';
import { toast } from '@/lib/stores/toast.store';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { Download, ShieldAlert, Trash2 } from 'lucide-react';

/**
 * RGPD léger : droit d'accès et droit à l'effacement, exercés en libre-service.
 *
 * La suppression n'a pas de garde-fou dédié côté client au-delà de la
 * confirmation : c'est le serveur qui refuse (400) si le compte possède des
 * projets actifs sans remplaçant désigné. Reproduire ici la logique
 * d'impact déjà écrite pour l'admin (`DeleteUserModal`) aurait dupliqué une
 * règle métier pour un cas d'usage plus rare — l'utilisateur qui se
 * supprime lui-même en possédant encore des projets actifs.
 */
export default function GdprSection() {
  const exportMutation = useExportMyData();
  const deleteMutation = useDeleteMyAccount();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleExport = () => {
    exportMutation.mutate(undefined, {
      onSuccess: () => toast.success('Export téléchargé'),
      onError: (err) =>
        toast.error(getApiError(err), { title: 'Export impossible' }),
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(undefined, {
      onError: (err) => {
        toast.error(getApiError(err), { title: 'Suppression impossible' });
        setConfirmOpen(false);
      },
      // onSuccess (déconnexion) est géré dans le hook lui-même : la
      // redirection suit naturellement la perte de session.
    });
  };

  return (
    <>
      <Card className="p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-text-primary">Confidentialité</h3>
          <p className="text-sm text-text-secondary mt-1">
            Conformément au RGPD, vous pouvez récupérer une copie de vos
            données ou demander la suppression de votre compte.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            isLoading={exportMutation.isPending}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter mes données
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer mon compte
          </Button>
        </div>
      </Card>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Supprimer mon compte"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
            >
              Supprimer définitivement
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3 p-4 rounded-lg bg-critical/10 border border-critical/30">
          <ShieldAlert className="w-5 h-5 text-critical shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-text-primary">
              Cette action est irréversible.
            </p>
            <p className="text-text-secondary mt-1">
              Si vous possédez des projets actifs, la suppression sera
              refusée : transférez-en d&apos;abord la propriété depuis les
              paramètres de chaque projet.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
