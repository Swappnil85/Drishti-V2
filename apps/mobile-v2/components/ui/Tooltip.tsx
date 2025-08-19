import React, { useState } from 'react';
import { View, Text, Pressable, ViewProps } from 'react-native';
import { useThemeContext } from '../../src/theme/ThemeProvider';

export type TooltipProps = ViewProps & {
  label: string;
  children: React.ReactNode;
};

export const Tooltip = ({ label, children, style, ...rest }: TooltipProps) => {
  const { tokens } = useThemeContext();
  const [open, setOpen] = useState(false);
  return (
    <View accessibilityRole='note' style={style} {...rest}>
      <Pressable accessibilityLabel={label} onPress={() => setOpen(v => !v)}>
        {children}
      </Pressable>
      {open ? (
        <View
          style={{
            position: 'absolute',
            top: '100%',
            marginTop: 6,
            padding: 8,
            borderRadius: 8,
            backgroundColor: tokens.surface,
            borderWidth: 1,
            borderColor: tokens.border,
            maxWidth: 240,
          }}
        >
          <Text style={{ color: tokens.text }}>{label}</Text>
        </View>
      ) : null}
    </View>
  );
};

export default Tooltip;
