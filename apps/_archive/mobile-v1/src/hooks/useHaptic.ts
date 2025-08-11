/**
 * Haptic Hook
 * React hook for easy haptic feedback integration
 */

import { useCallback, useEffect, useState } from 'react';
import HapticService, {
  HapticPattern,
  HapticContext,
  HapticConfig,
} from '../services/haptic/HapticService';

export interface UseHapticReturn {
  // Basic haptic methods
  trigger: (
    pattern: HapticPattern,
    context?: HapticContext
  ) => Promise<boolean>;

  // Impact methods
  impactLight: () => Promise<boolean>;
  impactMedium: () => Promise<boolean>;
  impactHeavy: () => Promise<boolean>;

  // Contextual haptic methods
  buttonTap: () => Promise<boolean>;
  toggleSwitch: (isOn: boolean) => Promise<boolean>;
  sliderChange: () => Promise<boolean>;
  swipeAction: () => Promise<boolean>;
  pullRefresh: () => Promise<boolean>;
  navigation: () => Promise<boolean>;
  formValidationError: () => Promise<boolean>;
  formValidationSuccess: () => Promise<boolean>;
  achievement: () => Promise<boolean>;
  milestone: () => Promise<boolean>;
  errorFeedback: () => Promise<boolean>;
  successFeedback: () => Promise<boolean>;
  loadingComplete: () => Promise<boolean>;
  dataUpdate: () => Promise<boolean>;
  gestureRecognition: () => Promise<boolean>;
  modalOpen: () => Promise<boolean>;
  modalClose: () => Promise<boolean>;
  tabSwitch: () => Promise<boolean>;
  longPress: () => Promise<boolean>;
  doubleTap: () => Promise<boolean>;

  // Configuration
  isEnabled: boolean;
  config: HapticConfig;
  setEnabled: (enabled: boolean) => Promise<void>;
  setIntensity: (intensity: number) => Promise<void>;
  setContextualFeedback: (enabled: boolean) => Promise<void>;
  updateConfig: (config: Partial<HapticConfig>) => Promise<void>;

  // Testing
  testPattern: (pattern: HapticPattern) => Promise<boolean>;
  testAllPatterns: () => Promise<void>;

  // Analytics
  getStats: () => ReturnType<typeof HapticService.getHapticStats>;
  clearStats: () => void;
}

/**
 * Hook for haptic feedback functionality
 */
export const useHaptic = (): UseHapticReturn => {
  const [isEnabled, setIsEnabledState] = useState(HapticService.isEnabled());
  const [config, setConfig] = useState(HapticService.getConfig());

  // Update local state when config changes
  useEffect(() => {
    const updateState = () => {
      setIsEnabledState(HapticService.isEnabled());
      setConfig(HapticService.getConfig());
    };

    // Initial update
    updateState();

    // Set up periodic updates (in case config changes externally)
    const interval = setInterval(updateState, 1000);

    return () => clearInterval(interval);
  }, []);

  // Basic trigger method
  const trigger = useCallback(
    async (pattern: HapticPattern, context?: HapticContext) => {
      return HapticService.trigger(pattern, context);
    },
    []
  );

  // Impact methods
  const impactLight = useCallback(
    () => HapticService.trigger('light', 'general'),
    []
  );
  const impactMedium = useCallback(
    () => HapticService.trigger('medium', 'general'),
    []
  );
  const impactHeavy = useCallback(
    () => HapticService.trigger('heavy', 'general'),
    []
  );

  // Contextual haptic methods
  const buttonTap = useCallback(() => HapticService.buttonTap(), []);
  const toggleSwitch = useCallback(
    (isOn: boolean) => HapticService.toggleSwitch(isOn),
    []
  );
  const sliderChange = useCallback(() => HapticService.sliderChange(), []);
  const swipeAction = useCallback(() => HapticService.swipeAction(), []);
  const pullRefresh = useCallback(() => HapticService.pullRefresh(), []);
  const navigation = useCallback(() => HapticService.navigation(), []);
  const formValidationError = useCallback(
    () => HapticService.formValidationError(),
    []
  );
  const formValidationSuccess = useCallback(
    () => HapticService.formValidationSuccess(),
    []
  );
  const achievement = useCallback(() => HapticService.achievement(), []);
  const milestone = useCallback(() => HapticService.milestone(), []);
  const errorFeedback = useCallback(() => HapticService.errorFeedback(), []);
  const successFeedback = useCallback(
    () => HapticService.successFeedback(),
    []
  );
  const loadingComplete = useCallback(
    () => HapticService.loadingComplete(),
    []
  );
  const dataUpdate = useCallback(() => HapticService.dataUpdate(), []);
  const gestureRecognition = useCallback(
    () => HapticService.gestureRecognition(),
    []
  );
  const modalOpen = useCallback(() => HapticService.modalOpen(), []);
  const modalClose = useCallback(() => HapticService.modalClose(), []);
  const tabSwitch = useCallback(() => HapticService.tabSwitch(), []);
  const longPress = useCallback(() => HapticService.longPress(), []);
  const doubleTap = useCallback(() => HapticService.doubleTap(), []);

  // Configuration methods
  const setEnabled = useCallback(async (enabled: boolean) => {
    await HapticService.setEnabled(enabled);
    setIsEnabledState(enabled);
  }, []);

  const setIntensity = useCallback(async (intensity: number) => {
    await HapticService.setIntensity(intensity);
    setConfig(HapticService.getConfig());
  }, []);

  const setContextualFeedback = useCallback(async (enabled: boolean) => {
    await HapticService.setContextualFeedback(enabled);
    setConfig(HapticService.getConfig());
  }, []);

  const updateConfig = useCallback(async (newConfig: Partial<HapticConfig>) => {
    await HapticService.updateConfig(newConfig);
    setConfig(HapticService.getConfig());
    setIsEnabledState(HapticService.isEnabled());
  }, []);

  // Testing methods
  const testPattern = useCallback((pattern: HapticPattern) => {
    return HapticService.testPattern(pattern);
  }, []);

  const testAllPatterns = useCallback(() => {
    return HapticService.testAllPatterns();
  }, []);

  // Analytics methods
  const getStats = useCallback(() => {
    return HapticService.getHapticStats();
  }, []);

  const clearStats = useCallback(() => {
    HapticService.clearStats();
  }, []);

  return {
    // Basic methods
    trigger,

    // Impact methods
    impactLight,
    impactMedium,
    impactHeavy,

    // Contextual methods
    buttonTap,
    toggleSwitch,
    sliderChange,
    swipeAction,
    pullRefresh,
    navigation,
    formValidationError,
    formValidationSuccess,
    achievement,
    milestone,
    errorFeedback,
    successFeedback,
    loadingComplete,
    dataUpdate,
    gestureRecognition,
    modalOpen,
    modalClose,
    tabSwitch,
    longPress,
    doubleTap,

    // Configuration
    isEnabled,
    config,
    setEnabled,
    setIntensity,
    setContextualFeedback,
    updateConfig,

    // Testing
    testPattern,
    testAllPatterns,

    // Analytics
    getStats,
    clearStats,
  };
};

/**
 * Hook for specific haptic context
 */
export const useContextualHaptic = (context: HapticContext) => {
  const { trigger } = useHaptic();

  const triggerHaptic = useCallback(
    (pattern: HapticPattern = 'light') => {
      return trigger(pattern, context);
    },
    [trigger, context]
  );

  return triggerHaptic;
};

/**
 * Hook for button haptic feedback
 */
export const useButtonHaptic = () => {
  const { buttonTap } = useHaptic();
  return buttonTap;
};

/**
 * Hook for form validation haptic feedback
 */
export const useFormHaptic = () => {
  const { formValidationError, formValidationSuccess } = useHaptic();

  return {
    error: formValidationError,
    success: formValidationSuccess,
  };
};

/**
 * Hook for navigation haptic feedback
 */
export const useNavigationHaptic = () => {
  const { navigation, tabSwitch, modalOpen, modalClose } = useHaptic();

  return {
    navigate: navigation,
    switchTab: tabSwitch,
    openModal: modalOpen,
    closeModal: modalClose,
  };
};

/**
 * Hook for achievement haptic feedback
 */
export const useAchievementHaptic = () => {
  const { achievement, milestone, successFeedback } = useHaptic();

  return {
    achievement,
    milestone,
    success: successFeedback,
  };
};

export default useHaptic;
