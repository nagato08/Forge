import { forwardRef } from 'react';

export type SpinnerSize = 'sm' | 'md' | 'lg';
export type SpinnerColor = 'primary' | 'white' | 'gray';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
  color?: SpinnerColor;
  label?: string;
  centered?: boolean;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

const colorClasses: Record<SpinnerColor, string> = {
  primary: 'text-[var(--primary)]',
  white: 'text-white',
  gray: 'text-gray-500',
};

const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  (
    {
      size = 'md',
      color = 'primary',
      label,
      centered = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const spinnerContent = (
      <div
        ref={ref}
        className={`${sizeClasses[size]} animate-spin`}
        role="status"
        aria-label={label || 'Chargement...'}
        {...props}
      >
        <svg
          className={`${colorClasses[color]} w-full h-full`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );

    if (centered) {
      return (
        <div className="flex flex-col items-center justify-center gap-2">
          {spinnerContent}
          {label && (
            <p className="text-sm text-[var(--text-secondary)]">{label}</p>
          )}
        </div>
      );
    }

    return spinnerContent;
  }
);

Spinner.displayName = 'Spinner';

export default Spinner;
