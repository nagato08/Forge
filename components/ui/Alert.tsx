import { forwardRef } from 'react';
import { Info, CheckCircle2, AlertCircle, X } from 'lucide-react';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  type: AlertType;
  title?: string;
  message?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  closeable?: boolean;
}

const typeClasses: Record<AlertType, { bg: string; border: string; icon: React.ReactNode }> = {
  info: {
    bg: 'bg-info/10',
    border: 'border-info/30',
    icon: <Info className="w-5 h-5" />,
  },
  success: {
    bg: 'bg-success/10',
    border: 'border-success/30',
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  warning: {
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    icon: <AlertCircle className="w-5 h-5" />,
  },
  error: {
    bg: 'bg-critical/10',
    border: 'border-critical/30',
    icon: <AlertCircle className="w-5 h-5" />,
  },
};

const textClasses: Record<AlertType, string> = {
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-critical',
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
          <div className="flex-shrink-0 text-lg text-current">{classes.icon}</div>
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
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export default Alert;
