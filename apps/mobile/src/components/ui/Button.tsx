/**
 * Button Component
 * Reusable button with multiple variants and states
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTheme, getColorValue } from '../../contexts/ThemeContext';
import { ButtonProps } from '../../types/components';

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'base',
  color = 'primary',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  onPress,
  onLongPress,
  style,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
}) => {
  const theme = useTheme();

  // Get size values
  const sizeValues = {
    xs: {
      height: theme.sizes.xs,
      paddingHorizontal: theme.spacing[2],
      fontSize: theme.typography.fontSize.xs,
    },
    sm: {
      height: theme.sizes.sm,
      paddingHorizontal: theme.spacing[3],
      fontSize: theme.typography.fontSize.sm,
    },
    base: {
      height: theme.sizes.base,
      paddingHorizontal: theme.spacing[4],
      fontSize: theme.typography.fontSize.base,
    },
    md: {
      height: theme.sizes.md,
      paddingHorizontal: theme.spacing[5],
      fontSize: theme.typography.fontSize.lg,
    },
    lg: {
      height: theme.sizes.lg,
      paddingHorizontal: theme.spacing[6],
      fontSize: theme.typography.fontSize.xl,
    },
    xl: {
      height: theme.sizes.xl,
      paddingHorizontal: theme.spacing[8],
      fontSize: theme.typography.fontSize['2xl'],
    },
    '2xl': {
      height: theme.sizes['2xl'],
      paddingHorizontal: theme.spacing[10],
      fontSize: theme.typography.fontSize['2xl'],
    },
    '3xl': {
      height: theme.sizes['3xl'],
      paddingHorizontal: theme.spacing[12],
      fontSize: theme.typography.fontSize['3xl'],
    },
  };

  const currentSize = sizeValues[size];

  // Get color values
  const primaryColor = getColorValue(theme.colors, color, 500);
  const primaryColorDark = getColorValue(theme.colors, color, 600);
  const primaryColorLight = getColorValue(theme.colors, color, 100);

  // Create variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? theme.colors.neutral[300] : primaryColor,
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: disabled
            ? theme.colors.neutral[100]
            : theme.colors.neutral[200],
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: disabled ? theme.colors.neutral[300] : primaryColor,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      case 'link':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
          paddingHorizontal: 0,
          height: 'auto',
          minHeight: currentSize.height,
        };
      default:
        return {
          backgroundColor: disabled ? theme.colors.neutral[300] : primaryColor,
          borderWidth: 0,
        };
    }
  };

  // Get text color
  const getTextColor = () => {
    if (disabled) {
      return theme.colors.text.disabled;
    }

    switch (variant) {
      case 'primary':
        return theme.colors.text.inverse;
      case 'secondary':
        return theme.colors.text.primary;
      case 'outline':
        return primaryColor;
      case 'ghost':
        return primaryColor;
      case 'link':
        return primaryColor;
      default:
        return theme.colors.text.inverse;
    }
  };

  const variantStyles = getVariantStyles();
  const textColor = getTextColor();

  const buttonStyles = [
    styles.button,
    {
      height: (variantStyles as any).height || currentSize.height,
      paddingHorizontal:
        (variantStyles as any).paddingHorizontal ||
        currentSize.paddingHorizontal,
      backgroundColor: variantStyles.backgroundColor,
      borderWidth: variantStyles.borderWidth,
      borderColor: variantStyles.borderColor,
      borderRadius: theme.borderRadius.md,
      opacity: disabled ? 0.6 : 1,
      width: fullWidth ? '100%' : ('auto' as any),
    },
    style,
  ];

  const textStyles = [
    styles.text,
    {
      fontSize: currentSize.fontSize,
      fontWeight: theme.typography.fontWeight.medium,
      color: textColor,
    },
  ];

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      onPress();
    }
  };

  const handleLongPress = () => {
    if (!disabled && !loading && onLongPress) {
      onLongPress();
    }
  };

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={handlePress}
      onLongPress={handleLongPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size='small'
            color={textColor}
            style={styles.loader}
          />
        ) : (
          <>
            {leftIcon && (
              <View style={[styles.icon, styles.leftIcon]}>{leftIcon}</View>
            )}

            <Text style={textStyles} numberOfLines={1}>
              {children}
            </Text>

            {rightIcon && (
              <View style={[styles.icon, styles.rightIcon]}>{rightIcon}</View>
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  loader: {
    marginHorizontal: 8,
  },
});

export default Button;
