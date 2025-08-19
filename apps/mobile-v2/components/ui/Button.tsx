import React from 'react';
import { Pressable, Text, PressableProps, ViewStyle } from 'react-native';
import { useThemeContext } from '../../src/theme/ThemeProvider';

export type ButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'outline';
  style?: ViewStyle | ViewStyle[];
};

export const Button = ({
  label,
  variant = 'primary',
  style,
  ...rest
}: ButtonProps) => {
  const { tokens } = useThemeContext();
  const base: ViewStyle = {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  };

  const primary: ViewStyle = {
    backgroundColor: tokens.primary,
  };

  const outline: ViewStyle = {
    borderWidth: 1,
    borderColor: tokens.border,
  };

  const textColor = variant === 'primary' ? '#FFFFFF' : tokens.text;

  return (
    <Pressable
      accessibilityRole='button'
      style={({ pressed }) => [
        base,
        variant === 'primary' ? primary : outline,
        { opacity: pressed ? 0.9 : 1 },
        style as any,
      ]}
      {...rest}
    >
      <Text style={{ color: textColor, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
};

export default Button;
