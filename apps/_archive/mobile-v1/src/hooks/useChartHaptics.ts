/**
 * useChartHaptics Hook
 * Epic 10, Story 1: Goal Progress Visual Charts - Enhanced haptic feedback for chart interactions
 */

import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export interface ChartHapticFeedback {
  onDataPointTap: () => Promise<void>;
  onChartTypeChange: () => Promise<void>;
  onMilestoneAchieved: () => Promise<void>;
  onProgressUpdate: (progress: number) => Promise<void>;
  onZoomIn: () => Promise<void>;
  onZoomOut: () => Promise<void>;
  onPanStart: () => Promise<void>;
  onPanEnd: () => Promise<void>;
  onDrillDown: () => Promise<void>;
  onGoalReached: () => Promise<void>;
  onChartError: () => Promise<void>;
}

export const useChartHaptics = (): ChartHapticFeedback => {
  const onDataPointTap = useCallback(async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      // Android fallback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const onChartTypeChange = useCallback(async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const onMilestoneAchieved = useCallback(async () => {
    if (Platform.OS === 'ios') {
      // Create a celebration pattern
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 100);
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 200);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }, []);

  const onProgressUpdate = useCallback(async (progress: number) => {
    // Provide different feedback based on progress milestones
    if (progress >= 100) {
      await onGoalReached();
    } else if (progress % 25 === 0 && progress > 0) {
      await onMilestoneAchieved();
    } else if (progress % 10 === 0 && progress > 0) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const onZoomIn = useCallback(async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const onZoomOut = useCallback(async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const onPanStart = useCallback(async () => {
    if (Platform.OS === 'ios') {
      await Haptics.selectionAsync();
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const onPanEnd = useCallback(async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const onDrillDown = useCallback(async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const onGoalReached = useCallback(async () => {
    if (Platform.OS === 'ios') {
      // Create an extended celebration pattern
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 200);
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 400);
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 600);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const onChartError = useCallback(async () => {
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, []);

  return {
    onDataPointTap,
    onChartTypeChange,
    onMilestoneAchieved,
    onProgressUpdate,
    onZoomIn,
    onZoomOut,
    onPanStart,
    onPanEnd,
    onDrillDown,
    onGoalReached,
    onChartError,
  };
};

// Additional utility functions for complex haptic patterns
export const createCustomHapticPattern = async (pattern: number[]) => {
  for (let i = 0; i < pattern.length; i++) {
    const intensity = pattern[i];
    if (intensity > 0) {
      const feedbackStyle =
        intensity >= 0.8
          ? Haptics.ImpactFeedbackStyle.Heavy
          : intensity >= 0.5
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Light;

      await Haptics.impactAsync(feedbackStyle);
    }

    // Wait between haptic events
    if (i < pattern.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
};

export const createProgressHapticPattern = async (
  currentProgress: number,
  targetProgress: number
) => {
  const steps = Math.ceil((targetProgress - currentProgress) / 5);
  const pattern = Array.from({ length: steps }, (_, i) => {
    const progress = currentProgress + (i + 1) * 5;
    return progress <= targetProgress ? 0.3 : 0;
  });

  await createCustomHapticPattern(pattern);
};

export const createMilestoneHapticCelebration = async (
  milestoneLevel: 'small' | 'medium' | 'large'
) => {
  switch (milestoneLevel) {
    case 'small':
      await createCustomHapticPattern([0.5, 0.3]);
      break;
    case 'medium':
      await createCustomHapticPattern([0.7, 0.5, 0.3]);
      break;
    case 'large':
      await createCustomHapticPattern([1.0, 0.8, 0.6, 0.4, 0.2]);
      break;
  }
};
