/**
 * Haptic Context
 * Global haptic feedback configuration and state management
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import HapticService, { HapticConfig, HapticPattern, HapticContext as HapticContextType } from '../services/haptic/HapticService';

interface HapticProviderContextType {
  // Configuration
  isEnabled: boolean;
  config: HapticConfig;
  
  // Control methods
  setEnabled: (enabled: boolean) => Promise<void>;
  setIntensity: (intensity: number) => Promise<void>;
  setContextualFeedback: (enabled: boolean) => Promise<void>;
  updateConfig: (config: Partial<HapticConfig>) => Promise<void>;
  
  // Haptic methods
  trigger: (pattern: HapticPattern, context?: HapticContextType) => Promise<boolean>;
  
  // Contextual methods
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
  
  // Testing
  testPattern: (pattern: HapticPattern) => Promise<boolean>;
  testAllPatterns: () => Promise<void>;
  
  // Analytics
  getStats: () => ReturnType<typeof HapticService.getHapticStats>;
  clearStats: () => void;
}

interface HapticProviderProps {
  children: ReactNode;
}

const HapticProviderContext = createContext<HapticProviderContextType | undefined>(undefined);

export const HapticProvider: React.FC<HapticProviderProps> = ({ children }) => {
  const [isEnabled, setIsEnabledState] = useState(HapticService.isEnabled());
  const [config, setConfigState] = useState(HapticService.getConfig());

  // Update state when service configuration changes
  useEffect(() => {
    const updateState = () => {
      setIsEnabledState(HapticService.isEnabled());
      setConfigState(HapticService.getConfig());
    };

    // Initial update
    updateState();

    // Set up periodic updates to sync with service
    const interval = setInterval(updateState, 2000);

    return () => clearInterval(interval);
  }, []);

  // Configuration methods
  const setEnabled = async (enabled: boolean) => {
    await HapticService.setEnabled(enabled);
    setIsEnabledState(enabled);
  };

  const setIntensity = async (intensity: number) => {
    await HapticService.setIntensity(intensity);
    setConfigState(HapticService.getConfig());
  };

  const setContextualFeedback = async (enabled: boolean) => {
    await HapticService.setContextualFeedback(enabled);
    setConfigState(HapticService.getConfig());
  };

  const updateConfig = async (newConfig: Partial<HapticConfig>) => {
    await HapticService.updateConfig(newConfig);
    setConfigState(HapticService.getConfig());
    setIsEnabledState(HapticService.isEnabled());
  };

  // Haptic methods - direct delegation to service
  const trigger = (pattern: HapticPattern, context?: HapticContextType) => {
    return HapticService.trigger(pattern, context);
  };

  // Contextual methods
  const buttonTap = () => HapticService.buttonTap();
  const toggleSwitch = (isOn: boolean) => HapticService.toggleSwitch(isOn);
  const sliderChange = () => HapticService.sliderChange();
  const swipeAction = () => HapticService.swipeAction();
  const pullRefresh = () => HapticService.pullRefresh();
  const navigation = () => HapticService.navigation();
  const formValidationError = () => HapticService.formValidationError();
  const formValidationSuccess = () => HapticService.formValidationSuccess();
  const achievement = () => HapticService.achievement();
  const milestone = () => HapticService.milestone();
  const errorFeedback = () => HapticService.errorFeedback();
  const successFeedback = () => HapticService.successFeedback();
  const loadingComplete = () => HapticService.loadingComplete();
  const dataUpdate = () => HapticService.dataUpdate();
  const gestureRecognition = () => HapticService.gestureRecognition();
  const modalOpen = () => HapticService.modalOpen();
  const modalClose = () => HapticService.modalClose();
  const tabSwitch = () => HapticService.tabSwitch();
  const longPress = () => HapticService.longPress();
  const doubleTap = () => HapticService.doubleTap();

  // Testing methods
  const testPattern = (pattern: HapticPattern) => HapticService.testPattern(pattern);
  const testAllPatterns = () => HapticService.testAllPatterns();

  // Analytics methods
  const getStats = () => HapticService.getHapticStats();
  const clearStats = () => HapticService.clearStats();

  const value: HapticProviderContextType = {
    // Configuration
    isEnabled,
    config,
    
    // Control methods
    setEnabled,
    setIntensity,
    setContextualFeedback,
    updateConfig,
    
    // Haptic methods
    trigger,
    
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
    
    // Testing
    testPattern,
    testAllPatterns,
    
    // Analytics
    getStats,
    clearStats,
  };

  return (
    <HapticProviderContext.Provider value={value}>
      {children}
    </HapticProviderContext.Provider>
  );
};

export const useHapticContext = (): HapticProviderContextType => {
  const context = useContext(HapticProviderContext);
  if (context === undefined) {
    throw new Error('useHapticContext must be used within a HapticProvider');
  }
  return context;
};

export default HapticProvider;
