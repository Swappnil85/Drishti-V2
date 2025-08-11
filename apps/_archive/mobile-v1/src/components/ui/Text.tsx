/**
 * Text Component
 * Reusable text component with typography variants
 */

import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { useTheme, createTextStyle, getColorValue } from '../../contexts/ThemeContext';
import { TextProps } from '../../types/components';

const Text: React.FC<TextProps> = ({
  children,
  variant = 'body1',
  color,
  align = 'left',
  weight,
  numberOfLines,
  ellipsizeMode = 'tail',
  style,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'text',
}) => {
  const theme = useTheme();

  // Create base text style from variant
  const baseTextStyle = createTextStyle(variant, theme);

  // Override color if provided
  let textColor = baseTextStyle.color;
  if (color) {
    if (color.startsWith('#')) {
      textColor = color;
    } else {
      textColor = getColorValue(theme.colors, color);
    }
  }

  // Override font weight if provided
  let fontWeight = baseTextStyle.fontWeight;
  if (weight) {
    fontWeight = theme.typography.fontWeight[weight];
  }

  const textStyles = [
    baseTextStyle,
    {
      color: textColor,
      fontWeight,
      textAlign: align,
    },
    style,
  ];

  return (
    <RNText
      style={textStyles}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
    >
      {children}
    </RNText>
  );
};

export default Text;
