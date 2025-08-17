/**
 * Toggle Switch Component for E5-S2
 * Accessible toggle switch for boolean preferences
 */

import { Pressable, View } from 'react-native';
import { useThemeContext } from '../../theme/ThemeProvider';
import { triggerHaptic } from '../../utils/haptics';

interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function ToggleSwitch({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}: ToggleSwitchProps) {
  const { tokens, reducedMotion } = useThemeContext();

  const handlePress = () => {
    if (disabled) {
      return;
    }

    if (!reducedMotion) {
      triggerHaptic('light');
    }

    onValueChange(!value);
  };

  const trackColor = value ? tokens.primary : tokens.border;
  const thumbColor = '#FFFFFF';

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole='switch'
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      style={{
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <View
        style={{
          width: 52,
          height: 32,
          borderRadius: 16,
          backgroundColor: trackColor,
          justifyContent: 'center',
          paddingHorizontal: 2,
        }}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: thumbColor,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
            transform: [{ translateX: value ? 20 : 0 }],
          }}
        />
      </View>
    </Pressable>
  );
}
