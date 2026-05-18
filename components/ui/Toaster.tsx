'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore, type Toast, type ToastType } from '@/lib/stores/toast.store';

const config: Record<
  ToastType,
  { color: string; Icon: typeof Info }
> = {
  success: { color: 'var(--success)', Icon: CheckCircle2 },
  error: { color: 'var(--critical)', Icon: XCircle },
  warning: { color: 'var(--warning)', Icon: AlertTriangle },
  info: { color: 'var(--info)', Icon: Info },
};

function ToastItem({ toast }: { toast: Toast }) {
  const remove = useToastStore((s) => s.remove);
  const [leaving, setLeaving] = useState(false);
  const { color, Icon } = config[toast.type];

  const close = () => {
    setLeaving(true);
    // Laisse l'animation de sortie se jouer avant retrait du DOM
    window.setTimeout(() => remove(toast.id), 200);
  };

  useEffect(() => {
    if (toast.duration <= 0) return;
    const timer = window.setTimeout(close, toast.duration);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.id, toast.duration]);

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex w-full max-w-sm gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-lg ${
        leaving ? 'animate-toast-out' : 'animate-toast-in'
      }`}
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color }} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {toast.title}
          </p>
        )}
        <p className="text-sm text-[var(--text-secondary)] break-words">
          {toast.message}
        </p>
      </div>
      <button
        onClick={close}
        aria-label="Fermer la notification"
        className="flex-shrink-0 text-[var(--text-weak)] transition-colors hover:text-[var(--text-primary)]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * Conteneur global des toasts. À monter une seule fois (root layout).
 */
export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-3">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
