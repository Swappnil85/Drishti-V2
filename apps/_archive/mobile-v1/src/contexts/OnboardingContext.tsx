/**
 * Onboarding Context
 * Manages onboarding state and provides onboarding functionality
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import OnboardingService, {
  OnboardingStep,
  OnboardingProgress,
  OnboardingProfile,
} from '../services/onboarding/OnboardingService';

interface OnboardingContextType {
  // State
  isOnboarding: boolean;
  hasCompletedOnboarding: boolean;
  currentStep: OnboardingStep | null;
  allSteps: OnboardingStep[];
  progress: OnboardingProgress | null;
  loading: boolean;
  
  // Analytics
  analytics: {
    totalSteps: number;
    completedSteps: number;
    skippedSteps: number;
    progressPercentage: number;
    timeSpent: number;
    estimatedTimeRemaining: number;
  };
  
  // Actions
  startOnboarding: (profile?: Partial<OnboardingProfile>) => Promise<void>;
  completeStep: (stepId: string, data?: any) => Promise<void>;
  skipStep: (stepId: string) => Promise<void>;
  goToPreviousStep: () => Promise<void>;
  goToStep: (stepIndex: number) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  
  // Utilities
  isComplete: boolean;
  canGoBack: boolean;
  canSkipCurrent: boolean;
}

interface OnboardingProviderProps {
  children: ReactNode;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null);
  const [allSteps, setAllSteps] = useState<OnboardingStep[]>([]);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize onboarding state
  useEffect(() => {
    initializeOnboarding();
  }, []);

  // Update current step when progress changes
  useEffect(() => {
    if (progress) {
      const step = OnboardingService.getCurrentStep();
      setCurrentStep(step);
      setAllSteps(OnboardingService.getAllSteps());
      setIsOnboarding(true);
    } else {
      setCurrentStep(null);
      setAllSteps([]);
      setIsOnboarding(false);
    }
  }, [progress]);

  const initializeOnboarding = async () => {
    try {
      setLoading(true);
      
      // Check if user has completed onboarding
      const completed = await OnboardingService.hasCompletedOnboarding();
      setHasCompletedOnboarding(completed);
      
      if (!completed) {
        // Try to load existing progress
        const existingProgress = await OnboardingService.getProgress();
        if (existingProgress) {
          setProgress(existingProgress);
        }
      }
    } catch (error) {
      console.error('Failed to initialize onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const startOnboarding = async (profile?: Partial<OnboardingProfile>) => {
    try {
      setLoading(true);
      const newProgress = await OnboardingService.startOnboarding(profile);
      setProgress(newProgress);
      setHasCompletedOnboarding(false);
    } catch (error) {
      console.error('Failed to start onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeStep = async (stepId: string, data?: any) => {
    try {
      const updatedProgress = await OnboardingService.completeStep(stepId, data);
      if (updatedProgress) {
        setProgress(updatedProgress);
      }
    } catch (error) {
      console.error('Failed to complete step:', error);
    }
  };

  const skipStep = async (stepId: string) => {
    try {
      const updatedProgress = await OnboardingService.skipStep(stepId);
      if (updatedProgress) {
        setProgress(updatedProgress);
      }
    } catch (error) {
      console.error('Failed to skip step:', error);
    }
  };

  const goToPreviousStep = async () => {
    try {
      const updatedProgress = await OnboardingService.goToPreviousStep();
      if (updatedProgress) {
        setProgress(updatedProgress);
      }
    } catch (error) {
      console.error('Failed to go to previous step:', error);
    }
  };

  const goToStep = async (stepIndex: number) => {
    try {
      const updatedProgress = await OnboardingService.goToStep(stepIndex);
      if (updatedProgress) {
        setProgress(updatedProgress);
      }
    } catch (error) {
      console.error('Failed to go to step:', error);
    }
  };

  const completeOnboarding = async () => {
    try {
      setLoading(true);
      await OnboardingService.completeOnboarding();
      setProgress(null);
      setHasCompletedOnboarding(true);
      setIsOnboarding(false);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetOnboarding = async () => {
    try {
      setLoading(true);
      await OnboardingService.resetOnboarding();
      setProgress(null);
      setHasCompletedOnboarding(false);
      setIsOnboarding(false);
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  // Computed properties
  const isComplete = OnboardingService.isComplete();
  const canGoBack = progress ? progress.currentStep > 0 : false;
  const canSkipCurrent = currentStep ? currentStep.skippable : false;
  const analytics = OnboardingService.getAnalytics();

  const value: OnboardingContextType = {
    // State
    isOnboarding,
    hasCompletedOnboarding,
    currentStep,
    allSteps,
    progress,
    loading,
    
    // Analytics
    analytics,
    
    // Actions
    startOnboarding,
    completeStep,
    skipStep,
    goToPreviousStep,
    goToStep,
    completeOnboarding,
    resetOnboarding,
    
    // Utilities
    isComplete,
    canGoBack,
    canSkipCurrent,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export default OnboardingProvider;
