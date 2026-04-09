/**
 * Fichier d'index pour exporter tous les hooks
 * Utilisation : import { useAuth, useProjects, ... } from '@/lib/hooks'
 */

export {
  useLogin,
  useRegister,
  useLogout,
  useProfile,
  useUsers,
  useDeleteUser,
  useUpdateProfile,
  useCreateUser,
  useRequestPasswordReset,
  useVerifyResetToken,
  useResetPassword,
} from './useAuth';

export {
  useProjects,
  useProjectById,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useAddProjectMember,
  useRemoveProjectMember,
  useJoinProjectByCode,
  useJoinProjectByToken,
  useRegenerateInviteToken,
} from './useProjects';

export {
  useTasks,
  useMyTasks,
  useTaskById,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useUpdateTaskStatus,
  useAssignTask,
  useUnassignTask,
  useAddTaskDependency,
  useRemoveTaskDependency,
  useAddTaskComment,
  useDeleteTaskComment,
} from './useTasks';

export {
  useGantt,
  usePert,
  useBurndown,
  useWorkload,
  useStatusDonut,
  useEisenhower,
} from './usePlanning';

export {
  useNotifications,
  useUnreadCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useNotificationSettings,
  useUpdateNotificationSettings,
} from './useNotifications';

export {
  useMessages,
  useSendMessage,
} from './useChat';

export {
  useProjectDocuments,
  useMyDocuments,
  useDocumentById,
  useDocumentVersions,
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
  useUploadVersion,
  useAddDocumentComment,
  useDeleteDocumentComment,
} from './useDocuments';

export {
  useActiveTimer,
  useStartTimer,
  useStopTimer,
  useAddManualEntry,
  useMyEntries,
  useMyTimeStats,
  useProjectTimeStats,
  useDeleteTimeEntry,
} from './useTimeTracking';

export {
  useSocketEvent,
  useSocketEvents,
  useSocketConnected,
} from './useSocket';

export {
  useCompanySettings,
  useUpdateCompanySettings,
} from './useCompanySettings';

export {
  useInterpretMessage,
  useExecuteAction,
  useAIAct,
  useAnalyzeGantt,
  useAnalyzePert,
  useAnalyzeDelays,
} from './useAI';

export {
  useProjectMessages,
  useSendProjectMessage,
  useDeleteMessage,
  useMessageById,
} from './useMessages';
