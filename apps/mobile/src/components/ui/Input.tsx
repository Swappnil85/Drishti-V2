/**
 * Input Component
 * Reusable text input with validation and styling
 */

import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useTheme, getColorValue } from '../../contexts/ThemeContext';
import { InputProps } from '../../types/components';
import { useFormHaptic } from '../../hooks/useHaptic';
import Text from './Text';

const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  defaultValue,
  variant = 'default',
  size = 'base',
  disabled = false,
  required = false,
  error = false,
  errorMessage,
  helperText,
  leftIcon,
  rightIcon,
  multiline = false,
  numberOfLines = 1,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  onChangeText,
  onFocus,
  onBlur,
  style,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const theme = useTheme();
  const formHaptic = useFormHaptic();
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const animatedValue = useRef(
    new Animated.Value(value || defaultValue ? 1 : 0)
  ).current;

  // Size configurations
  const sizeConfig = {
    xs: {
      height: 32,
      fontSize: theme.typography.fontSize.xs,
      padding: theme.spacing[2],
    },
    sm: {
      height: 36,
      fontSize: theme.typography.fontSize.sm,
      padding: theme.spacing[2],
    },
    base: {
      height: 44,
      fontSize: theme.typography.fontSize.base,
      padding: theme.spacing[3],
    },
    md: {
      height: 48,
      fontSize: theme.typography.fontSize.base,
      padding: theme.spacing[4],
    },
    lg: {
      height: 52,
      fontSize: theme.typography.fontSize.lg,
      padding: theme.spacing[4],
    },
    xl: {
      height: 56,
      fontSize: theme.typography.fontSize.xl,
      padding: theme.spacing[5],
    },
    '2xl': {
      height: 60,
      fontSize: theme.typography.fontSize.xl,
      padding: theme.spacing[5],
    },
    '3xl': {
      height: 64,
      fontSize: theme.typography.fontSize['2xl'],
      padding: theme.spacing[6],
    },
  };

  const currentSize = sizeConfig[size];

  // Handle focus
  const handleFocus = async () => {
    setIsFocused(true);
    if (onFocus) onFocus();

    // Animate label
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // Handle blur
  const handleBlur = async () => {
    setIsFocused(false);
    if (onBlur) onBlur();

    // Animate label back if no value
    if (!value && !defaultValue) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  // Handle text change with validation haptic feedback
  const handleChangeText = async (text: string) => {
    if (onChangeText) {
      onChangeText(text);
    }

    // Trigger haptic feedback for validation errors
    if (error && errorMessage) {
      await formHaptic.error();
    }
  };

  // Get variant styles
  const getVariantStyles = () => {
    const baseStyle = {
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
    };

    switch (variant) {
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.background.secondary,
          borderColor: 'transparent',
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderColor: error
            ? theme.colors.error[500]
            : isFocused
              ? theme.colors.primary[500]
              : theme.colors.border.light,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: theme.colors.background.primary,
          borderColor: error
            ? theme.colors.error[500]
            : isFocused
              ? theme.colors.primary[500]
              : theme.colors.border.light,
        };
    }
  };

  const variantStyles = getVariantStyles();

  // Container styles
  const containerStyles = [
    styles.container,
    {
      height: multiline ? undefined : currentSize.height,
      minHeight: multiline
        ? currentSize.height * numberOfLines
        : currentSize.height,
      ...variantStyles,
      opacity: disabled ? 0.6 : 1,
    },
    style,
  ];

  // Input styles
  const inputStyles = [
    styles.input,
    {
      fontSize: currentSize.fontSize,
      color: theme.colors.text.primary,
      paddingHorizontal: currentSize.padding,
      paddingVertical: multiline ? currentSize.padding : 0,
      textAlignVertical: multiline ? ('top' as any) : ('center' as any),
    },
  ];

  // Label animation
  const labelStyle = {
    position: 'absolute' as const,
    left: currentSize.padding,
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [currentSize.fontSize, currentSize.fontSize * 0.8],
    }),
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [
        currentSize.height / 2 - currentSize.fontSize / 2,
        -currentSize.fontSize / 2,
      ],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [
        theme.colors.text.tertiary,
        isFocused ? theme.colors.primary[500] : theme.colors.text.secondary,
      ],
    }),
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: 4,
  };

  return (
    <View style={styles.wrapper}>
      {/* Label */}
      {label && (
        <Animated.Text style={labelStyle}>
          {label}
          {required && ' *'}
        </Animated.Text>
      )}

      {/* Input Container */}
      <View style={containerStyles}>
        {/* Left Icon */}
        {leftIcon && (
          <View style={[styles.icon, styles.leftIcon]}>{leftIcon}</View>
        )}

        {/* Text Input */}
        <TextInput
          style={inputStyles}
          value={value}
          defaultValue={defaultValue}
          placeholder={label ? undefined : placeholder}
          placeholderTextColor={theme.colors.text.tertiary}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          testID={testID}
          accessible={accessible}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={accessibilityHint}
        />

        {/* Right Icon / Secure Toggle */}
        {(rightIcon || secureTextEntry) && (
          <View style={[styles.icon, styles.rightIcon]}>
            {secureTextEntry ? (
              <TouchableOpacity
                onPress={() => setIsSecure(!isSecure)}
                style={styles.secureToggle}
              >
                <Text variant='caption' color='text.tertiary'>
                  {isSecure ? 'Show' : 'Hide'}
                </Text>
              </TouchableOpacity>
            ) : (
              rightIcon
            )}
          </View>
        )}
      </View>

      {/* Helper Text / Error Message */}
      {(helperText || errorMessage) && (
        <View style={styles.helperContainer}>
          <Text
            variant='caption'
            color={error ? 'error.500' : 'text.secondary'}
            style={styles.helperText}
          >
            {error ? errorMessage : helperText}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    margin: 0,
    padding: 0,
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  leftIcon: {
    paddingLeft: 12,
  },
  rightIcon: {
    paddingRight: 12,
  },
  secureToggle: {
    padding: 4,
  },
  helperContainer: {
    marginTop: 4,
    paddingHorizontal: 4,
  },
  helperText: {
    fontSize: 12,
  },
});

export default Input;
