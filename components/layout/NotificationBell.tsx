'use client';

import { useState } from 'react';
import { useUnreadCount, useNotifications, useMarkAllNotificationsAsRead } from '@/lib/hooks/useNotifications';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';

export function NotificationBell() {
  const [panelOpen, setPanelOpen] = useState(false);
  const { data: unreadData } = useUnreadCount();
  const { data: notifications, isLoading } = useNotifications(false);
  const markAllReadMutation = useMarkAllNotificationsAsRead();

  const unreadCount = unreadData?.count || 0;

  const handleMarkAllAsRead = () => {
    markAllReadMutation.mutate();
  };

  return (
    <>
      {/* Bell button */}
      <button
        onClick={() => setPanelOpen(true)}
        className="relative p-2 rounded-lg bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        aria-label="Notifications"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-[var(--critical)] text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification panel modal */}
      <Modal
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="Notifications"
        size="md"
        footer={
          notifications && notifications.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAllAsRead}
              isLoading={markAllReadMutation.isPending}
            >
              Marquer tout comme lu
            </Button>
          )
        }
      >
        {isLoading ? (
          <Spinner centered label="Chargement des notifications..." />
        ) : notifications && notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <NotificationItem key={notif.id} notification={notif} />
            ))}
          </div>
        ) : (
          <Alert type="info" message="Aucune notification" />
        )}
      </Modal>
    </>
  );
}

function NotificationItem({ notification }: { notification: any }) {
  const typeIcons: Record<string, string> = {
    TASK_ASSIGNED: '✓',
    TASK_STATUS_CHANGED: '→',
    TASK_COMMENT: '💬',
    DOCUMENT_UPLOADED: '📄',
    DOCUMENT_COMMENT: '💬',
    PROJECT_MESSAGE: '💬',
    PROJECT_MEMBER_ADDED: '👤',
    DEADLINE_APPROACHING: '⏰',
    DEADLINE_PASSED: '⚠️',
  };

  const icon = typeIcons[notification.type] || '📢';

  return (
    <div
      className={`
        p-3 rounded-lg border
        ${
          notification.read
            ? 'bg-[var(--bg-surface-hover)] border-[var(--border)]'
            : 'bg-[var(--primary)]/10 border-[var(--primary)]/30'
        }
      `}
    >
      <div className="flex items-start gap-2">
        <span className="text-lg flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--text-primary)] break-words">
            {notification.content}
          </p>
          <p className="text-xs text-[var(--text-weak)] mt-1">
            {new Date(notification.createdAt).toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>
    </div>
  );
}
