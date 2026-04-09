'use client';

import { forwardRef, useState } from 'react';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'content'> {
  content: React.ReactNode;
  position?: TooltipPosition;
  children: React.ReactNode;
  delayMs?: number;
}

const positionClasses: Record<TooltipPosition, string> = {
  top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
  bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
  left: 'right-full mr-2 top-1/2 -translate-y-1/2',
  right: 'left-full ml-2 top-1/2 -translate-y-1/2',
};

const arrowClasses: Record<TooltipPosition, string> = {
  top: 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-[var(--bg-primary)]',
  bottom: 'top-[-4px] left-1/2 -translate-x-1/2 border-b-[var(--bg-primary)]',
  left: 'left-[-4px] top-1/2 -translate-y-1/2 border-l-[var(--bg-primary)]',
  right: 'right-[-4px] top-1/2 -translate-y-1/2 border-r-[var(--bg-primary)]',
};

const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      content,
      position = 'top',
      children,
      delayMs = 200,
      className = '',
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    let timeoutId: NodeJS.Timeout;

    const handleMouseEnter = () => {
      timeoutId = setTimeout(() => {
        setIsVisible(true);
      }, delayMs);
    };

    const handleMouseLeave = () => {
      clearTimeout(timeoutId);
      setIsVisible(false);
    };

    return (
      <div
        ref={ref}
        className="relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}

        {isVisible && (
          <div
            className={`
              absolute z-50
              px-2 py-1 text-xs
              bg-[var(--bg-primary)] text-[var(--text-primary)]
              rounded whitespace-nowrap
              pointer-events-none
              ${positionClasses[position]}
              ${className}
            `}
            role="tooltip"
          >
            {content}
            <div
              className={`
                absolute w-0 h-0
                border-4 border-transparent
                ${arrowClasses[position]}
              `}
            />
          </div>
        )}
      </div>
    );
  }
);

Tooltip.displayName = 'Tooltip';

export default Tooltip;
