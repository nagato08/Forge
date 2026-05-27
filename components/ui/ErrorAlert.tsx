'use client';

import Alert from './Alert';
import { ApiError } from '@/lib/api/client';

interface ErrorAlertProps {
  error: unknown;
  title?: string;
  className?: string;
}

export default function ErrorAlert({
  error,
  title = 'Erreur',
  className,
}: ErrorAlertProps) {
  if (!error) return null;

  let message = 'Une erreur est survenue';
  let details: string[] | undefined;

  if (error instanceof ApiError) {
    message = error.message;
    if (error.details && error.details.length > 1) {
      details = error.details;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  if (details && details.length > 0) {
    return (
      <Alert type="error" title={title} className={className} closeable={false}>
        <ul className="list-disc list-inside space-y-1 mt-1">
          {details.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </Alert>
    );
  }

  return (
    <Alert
      type="error"
      title={title}
      message={message}
      className={className}
      closeable={false}
    />
  );
}
