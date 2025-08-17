/**
 * Onboarding Context for E5-S1
 * Manages onboarding flow state and navigation
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  OnboardingProgress,
  Profile,
  ONBOARDING_STEPS,
  DEFAULT_PROFILE,
} from '../types/onboarding';
import { OnboardingStorageService } from '../services/onboardingStorage';
import { logEvent } from '../telemetry';

interface OnboardingContextValue {
  // State
  progress: OnboardingProgress | null;
  profile: Profile;
  currentStep: number;
  isLoading: boolean;
  isComplete: boolean;
  hasCompletedOnboarding: boolean;

  // Actions
  startOnboarding: () => Promise<void>;
  nextStep: () => Promise<void>;
  previousStep: () => Promise<void>;
  skipStep: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  resetOnboarding: () => Promise<void>;

  // Computed
  canGoBack: boolean;
  canSkip: boolean;
  currentStepData: (typeof ONBOARDING_STEPS)[0] | null;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined
);

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Initialize onboarding state
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);

        // Check if onboarding is completed
        const completed = await OnboardingStorageService.isCompleted();
        setHasCompletedOnboarding(completed);

        // Load profile
        const savedProfile = await OnboardingStorageService.loadProfile();
        setProfile(savedProfile);

        // Load progress if not completed
        if (!completed) {
          const savedProgress = await OnboardingStorageService.loadProgress();
          setProgress(savedProgress);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to initialize onboarding:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const startOnboarding = useCallback(async () => {
    const newProgress: OnboardingProgress = {
      currentStep: 0,
      completedSteps: [],
      skippedSteps: [],
      profile: { ...profile },
      startedAt: Date.now(),
      lastUpdatedAt: Date.now(),
      isComplete: false,
    };

    setProgress(newProgress);
    await OnboardingStorageService.saveProgress(newProgress);
    logEvent('onboarding_start');
  }, [profile]);

  const nextStep = useCallback(async () => {
    if (!progress) {
      return;
    }

    const currentStepId = ONBOARDING_STEPS[progress.currentStep]?.id;
    if (currentStepId) {
      const updatedProgress = {
        ...progress,
        currentStep: progress.currentStep + 1,
        completedSteps: [...progress.completedSteps, currentStepId],
        lastUpdatedAt: Date.now(),
      };

      setProgress(updatedProgress);
      await OnboardingStorageService.saveProgress(updatedProgress);
      logEvent('onboarding_step', { step: currentStepId, action: 'complete' });

      // Check if onboarding is complete
      if (updatedProgress.currentStep >= ONBOARDING_STEPS.length) {
        await completeOnboarding();
      }
    }
  }, [progress]);

  const previousStep = useCallback(async () => {
    if (!progress || progress.currentStep <= 0) {
      return;
    }

    const updatedProgress = {
      ...progress,
      currentStep: progress.currentStep - 1,
      lastUpdatedAt: Date.now(),
    };

    setProgress(updatedProgress);
    await OnboardingStorageService.saveProgress(updatedProgress);
    logEvent('onboarding_step', {
      step: ONBOARDING_STEPS[updatedProgress.currentStep]?.id,
      action: 'back',
    });
  }, [progress]);

  const skipStep = useCallback(async () => {
    if (!progress) {
      return;
    }

    const currentStepId = ONBOARDING_STEPS[progress.currentStep]?.id;
    if (currentStepId && ONBOARDING_STEPS[progress.currentStep]?.skippable) {
      const updatedProgress = {
        ...progress,
        currentStep: progress.currentStep + 1,
        skippedSteps: [...progress.skippedSteps, currentStepId],
        lastUpdatedAt: Date.now(),
      };

      setProgress(updatedProgress);
      await OnboardingStorageService.saveProgress(updatedProgress);
      logEvent('onboarding_step', { step: currentStepId, action: 'skip' });

      // Check if onboarding is complete
      if (updatedProgress.currentStep >= ONBOARDING_STEPS.length) {
        await completeOnboarding();
      }
    }
  }, [progress]);

  const completeOnboarding = useCallback(async () => {
    await OnboardingStorageService.markCompleted();
    await OnboardingStorageService.saveProfile(profile);
    setHasCompletedOnboarding(true);
    setProgress(null);
    logEvent('onboarding_complete');
  }, [profile]);

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      const updatedProfile = { ...profile, ...updates };
      setProfile(updatedProfile);

      if (progress) {
        const updatedProgress = {
          ...progress,
          profile: { ...progress.profile, ...updates },
          lastUpdatedAt: Date.now(),
        };
        setProgress(updatedProgress);
        await OnboardingStorageService.saveProgress(updatedProgress);
      }
    },
    [profile, progress]
  );

  const resetOnboarding = useCallback(async () => {
    await OnboardingStorageService.reset();
    setHasCompletedOnboarding(false);
    setProgress(null);
    setProfile(DEFAULT_PROFILE);
  }, []);

  // Computed values
  const currentStep = progress?.currentStep ?? 0;
  const isComplete = progress?.isComplete ?? false;
  const canGoBack = currentStep > 0;
  const canSkip = ONBOARDING_STEPS[currentStep]?.skippable ?? false;
  const currentStepData = ONBOARDING_STEPS[currentStep] ?? null;

  const value: OnboardingContextValue = {
    progress,
    profile,
    currentStep,
    isLoading,
    isComplete,
    hasCompletedOnboarding,
    startOnboarding,
    nextStep,
    previousStep,
    skipStep,
    completeOnboarding,
    updateProfile,
    resetOnboarding,
    canGoBack,
    canSkip,
    currentStepData,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
