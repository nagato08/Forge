'use client';

import { useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  useProjectDocuments,
  useDocumentById,
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
  useUploadVersion,
  useAddDocumentComment,
  useDeleteDocumentComment,
} from '@/lib/hooks/useDocuments';
import { getApiError } from '@/lib/utils/api-error';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Card from '@/components/ui/Card';

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR');
};

export default function DocumentsPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: documents, isLoading, error } = useProjectDocuments(projectId);
  const { data: selectedDoc } = useDocumentById(
    useState<string | null>(null)[0]
  );

  const createMutation = useCreateDocument();
  const updateMutation = useUpdateDocument();
  const deleteMutation = useDeleteDocument();
  const uploadMutation = useUploadVersion();
  const addCommentMutation = useAddDocumentComment();
  const deleteCommentMutation = useDeleteDocumentComment();

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [renameName, setRenameName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refetch selected doc when selection changes
  const selectedDocQuery = useDocumentById(selectedDocId);
  const doc = selectedDocQuery.data;

  if (isLoading) {
    return <Spinner centered size="lg" label="Chargement des documents..." />;
  }

  if (error) {
    return (
      <Alert
        type="error"
        title="Erreur"
        message="Impossible de charger les documents"
      />
    );
  }

  console.log('📄 Documents loaded:', documents?.length || 0, 'for project:', projectId);

  const handleCreateDocument = () => {
    if (!newDocName.trim()) return;
    console.log('📡 Creating document:', newDocName);
    setApiError(null);

    createMutation.mutate(
      { projectId, name: newDocName },
      {
        onSuccess: (createdDoc) => {
          console.log('✅ Document created:', createdDoc.id);
          setNewDocName('');
          setShowCreateModal(false);
        },
        onError: (err) => {
          console.error('❌ Create document error:', getApiError(err));
          setApiError(getApiError(err));
        },
      }
    );
  };

  const handleSelectDocument = (docId: string) => {
    console.log('📄 Document selected:', docId);
    setSelectedDocId(docId);
    setShowDetailModal(true);
    setApiError(null);
  };

  const handleRenameDocument = () => {
    if (!doc || !renameName.trim()) return;
    console.log('📝 Renaming document:', doc.id, '→', renameName);
    setApiError(null);

    updateMutation.mutate(
      { documentId: doc.id, name: renameName },
      {
        onSuccess: () => {
          console.log('✅ Document renamed');
          setRenaming(false);
          setRenameName('');
        },
        onError: (err) => {
          console.error('❌ Rename error:', getApiError(err));
          setApiError(getApiError(err));
        },
      }
    );
  };

  const handleUploadVersion = (file: File) => {
    if (!doc) return;
    console.log('📎 Uploading version for doc:', doc.id, file.name);
    setApiError(null);

    uploadMutation.mutate(
      { documentId: doc.id, file },
      {
        onSuccess: () => {
          console.log('✅ Version uploaded');
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
        onError: (err) => {
          console.error('❌ Upload error:', getApiError(err));
          setApiError(getApiError(err));
        },
      }
    );
  };

  const handleAddComment = () => {
    if (!doc || !commentText.trim()) return;
    console.log('💬 Adding comment to doc:', doc.id);
    setApiError(null);

    addCommentMutation.mutate(
      { documentId: doc.id, content: commentText },
      {
        onSuccess: () => {
          console.log('✅ Comment added');
          setCommentText('');
        },
        onError: (err) => {
          console.error('❌ Add comment error:', getApiError(err));
          setApiError(getApiError(err));
        },
      }
    );
  };

  const handleDeleteDocument = () => {
    if (!doc) return;
    console.log('🗑️ Deleting document:', doc.id);
    setApiError(null);

    deleteMutation.mutate(doc.id, {
      onSuccess: () => {
        console.log('✅ Document deleted');
        setShowDetailModal(false);
        setSelectedDocId(null);
        setConfirmDelete(false);
      },
      onError: (err) => {
        console.error('❌ Delete error:', getApiError(err));
        setApiError(getApiError(err));
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          📄 Documents du projet
        </h2>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
        >
          + Nouveau document
        </Button>
      </div>

      {/* Documents list */}
      <Card className="space-y-2">
        {!documents || documents.length === 0 ? (
          <p className="text-center py-12 text-text-secondary">
            Aucun document pour le moment. Crée le premier !
          </p>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 border-b border-border hover:bg-bg-surface-hover cursor-pointer transition-colors"
              onClick={() => handleSelectDocument(doc.id)}
            >
              <div className="flex-1">
                <p className="font-medium text-text-primary">📄 {doc.name}</p>
                <p className="text-xs text-text-weak">
                  {doc.versions.length} version(s) • {formatDate(doc.createdAt)}
                </p>
              </div>
              <div className="text-xs text-text-secondary">
                {doc.versions.length} version{doc.versions.length !== 1 ? 's' : ''}
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Create Document Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewDocName('');
          setApiError(null);
        }}
        title="Créer un document"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowCreateModal(false);
                setNewDocName('');
                setApiError(null);
              }}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateDocument}
              isLoading={createMutation.isPending}
            >
              Créer
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
        <Input
          label="Nom du document"
          placeholder="ex: Rapport_Q3.pdf"
          value={newDocName}
          onChange={(e) => setNewDocName(e.currentTarget.value)}
          autoFocus
        />
      </Modal>

      {/* Document Detail Modal */}
      <Modal
        isOpen={showDetailModal && !!doc}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedDocId(null);
          setRenaming(false);
          setConfirmDelete(false);
          setCommentText('');
          setApiError(null);
        }}
        title={doc ? `📄 ${doc.name}` : ''}
        size="lg"
        footer={
          <div className="flex justify-between items-center">
            {confirmDelete ? (
              <>
                <span className="text-sm text-critical">
                  Confirmer la suppression ?
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDeleteDocument}
                    isLoading={deleteMutation.isPending}
                  >
                    Supprimer
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                >
                  🗑️ Supprimer
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedDocId(null);
                  }}
                >
                  Fermer
                </Button>
              </>
            )}
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

        {doc && (
          <div className="space-y-6">
            {/* Title with rename */}
            <div className="space-y-2">
              {renaming ? (
                <div className="flex gap-2">
                  <Input
                    value={renameName}
                    onChange={(e) => setRenameName(e.currentTarget.value)}
                    placeholder="Nouveau nom"
                    autoFocus
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleRenameDocument}
                    isLoading={updateMutation.isPending}
                  >
                    ✓
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setRenaming(false)}
                  >
                    ✕
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-text-primary">
                    {doc.name}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRenaming(true);
                      setRenameName(doc.name);
                    }}
                  >
                    ✎
                  </Button>
                </div>
              )}
            </div>

            {/* Versions section */}
            <div className="space-y-3 border-t border-border pt-4">
              <h4 className="font-semibold text-text-primary">Versions</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {doc.versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex items-center justify-between p-3 bg-bg-surface-hover rounded text-sm"
                  >
                    <div>
                      <p className="font-medium text-text-primary">
                        v{version.versionNumber}
                      </p>
                      <p className="text-xs text-text-weak">
                        {formatFileSize(version.fileSize)} •{' '}
                        {formatDate(version.uploadedAt)}
                      </p>
                    </div>
                    <a
                      href={version.fileUrl}
                      download
                      className="text-primary hover:underline text-xs font-medium"
                    >
                      Télécharger
                    </a>
                  </div>
                ))}
              </div>

              {/* Upload button */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadVersion(file);
                  }}
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={uploadMutation.isPending}
                >
                  📎 Uploader nouvelle version
                </Button>
              </div>
            </div>

            {/* Comments section */}
            <div className="space-y-3 border-t border-border pt-4">
              <h4 className="font-semibold text-text-primary">Commentaires</h4>
              <div className="space-y-2 max-h-[150px] overflow-y-auto">
                {doc.comments && doc.comments.length > 0 ? (
                  doc.comments.map((comment) => (
                    <div key={comment.id} className="p-2 bg-bg-surface-hover rounded text-sm">
                      <p className="font-medium text-text-primary">
                        {comment.user.firstName} {comment.user.lastName}
                      </p>
                      <p className="text-text-secondary text-xs">
                        {formatDate(comment.createdAt)}
                      </p>
                      <p className="text-text-primary mt-1">
                        {comment.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-text-weak text-sm">Aucun commentaire</p>
                )}
              </div>

              {/* Add comment */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment();
                  }}
                  placeholder="Ajouter un commentaire..."
                  className="flex-1 px-3 py-2 border border-border rounded text-sm bg-bg-surface text-text-primary placeholder-text-weak focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddComment}
                  isLoading={addCommentMutation.isPending}
                >
                  💬
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
