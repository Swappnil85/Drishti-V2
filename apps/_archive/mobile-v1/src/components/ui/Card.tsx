/**
 * Card Component
 * Reusable card container with elevation and variants
 */

import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { CardProps } from '../../types/components';

const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  padding = 'base',
  margin,
  onPress,
  disabled = false,
  style,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
}) => {
  const theme = useTheme();

  // Get padding value
  const paddingValue = theme.spacing[
    typeof padding === 'string' 
      ? (padding === 'xs' ? 1 : padding === 'sm' ? 2 : padding === 'base' ? 4 : padding === 'md' ? 5 : padding === 'lg' ? 6 : padding === 'xl' ? 8 : 4)
      : padding
  ];

  // Get margin value
  const marginValue = margin ? theme.spacing[
    typeof margin === 'string' 
      ? (margin === 'xs' ? 1 : margin === 'sm' ? 2 : margin === 'base' ? 4 : margin === 'md' ? 5 : margin === 'lg' ? 6 : margin === 'xl' ? 8 : 4)
      : margin
  ] : 0;

  // Get variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: theme.colors.background.primary,
          ...theme.shadows.base,
          borderWidth: 0,
        };
      case 'outlined':
        return {
          backgroundColor: theme.colors.background.primary,
          borderWidth: 1,
          borderColor: theme.colors.border.light,
          ...theme.shadows.none,
        };
      case 'filled':
        return {
          backgroundColor: theme.colors.background.secondary,
          borderWidth: 0,
          ...theme.shadows.none,
        };
      default:
        return {
          backgroundColor: theme.colors.background.primary,
          ...theme.shadows.base,
          borderWidth: 0,
        };
    }
  };

  const variantStyles = getVariantStyles();

  const cardStyles = [
    styles.card,
    {
      borderRadius: theme.borderRadius.md,
      padding: paddingValue,
      margin: marginValue,
      opacity: disabled ? 0.6 : 1,
      ...variantStyles,
    },
    style,
  ];

  // If onPress is provided, use TouchableOpacity
  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        testID={testID}
        accessible={accessible}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole={accessibilityRole || 'button'}
      >
        {children}
      </TouchableOpacity>
    );
  }

  // Otherwise, use regular View
  return (
    <View
      style={cardStyles}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    // Base styles are applied via theme
  },
});

export default Card;
