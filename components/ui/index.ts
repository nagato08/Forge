/**
 * Fichier d'index pour exporter tous les composants UI
 * Utilisation : import { Button, Input, Card, ... } from '@/components/ui'
 */

export { default as Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './Button';
export { default as Input, type InputProps } from './Input';
export { default as Textarea, type TextareaProps } from './Textarea';
export { default as Select, type SelectProps, type SelectOption } from './Select';
export { default as Modal, type ModalProps } from './Modal';
export { default as Card, type CardProps } from './Card';
export {
  default as Badge,
  type BadgeProps,
  type BadgeVariant,
  getPriorityBadge,
  getStatusBadge,
  getRoleBadge,
} from './Badge';
export { default as Alert, type AlertProps, type AlertType } from './Alert';
export { default as ErrorAlert } from './ErrorAlert';
export { default as Spinner, type SpinnerProps, type SpinnerSize, type SpinnerColor } from './Spinner';
export { default as Tooltip, type TooltipProps, type TooltipPosition } from './Tooltip';
export { default as Toaster } from './Toaster';
