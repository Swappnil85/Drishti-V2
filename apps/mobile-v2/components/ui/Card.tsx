import React from 'react';
import { View, ViewProps } from 'react-native';
import { useThemeContext } from '../../src/theme/ThemeProvider';

export type CardProps = ViewProps & { elevated?: boolean };

export const Card = ({ style, elevated = false, ...rest }: CardProps) => {
  const { tokens } = useThemeContext();
  return (
    <View
      accessibilityRole="summary"
      style={[
        {
          backgroundColor: tokens.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: tokens.border,
          padding: 16,
          shadowColor: '#000',
          shadowOpacity: elevated ? 0.1 : 0,
          shadowRadius: elevated ? 8 : 0,
          shadowOffset: { width: 0, height: elevated ? 4 : 0 },
          elevation: elevated ? 2 : 0,
        },
        style,
      ]}
      {...rest}
    />
  );
};

export default Card;

