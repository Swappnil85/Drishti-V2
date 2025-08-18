import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { useThemeContext } from '../../src/theme/ThemeProvider';

export type SectionProps = ViewProps & {
  title?: string;
  description?: string;
};

export const Section = ({ title, description, style, children, ...rest }: SectionProps) => {
  const { tokens } = useThemeContext();
  return (
    <View style={[{ marginBottom: 16 }, style]} {...rest}>
      {title ? (
        <Text accessibilityRole="header" style={{ fontSize: 18, color: tokens.text, fontWeight: '600', marginBottom: 4 }}>
          {title}
        </Text>
      ) : null}
      {description ? (
        <Text style={{ color: tokens.textSecondary, marginBottom: 8 }}>{description}</Text>
      ) : null}
      {children}
    </View>
  );
};

export default Section;

