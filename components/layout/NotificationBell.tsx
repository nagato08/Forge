/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useUnreadCount, useNotifications, useMarkAllNotificationsAsRead } from '@/lib/hooks/useNotifications';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import {
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  FileText,
  User,
  Clock,
  AlertCircle,
  Bell,
} from 'lucide-react';

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
        className="relative p-2 rounded-lg bg-bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-critical text-white text-xs font-bold rounded-full flex items-center justify-center">
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
  const getIcon = (type: string) => {
    const iconProps = 'w-5 h-5 flex-shrink-0';
    const baseColor = notification.read ? 'text-[var(--text-secondary)]' : 'text-[var(--primary)]';

    const iconMap: Record<string, React.ReactNode> = {
      TASK_ASSIGNED: <CheckCircle2 className={`${iconProps} ${baseColor}`} />,
      TASK_STATUS_CHANGED: <ArrowRight className={`${iconProps} ${baseColor}`} />,
      TASK_COMMENT: <MessageSquare className={`${iconProps} ${baseColor}`} />,
      DOCUMENT_UPLOADED: <FileText className={`${iconProps} ${baseColor}`} />,
      DOCUMENT_COMMENT: <MessageSquare className={`${iconProps} ${baseColor}`} />,
      PROJECT_MESSAGE: <MessageSquare className={`${iconProps} ${baseColor}`} />,
      PROJECT_MEMBER_ADDED: <User className={`${iconProps} ${baseColor}`} />,
      DEADLINE_APPROACHING: <Clock className={`${iconProps} ${baseColor}`} />,
      DEADLINE_PASSED: <AlertCircle className={`${iconProps} text-critical`} />,
    };

    return iconMap[type] || <Bell className={`${iconProps} ${baseColor}`} />;
  };

  return (
    <div
      className={`
        p-3 rounded-lg border
        ${
          notification.read
            ? 'bg-bg-surface-hover border-border'
            : 'bg-primary/10 border-primary/30'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          {getIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-primary wrap-break-word">
            {notification.content}
          </p>
          <p className="text-xs text-text-weak mt-1">
            {new Date(notification.createdAt).toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>
    </div>
  );
}
