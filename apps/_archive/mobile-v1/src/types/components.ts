/**
 * Component Types and Interfaces
 * Shared types for UI components
 */

import { ReactNode } from 'react';
import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

// Base Component Props
export interface BaseComponentProps {
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: any; // Using any to avoid React Native type conflicts
}

// Style Props
export interface StyleProps {
  style?: ViewStyle | TextStyle | ImageStyle;
  className?: string;
}

// Size Variants
export type SizeVariant =
  | 'xs'
  | 'sm'
  | 'base'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl';

// Color Variants
export type ColorVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral'
  | 'financial';

// Button Types
export interface ButtonProps extends BaseComponentProps, StyleProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: SizeVariant;
  color?: ColorVariant;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

// Input Types
export interface InputProps extends BaseComponentProps, StyleProps {
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  variant?: 'default' | 'filled' | 'outline';
  size?: SizeVariant;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  multiline?: boolean;
  numberOfLines?: number;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

// Card Types
export interface CardProps extends BaseComponentProps, StyleProps {
  children: ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: SizeVariant;
  margin?: SizeVariant;
  onPress?: () => void;
  disabled?: boolean;
}

// Text Types
export interface TextProps extends BaseComponentProps, StyleProps {
  children: ReactNode;
  variant?:
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'body1'
    | 'body2'
    | 'caption'
    | 'overline';
  color?: ColorVariant | string;
  align?: 'left' | 'center' | 'right' | 'justify';
  weight?: 'normal' | 'medium' | 'semiBold' | 'bold';
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
}

// Icon Types
export interface IconProps extends BaseComponentProps, StyleProps {
  name: string;
  size?: number | SizeVariant;
  color?: ColorVariant | string;
  library?: 'Ionicons' | 'MaterialIcons' | 'FontAwesome' | 'Feather';
}

// Avatar Types
export interface AvatarProps extends BaseComponentProps, StyleProps {
  source?: { uri: string } | number;
  name?: string;
  size?: SizeVariant;
  variant?: 'circle' | 'square' | 'rounded';
  fallbackIcon?: string;
  onPress?: () => void;
}

// Badge Types
export interface BadgeProps extends BaseComponentProps, StyleProps {
  children?: ReactNode;
  variant?: 'filled' | 'outline' | 'dot';
  color?: ColorVariant;
  size?: SizeVariant;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

// Chip Types
export interface ChipProps extends BaseComponentProps, StyleProps {
  children: ReactNode;
  variant?: 'filled' | 'outline';
  color?: ColorVariant;
  size?: SizeVariant;
  selected?: boolean;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onPress?: () => void;
  onDelete?: () => void;
}

// Switch Types
export interface SwitchProps extends BaseComponentProps, StyleProps {
  value: boolean;
  disabled?: boolean;
  color?: ColorVariant;
  size?: SizeVariant;
  onValueChange: (value: boolean) => void;
}

// Checkbox Types
export interface CheckboxProps extends BaseComponentProps, StyleProps {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  color?: ColorVariant;
  size?: SizeVariant;
  label?: string;
  onPress: (checked: boolean) => void;
}

// Radio Types
export interface RadioProps extends BaseComponentProps, StyleProps {
  selected: boolean;
  disabled?: boolean;
  color?: ColorVariant;
  size?: SizeVariant;
  label?: string;
  value: string;
  onPress: (value: string) => void;
}

// Progress Types
export interface ProgressProps extends BaseComponentProps, StyleProps {
  value: number;
  max?: number;
  variant?: 'linear' | 'circular';
  color?: ColorVariant;
  size?: SizeVariant;
  showLabel?: boolean;
  animated?: boolean;
}

// Skeleton Types
export interface SkeletonProps extends BaseComponentProps, StyleProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: number | string;
  height?: number | string;
  animated?: boolean;
}

// Divider Types
export interface DividerProps extends BaseComponentProps, StyleProps {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  color?: ColorVariant | string;
  thickness?: number;
  spacing?: SizeVariant;
}

// Modal Types
export interface ModalProps extends BaseComponentProps {
  visible: boolean;
  children: ReactNode;
  animationType?: 'none' | 'slide' | 'fade';
  transparent?: boolean;
  onRequestClose: () => void;
  onShow?: () => void;
  onDismiss?: () => void;
}

// Alert Types
export interface AlertProps extends BaseComponentProps, StyleProps {
  children: ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  severity?: 'low' | 'medium' | 'high';
  dismissible?: boolean;
  icon?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
}

// Toast Types
export interface ToastProps {
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  position?: 'top' | 'center' | 'bottom';
  action?: {
    label: string;
    onPress: () => void;
  };
}

// List Types
export interface ListItemProps extends BaseComponentProps, StyleProps {
  children?: ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  leftAvatar?: ReactNode;
  rightAvatar?: ReactNode;
  disabled?: boolean;
  selected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

// Form Types
export interface FormFieldProps extends BaseComponentProps {
  name: string;
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: ReactNode;
}

// Layout Types
export interface ContainerProps extends BaseComponentProps, StyleProps {
  children: ReactNode;
  maxWidth?: number | string;
  padding?: SizeVariant;
  margin?: SizeVariant;
  centered?: boolean;
}

export interface FlexProps extends BaseComponentProps, StyleProps {
  children: ReactNode;
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justify?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  align?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: SizeVariant;
}

export interface GridProps extends BaseComponentProps, StyleProps {
  children: ReactNode;
  columns?: number;
  gap?: SizeVariant;
  minItemWidth?: number;
}

// Animation Types
export interface AnimatedProps {
  duration?: number;
  delay?: number;
  easing?: string;
  loop?: boolean;
  autoPlay?: boolean;
}

// Screen Template Types
export interface ScreenTemplateProps extends BaseComponentProps, StyleProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  loading?: boolean;
  error?: string | Error | null;
  onRetry?: () => void;
  safeArea?: boolean;
  padding?: SizeVariant | 'none';
  backgroundColor?: string;
}

export interface HeaderProps extends BaseComponentProps, StyleProps {
  title?: string;
  subtitle?: string;
  leftAction?: ReactNode;
  rightActions?: ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
  backgroundColor?: string;
  elevation?: boolean;
}

export interface LoadingStateProps extends BaseComponentProps, StyleProps {
  message?: string;
  size?: SizeVariant;
  color?: ColorVariant;
  overlay?: boolean;
}

export interface ErrorStateProps extends BaseComponentProps, StyleProps {
  error?: string | Error;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  showIcon?: boolean;
}

export interface EmptyStateProps extends BaseComponentProps, StyleProps {
  title?: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export interface ListTemplateProps extends BaseComponentProps, StyleProps {
  data: any[];
  renderItem: (item: any, index: number) => React.ReactElement;
  keyExtractor?: (item: any, index: number) => string;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  emptyState?: React.ComponentType<any> | React.ReactElement | null;
  header?: React.ComponentType<any> | React.ReactElement | null;
  footer?: React.ComponentType<any> | React.ReactElement | null;
  separator?: React.ComponentType<any> | null;
  numColumns?: number;
}

export interface FormTemplateProps extends BaseComponentProps, StyleProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  onSubmit?: () => void;
  submitText?: string;
  submitDisabled?: boolean;
  submitLoading?: boolean;
  showCancelButton?: boolean;
  onCancel?: () => void;
  cancelText?: string;
  scrollable?: boolean;
  validateOnChange?: boolean;
}

export interface ModalTemplateProps extends BaseComponentProps, StyleProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  position?: 'center' | 'bottom' | 'top';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  animationType?: 'none' | 'slide' | 'fade';
}

// Theme Types
export interface ThemeContextType {
  colors: typeof import('../constants/design').COLORS;
  typography: typeof import('../constants/design').TYPOGRAPHY;
  spacing: typeof import('../constants/design').SPACING;
  borderRadius: typeof import('../constants/design').BORDER_RADIUS;
  shadows: typeof import('../constants/design').SHADOWS;
  sizes: typeof import('../constants/design').SIZES;
  isDark: boolean;
  toggleTheme: () => void;
  // Palette controls
  // default -> standard; sun -> experimental light yellow
  // Persisted via AsyncStorage
  // Consumers can expose a toggle in Settings
  togglePalette?: () => void;
  palette?: 'default' | 'sun';
}
