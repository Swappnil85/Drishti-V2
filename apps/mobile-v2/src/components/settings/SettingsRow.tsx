/**
 * Settings Row Component for E5-S2
 * Reusable row component for individual settings
 */

import { View, Text, Pressable } from 'react-native';
import { useThemeContext } from '../../theme/ThemeProvider';
import { triggerHaptic } from '../../utils/haptics';

interface SettingsRowProps {
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  showBorder?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function SettingsRow({
  title,
  subtitle,
  value,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  showBorder = true,
  disabled = false,
  children,
}: SettingsRowProps) {
  const { tokens, reducedMotion } = useThemeContext();

  const handlePress = () => {
    if (disabled || !onPress) {
      return;
    }

    if (!reducedMotion) {
      triggerHaptic('light');
    }
    onPress();
  };

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        minHeight: 56,
        borderBottomWidth: showBorder ? 1 : 0,
        borderBottomColor: tokens.border,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '500',
            color: tokens.text,
            marginBottom: subtitle ? 4 : 0,
          }}
        >
          {title}
        </Text>

        {subtitle && (
          <Text
            style={{
              fontSize: 14,
              color: tokens.textMuted,
              lineHeight: 18,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {value && (
        <Text
          style={{
            fontSize: 16,
            color: tokens.textMuted,
            marginLeft: 12,
          }}
        >
          {value}
        </Text>
      )}

      {children && <View style={{ marginLeft: 12 }}>{children}</View>}

      {onPress && !children && (
        <Text
          style={{
            fontSize: 16,
            color: tokens.primary,
            marginLeft: 12,
          }}
        >
          ›
        </Text>
      )}
    </View>
  );

  if (onPress && !disabled) {
    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole='button'
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => ({
          backgroundColor: pressed ? `${tokens.primary}08` : 'transparent',
        })}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}
