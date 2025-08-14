import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useThemeContext } from '../theme/ThemeProvider';

// Minimal haptics utility per E4-S5
// - Light haptics on primary actions and success states
// - Honor reduced-motion: no haptics when reducedMotion is true
export const useHaptics = () => {
  const { reducedMotion } = useThemeContext();

  const safeImpactLight = useCallback(() => {
    if (reducedMotion) {
      return;
    }
    try {
      Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light as any)?.catch?.(
        () => {}
      );
    } catch {
      // noop in non-native/test environments
    }
  }, [reducedMotion]);

  const safeSuccess = useCallback(() => {
    if (reducedMotion) {
      return;
    }
    try {
      Haptics.notificationAsync?.(
        Haptics.NotificationFeedbackType.Success as any
      )?.catch?.(() => {});
    } catch {
      // noop in non-native/test environments
    }
  }, [reducedMotion]);

  return {
    light: safeImpactLight,
    success: safeSuccess,
  };
};
