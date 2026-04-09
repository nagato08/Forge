/**
 * Fichier d'index pour exporter tous les APIs
 * Utilisation : import { authApi, projectsApi, ... } from '@/lib/api'
 */

export { authApi } from './auth.api';
export { projectsApi } from './projects.api';
export { tasksApi } from './tasks.api';
export { planningApi } from './planning.api';
export { chatApi, type ChatMessage } from './chat.api';
export {
  documentsApi,
  type Document,
  type DocumentVersion,
  type DocumentComment,
} from './documents.api';
export {
  notificationsApi,
  type Notification,
  type NotificationSettings,
  NotificationType,
} from './notifications.api';
export {
  timeEntriesApi,
  type TimeEntry,
  type TimeStats,
} from './time-entries.api';
