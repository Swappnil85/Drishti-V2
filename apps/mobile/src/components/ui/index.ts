/**
 * UI Components Index
 * Centralized export for all UI components
 */

// Core Components
export { default as Button } from './Button';
export { default as Text } from './Text';
export { default as Input } from './Input';
export { default as Card } from './Card';
export { default as Icon } from './Icon';

// Layout Components
export { default as Container } from './Container';
export { default as Flex } from './Flex';

// Display Components
export { default as Avatar } from './Avatar';
export { default as Badge } from './Badge';

// Re-export types
export type {
  ButtonProps,
  TextProps,
  InputProps,
  CardProps,
  IconProps,
  ContainerProps,
  FlexProps,
  AvatarProps,
  BadgeProps,
} from '../../types/components';
