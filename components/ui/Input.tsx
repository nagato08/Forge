import { forwardRef } from 'react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2 rounded-lg
            border border-[var(--border)] bg-[var(--bg-surface)]
            text-[var(--text-primary)] placeholder-[var(--text-weak)]
            transition-colors duration-200
            focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20
            disabled:bg-[var(--bg-surface-hover)] disabled:cursor-not-allowed disabled:opacity-60
            ${error ? 'border-[var(--critical)]' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-xs text-[var(--critical)] mt-1.5 flex items-center gap-1">
            <span>⚠</span>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-[var(--text-weak)] mt-1.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
