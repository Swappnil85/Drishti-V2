/**
 * Flex Component
 * Flexible layout component with flexbox properties
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { FlexProps } from '../../types/components';

const Flex: React.FC<FlexProps> = ({
  children,
  direction = 'column',
  justify = 'flex-start',
  align = 'stretch',
  wrap = 'nowrap',
  gap,
  style,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const theme = useTheme();

  // Get gap value
  const gapValue = gap ? theme.spacing[
    typeof gap === 'string' 
      ? (gap === 'xs' ? 1 : gap === 'sm' ? 2 : gap === 'base' ? 4 : gap === 'md' ? 5 : gap === 'lg' ? 6 : gap === 'xl' ? 8 : 4)
      : gap
  ] : 0;

  const flexStyles = [
    styles.flex,
    {
      flexDirection: direction,
      justifyContent: justify,
      alignItems: align,
      flexWrap: wrap,
      gap: gapValue,
    },
    style,
  ];

  return (
    <View
      style={flexStyles}
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
  flex: {
    display: 'flex',
  },
});

export default Flex;
