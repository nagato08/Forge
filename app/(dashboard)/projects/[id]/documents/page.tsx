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
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Card from '@/components/ui/Card';
import { toast } from '@/lib/stores/toast.store';
import {
  FileText,
  Plus,
  Upload,
  Download,
  Edit2,
  Check,
  X,
  Trash2,
  MessageSquare,
  Send,
  Clock,
  Layers,
} from 'lucide-react';

const formatFileSize = (bytes: number | undefined) => {
  if (!bytes || bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR');
};

export default function DocumentsPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: documents, isLoading, error } = useProjectDocuments(projectId);

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
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [commentText, setCommentText] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [renameName, setRenameName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createFileInputRef = useRef<HTMLInputElement>(null);

  const selectedDocQuery = useDocumentById(selectedDocId);
  const doc = selectedDocQuery.data;

  if (isLoading) {
    return <Spinner centered size="lg" label="Chargement des documents..." />;
  }

  if (error) {
    return (
      <div className="p-6 text-text-secondary">Impossible de charger les documents</div>
    );
  }

  console.log('Documents loaded:', documents?.length || 0, 'for project:', projectId);

  const handleCreateDocument = () => {
    if (!newDocName.trim()) {
      toast.error('Veuillez entrer un nom');
      return;
    }
    if (!newDocFile) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    console.log('Creating document:', newDocName, 'with file:', newDocFile.name);

    createMutation.mutate(
      { projectId, name: newDocName },
      {
        onSuccess: (createdDoc) => {
          console.log('Document created:', createdDoc.id, '— uploading version');
          // Set selected doc so detail modal can display it
          setSelectedDocId(createdDoc.id);
          // Upload file as first version
          uploadMutation.mutate(
            { documentId: createdDoc.id, file: newDocFile },
            {
              onSuccess: () => {
                console.log('Version uploaded');
                setNewDocName('');
                setNewDocFile(null);
                setShowCreateModal(false);
                setShowDetailModal(true);
                toast.success('Document créé avec succès');
              },
              onError: (err) => {
                console.error('Upload error:', getApiError(err));
                toast.error(getApiError(err), { title: 'Échec upload' });
              },
            }
          );
        },
        onError: (err) => {
          console.error('Create document error:', getApiError(err));
          toast.error(getApiError(err), { title: 'Échec création' });
        },
      }
    );
  };

  const handleSelectDocument = (docId: string) => {
    console.log('Document selected:', docId);
    setSelectedDocId(docId);
    setShowDetailModal(true);
  };

  const handleRenameDocument = () => {
    if (!doc || !renameName.trim()) return;
    console.log('Renaming document:', doc.id, '->', renameName);

    updateMutation.mutate(
      { documentId: doc.id, name: renameName },
      {
        onSuccess: () => {
          console.log('Document renamed');
          setRenaming(false);
          setRenameName('');
        },
        onError: (err) => {
          console.error('Rename error:', getApiError(err));
          toast.error(getApiError(err), { title: 'Échec' });
        },
      }
    );
  };

  const handleUploadVersion = (file: File) => {
    if (!doc) return;
    console.log('Uploading version for doc:', doc.id, file.name);

    uploadMutation.mutate(
      { documentId: doc.id, file },
      {
        onSuccess: () => {
          console.log('Version uploaded');
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
        onError: (err) => {
          console.error('Upload error:', getApiError(err));
          toast.error(getApiError(err), { title: 'Échec' });
        },
      }
    );
  };

  const handleAddComment = () => {
    if (!doc || !commentText.trim()) return;
    console.log('Adding comment to doc:', doc.id);

    addCommentMutation.mutate(
      { documentId: doc.id, content: commentText },
      {
        onSuccess: () => {
          console.log('Comment added');
          setCommentText('');
        },
        onError: (err) => {
          console.error('Add comment error:', getApiError(err));
          toast.error(getApiError(err), { title: 'Échec' });
        },
      }
    );
  };

  const handleDeleteDocument = () => {
    if (!doc) return;
    console.log('Deleting document:', doc.id);

    deleteMutation.mutate(doc.id, {
      onSuccess: () => {
        console.log('Document deleted');
        setShowDetailModal(false);
        setSelectedDocId(null);
        setConfirmDelete(false);
      },
      onError: (err) => {
        console.error('Delete error:', getApiError(err));
        toast.error(getApiError(err), { title: 'Échec' });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Documents</h1>
            <p className="text-text-secondary text-sm">Gestion des documents du projet</p>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau document
        </Button>
      </div>

      {/* Documents list */}
      {!documents || documents.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <FileText className="w-12 h-12 text-text-weak mx-auto mb-4" />
            <p className="text-text-secondary">
              Aucun document pour le moment. Creez le premier !
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          {documents.map((doc, index) => (
            <div
              key={doc.id}
              className={`flex items-center justify-between p-4 hover:bg-bg-surface-hover cursor-pointer transition-colors ${
                index < documents.length - 1 ? 'border-b border-border' : ''
              }`}
              onClick={() => handleSelectDocument(doc.id)}
            >
              <div className="flex items-center gap-3 flex-1">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-text-primary">{doc.name}</p>
                  <div className="flex items-center gap-3 text-xs text-text-weak mt-0.5">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {doc.versions.length} version{doc.versions.length !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(doc.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Create Document Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewDocName('');
          setNewDocFile(null);
          if (createFileInputRef.current) createFileInputRef.current.value = '';
        }}
        title="Creer un document"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowCreateModal(false);
                setNewDocName('');
                setNewDocFile(null);
                if (createFileInputRef.current) createFileInputRef.current.value = '';
              }}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateDocument}
              isLoading={createMutation.isPending || uploadMutation.isPending}
              disabled={!newDocName.trim() || !newDocFile}
            >
              Creer
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nom du document"
            placeholder="ex: Rapport_Q3.pdf"
            value={newDocName}
            onChange={(e) => setNewDocName(e.currentTarget.value)}
            autoFocus
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Fichier *
            </label>
            <input
              ref={createFileInputRef}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setNewDocFile(file);
                }
              }}
              className="w-full px-3 py-2 border border-border rounded-lg bg-bg-surface text-text-primary text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
            />
            {newDocFile && (
              <p className="text-xs text-text-secondary">
                Fichier sélectionné : <span className="font-medium">{newDocFile.name}</span>
              </p>
            )}
          </div>
        </div>
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
        }}
        title={doc ? doc.name : ''}
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
                  className="flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Supprimer
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
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setRenaming(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
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
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Versions section */}
            <div className="space-y-3 border-t border-border pt-4">
              <h4 className="font-semibold text-text-primary flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Versions
              </h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {doc.versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex items-center justify-between p-3 bg-bg-surface-hover rounded-lg text-sm"
                  >
                    <div>
                      <p className="font-medium text-text-primary">
                        v{version.versionNumber}
                      </p>
                      <p className="text-xs text-text-weak flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatFileSize(version.fileSize)} - {formatDate(version.uploadedAt)}
                      </p>
                    </div>
                    <a
                      href={version.fileUrl}
                      download
                      className="text-primary hover:underline text-xs font-medium flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Telecharger
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
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Uploader nouvelle version
                </Button>
              </div>
            </div>

            {/* Comments section */}
            <div className="space-y-3 border-t border-border pt-4">
              <h4 className="font-semibold text-text-primary flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Commentaires
              </h4>
              <div className="space-y-2 max-h-[150px] overflow-y-auto">
                {doc.comments && doc.comments.length > 0 ? (
                  doc.comments.map((comment) => (
                    <div key={comment.id} className="p-3 bg-bg-surface-hover rounded-lg text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-text-primary">
                          {comment.user.firstName} {comment.user.lastName}
                        </p>
                        <p className="text-text-weak text-xs">
                          {formatDate(comment.createdAt)}
                        </p>
                      </div>
                      <p className="text-text-primary">{comment.content}</p>
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
                  className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-bg-surface text-text-primary placeholder-text-weak focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddComment}
                  isLoading={addCommentMutation.isPending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
