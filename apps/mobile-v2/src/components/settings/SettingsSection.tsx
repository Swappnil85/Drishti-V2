/**
 * Settings Section Component for E5-S2
 * Reusable section component for organizing settings
 */

import { View, Text } from 'react-native';
import { useThemeContext } from '../../theme/ThemeProvider';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  const { tokens } = useThemeContext();

  return (
    <View
      style={{
        marginBottom: 32,
      }}
    >
      <Text
        accessibilityRole='header'
        style={{
          fontSize: 18,
          fontWeight: '600',
          color: tokens.text,
          marginBottom: 8,
        }}
      >
        {title}
      </Text>

      {description && (
        <Text
          style={{
            fontSize: 14,
            color: tokens.textMuted,
            marginBottom: 16,
            lineHeight: 20,
          }}
        >
          {description}
        </Text>
      )}

      <View
        style={{
          backgroundColor: tokens.surface,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}
