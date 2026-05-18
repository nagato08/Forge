import { forwardRef } from 'react';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  type: AlertType;
  title?: string;
  message?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  closeable?: boolean;
}

const typeClasses: Record<AlertType, { bg: string; border: string; icon: string }> = {
  info: {
    bg: 'bg-[var(--info)]/10',
    border: 'border-[var(--info)]/30',
    icon: '💡',
  },
  success: {
    bg: 'bg-[var(--success)]/10',
    border: 'border-[var(--success)]/30',
    icon: '✓',
  },
  warning: {
    bg: 'bg-[var(--warning)]/10',
    border: 'border-[var(--warning)]/30',
    icon: '',
  },
  error: {
    bg: 'bg-[var(--critical)]/10',
    border: 'border-[var(--critical)]/30',
    icon: '✕',
  },
};

const textClasses: Record<AlertType, string> = {
  info: 'text-[var(--info)]',
  success: 'text-[var(--success)]',
  warning: 'text-[var(--warning)]',
  error: 'text-[var(--critical)]',
};

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      type,
      title,
      message,
      children,
      onClose,
      closeable = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const classes = typeClasses[type];
    const textClass = textClasses[type];

    return (
      <div
        ref={ref}
        className={`
          border rounded-lg p-4
          ${classes.bg} ${classes.border}
          ${className}
        `}
        role="alert"
        {...props}
      >
        <div className="flex gap-3">
          <div className="flex-shrink-0 text-lg">{classes.icon}</div>
          <div className="flex-1">
            {title && (
              <h3 className={`font-semibold ${textClass} mb-1`}>
                {title}
              </h3>
            )}
            {message && (
              <p className={`text-sm ${textClass}`}>
                {message}
              </p>
            )}
            {children && (
              <div className={`text-sm ${textClass}`}>
                {children}
              </div>
            )}
          </div>
          {closeable && onClose && (
            <button
              onClick={onClose}
              className={`flex-shrink-0 ${textClass} hover:opacity-70 transition-opacity`}
              aria-label="Close alert"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export default Alert;
