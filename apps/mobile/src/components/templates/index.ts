/**
 * Templates Index
 * Centralized export for all template components
 */

// Screen Templates
export { default as ScreenTemplate } from './ScreenTemplate';
export { default as Header } from './Header';

// State Templates
export { default as LoadingState } from './LoadingState';
export { default as ErrorState } from './ErrorState';
export { default as EmptyState } from './EmptyState';

// Layout Templates
export { default as ListTemplate } from './ListTemplate';
export { default as FormTemplate } from './FormTemplate';
export { default as ModalTemplate } from './ModalTemplate';

// Re-export types
export type {
  ScreenTemplateProps,
  HeaderProps,
  LoadingStateProps,
  ErrorStateProps,
  EmptyStateProps,
  ListTemplateProps,
  FormTemplateProps,
  ModalTemplateProps,
} from '../../types/components';
