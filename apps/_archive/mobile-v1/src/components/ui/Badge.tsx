/**
 * Badge Component
 * Small status indicator or notification badge
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, getColorValue } from '../../contexts/ThemeContext';
import { BadgeProps } from '../../types/components';
import Text from './Text';

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'filled',
  color = 'primary',
  size = 'base',
  position,
  style,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'text',
}) => {
  const theme = useTheme();

  // Get size values
  const sizeValues = {
    xs: { minWidth: 16, height: 16, padding: 2, fontSize: theme.typography.fontSize.xs },
    sm: { minWidth: 20, height: 20, padding: 4, fontSize: theme.typography.fontSize.xs },
    base: { minWidth: 24, height: 24, padding: 6, fontSize: theme.typography.fontSize.sm },
    md: { minWidth: 28, height: 28, padding: 8, fontSize: theme.typography.fontSize.sm },
    lg: { minWidth: 32, height: 32, padding: 10, fontSize: theme.typography.fontSize.base },
    xl: { minWidth: 36, height: 36, padding: 12, fontSize: theme.typography.fontSize.base },
    '2xl': { minWidth: 40, height: 40, padding: 14, fontSize: theme.typography.fontSize.lg },
    '3xl': { minWidth: 44, height: 44, padding: 16, fontSize: theme.typography.fontSize.lg },
  };

  const currentSize = sizeValues[size];

  // Get color values
  const primaryColor = getColorValue(theme.colors, color, 500);
  const lightColor = getColorValue(theme.colors, color, 100);

  // Get variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: primaryColor,
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: primaryColor,
        };
      case 'dot':
        return {
          backgroundColor: primaryColor,
          borderWidth: 0,
          minWidth: currentSize.height,
          padding: 0,
        };
      default:
        return {
          backgroundColor: primaryColor,
          borderWidth: 0,
        };
    }
  };

  const variantStyles = getVariantStyles();

  // Get text color
  const getTextColor = () => {
    switch (variant) {
      case 'filled':
        return theme.colors.text.inverse;
      case 'outline':
        return primaryColor;
      case 'dot':
        return 'transparent'; // No text for dot variant
      default:
        return theme.colors.text.inverse;
    }
  };

  const textColor = getTextColor();

  // Get position styles
  const getPositionStyles = () => {
    if (!position) return {};

    const offset = -currentSize.height / 3;

    switch (position) {
      case 'top-right':
        return {
          position: 'absolute' as const,
          top: offset,
          right: offset,
        };
      case 'top-left':
        return {
          position: 'absolute' as const,
          top: offset,
          left: offset,
        };
      case 'bottom-right':
        return {
          position: 'absolute' as const,
          bottom: offset,
          right: offset,
        };
      case 'bottom-left':
        return {
          position: 'absolute' as const,
          bottom: offset,
          left: offset,
        };
      default:
        return {};
    }
  };

  const positionStyles = getPositionStyles();

  const badgeStyles = [
    styles.badge,
    {
      minWidth: currentSize.minWidth,
      height: currentSize.height,
      paddingHorizontal: currentSize.padding,
      borderRadius: currentSize.height / 2,
      backgroundColor: variantStyles.backgroundColor,
      borderWidth: variantStyles.borderWidth,
      borderColor: variantStyles.borderColor,
    },
    positionStyles,
    style,
  ];

  return (
    <View
      style={badgeStyles}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
    >
      {variant !== 'dot' && children && (
        <Text
          variant="caption"
          weight="medium"
          color={textColor}
          style={{ fontSize: currentSize.fontSize }}
          numberOfLines={1}
        >
          {children}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
});

export default Badge;
