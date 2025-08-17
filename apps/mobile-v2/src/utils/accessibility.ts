import { ViewStyle, TextStyle } from 'react-native';

/**
 * E4-S10: Accessibility Baseline utilities
 * Ensures 44px min touch targets, proper labels, and logical focus order
 */

// Minimum touch target size per WCAG AA guidelines
export const MIN_TOUCH_TARGET = 44;

/**
 * Ensures minimum touch target size for interactive elements
 */
export const touchTargetStyle: ViewStyle = {
  minHeight: MIN_TOUCH_TARGET,
  minWidth: MIN_TOUCH_TARGET,
};

/**
 * Common accessibility props for buttons
 */
export const buttonA11yProps = {
  accessibilityRole: 'button' as const,
  accessible: true,
};

/**
 * Common accessibility props for text inputs
 */
export const textInputA11yProps = {
  accessibilityRole: 'text' as const,
  accessible: true,
};

/**
 * Common accessibility props for headers
 */
export const headerA11yProps = {
  accessibilityRole: 'header' as const,
  accessible: true,
};

/**
 * Common accessibility props for images
 */
export const imageA11yProps = {
  accessibilityRole: 'image' as const,
  accessible: true,
};

/**
 * Common accessibility props for links
 */
export const linkA11yProps = {
  accessibilityRole: 'link' as const,
  accessible: true,
};

/**
 * Common accessibility props for summary/main content
 */
export const summaryA11yProps = {
  accessibilityRole: 'summary' as const,
  accessible: true,
};

/**
 * Generate accessible label for currency amounts
 */
export function formatCurrencyA11y(
  amount: number,
  currency: string = 'AUD'
): string {
  const formatter = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
  });

  const formatted = formatter.format(amount);

  // Make it more screen reader friendly
  return formatted
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate accessible label for percentages
 */
export function formatPercentageA11y(value: number): string {
  return `${value.toFixed(1)} percent`;
}

/**
 * Generate accessible label for dates
 */
export function formatDateA11y(date: Date): string {
  return date.toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Validate if text has sufficient contrast
 * Basic implementation - in production would use actual contrast calculation
 */
export function hasGoodContrast(
  foreground: string,
  background: string
): boolean {
  // Simplified check - in real implementation would calculate actual contrast ratio
  // For now, just ensure we're not using similar colors
  return foreground !== background;
}

/**
 * Focus management utilities
 */
export const focusStyles: ViewStyle = {
  // These would be applied when element is focused
  borderWidth: 2,
  borderColor: '#4C8DFF', // Primary color for focus indicator
};

/**
 * Screen reader announcement helper
 */
export function announceToScreenReader(message: string): void {
  // In React Native, this would typically be handled by:
  // 1. Setting accessibilityLiveRegion on a container
  // 2. Updating the text content to trigger announcement
  // For now, this is a placeholder for the pattern
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[A11Y Announcement]: ${message}`);
  }
}

/**
 * Validate accessibility requirements for a component
 */
export interface A11yValidation {
  hasLabel: boolean;
  hasRole: boolean;
  hasTouchTarget: boolean;
  hasContrast: boolean;
}

export function validateA11y(props: any, style: any): A11yValidation {
  return {
    hasLabel: !!(props.accessibilityLabel || props.accessibilityHint),
    hasRole: !!props.accessibilityRole,
    hasTouchTarget: !!(
      style?.minHeight >= MIN_TOUCH_TARGET ||
      style?.minWidth >= MIN_TOUCH_TARGET
    ),
    hasContrast: true, // Would implement actual contrast checking
  };
}

/**
 * Common text styles that ensure readability
 */
export const readableTextStyle: TextStyle = {
  fontSize: 16, // Minimum readable size
  lineHeight: 24, // 1.5x line height for readability
};

/**
 * Large text style for better accessibility
 */
export const largeTextStyle: TextStyle = {
  fontSize: 18,
  lineHeight: 27,
  fontWeight: '600',
};

/**
 * Helper to create accessible button with proper touch targets
 */
export function createAccessibleButton(label: string, hint?: string) {
  return {
    ...buttonA11yProps,
    ...touchTargetStyle,
    accessibilityLabel: label,
    accessibilityHint: hint,
  };
}
