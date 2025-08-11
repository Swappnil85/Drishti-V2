/**
 * Container Component
 * Layout container with responsive width and padding
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { ContainerProps } from '../../types/components';

const Container: React.FC<ContainerProps> = ({
  children,
  maxWidth,
  padding = 'base',
  margin,
  centered = false,
  style,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const theme = useTheme();

  // Get padding value
  const paddingValue =
    theme.spacing[
      typeof padding === 'string'
        ? padding === 'xs'
          ? 1
          : padding === 'sm'
            ? 2
            : padding === 'base'
              ? 4
              : padding === 'md'
                ? 5
                : padding === 'lg'
                  ? 6
                  : padding === 'xl'
                    ? 8
                    : 4
        : padding
    ];

  // Get margin value
  const marginValue = margin
    ? theme.spacing[
        typeof margin === 'string'
          ? margin === 'xs'
            ? 1
            : margin === 'sm'
              ? 2
              : margin === 'base'
                ? 4
                : margin === 'md'
                  ? 5
                  : margin === 'lg'
                    ? 6
                    : margin === 'xl'
                      ? 8
                      : 4
          : margin
      ]
    : 0;

  const containerStyles = [
    styles.container,
    {
      maxWidth: (maxWidth as any) || '100%',
      padding: paddingValue,
      margin: marginValue,
      alignSelf: centered ? ('center' as any) : ('stretch' as any),
    },
    style,
  ] as any;

  return (
    <View
      style={containerStyles}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

export default Container;
