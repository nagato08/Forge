import { forwardRef } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  isSelected?: boolean;
  clickable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      isSelected = false,
      clickable = false,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`
          bg-[var(--bg-surface)] rounded-lg p-4
          border border-[var(--border)]
          transition-all duration-200
          shadow-sm
          ${clickable ? 'cursor-pointer hover:shadow-md hover:bg-[var(--bg-surface-hover)]' : ''}
          ${isSelected ? 'border-[var(--primary)] bg-[var(--primary)]/5' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
