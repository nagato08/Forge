import api from './client';

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED',
  TASK_COMMENT = 'TASK_COMMENT',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_COMMENT = 'DOCUMENT_COMMENT',
  PROJECT_MESSAGE = 'PROJECT_MESSAGE',
  PROJECT_MEMBER_ADDED = 'PROJECT_MEMBER_ADDED',
  DEADLINE_APPROACHING = 'DEADLINE_APPROACHING',
  DEADLINE_PASSED = 'DEADLINE_PASSED',
}

export interface Notification {
  id: string;
  type: NotificationType;
  content: string;
  userId: string;
  read: boolean;
  relatedTaskId?: string;
  relatedProjectId?: string;
  relatedDocumentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSettings {
  email: boolean;
  realtime: boolean;
}

const BASE_URL = '/notifications';

export const notificationsApi = {
  /**
   * Récupérer les notifications
   * GET /notifications (JWT requis)
   * Query: unreadOnly?: 'true'|'false'
   */
  getNotifications: async (unreadOnly?: boolean): Promise<Notification[]> => {
    const response = await api.get<Notification[]>(`${BASE_URL}`, {
      params: unreadOnly !== undefined ? { unreadOnly } : {},
    });
    return response.data;
  },

  /**
   * Récupérer le compte de notifications non lues
   * GET /notifications/unread-count (JWT requis)
   */
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get<{ count: number }>(
      `${BASE_URL}/unread-count`
    );
    return response.data;
  },

  /**
   * Marquer une notification comme lue
   * PATCH /notifications/:id/read (JWT requis)
   */
  markNotificationAsRead: async (notificationId: string): Promise<void> => {
    await api.patch(`${BASE_URL}/${notificationId}/read`);
  },

  /**
   * Marquer toutes les notifications comme lues
   * PATCH /notifications/read-all (JWT requis)
   */
  markAllNotificationsAsRead: async (): Promise<void> => {
    await api.patch(`${BASE_URL}/read-all`);
  },

  /**
   * Supprimer une notification
   * DELETE /notifications/:id (JWT requis)
   */
  deleteNotification: async (notificationId: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${notificationId}`);
  },

  /**
   * Récupérer les paramètres de notification
   * GET /notification-settings (JWT requis)
   */
  getNotificationSettings: async (): Promise<NotificationSettings> => {
    const response = await api.get<NotificationSettings>(
      '/notification-settings'
    );
    return response.data;
  },

  /**
   * Mettre à jour les paramètres de notification
   * PATCH /notification-settings (JWT requis)
   */
  updateNotificationSettings: async (
    settings: Partial<NotificationSettings>
  ): Promise<NotificationSettings> => {
    const response = await api.patch<NotificationSettings>(
      '/notification-settings',
      settings
    );
    return response.data;
  },
};
