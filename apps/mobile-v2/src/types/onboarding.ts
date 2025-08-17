/**
 * Onboarding types for E5-S1
 * Defines the structure for onboarding flow, progress tracking, and profile data
 */

export interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  required: boolean;
  skippable: boolean;
}

export interface OnboardingProgress {
  currentStep: number;
  completedSteps: string[];
  skippedSteps: string[];
  profile: Partial<Profile>;
  startedAt: number;
  lastUpdatedAt: number;
  isComplete: boolean;
}

export interface Profile {
  currency: string;
  theme: 'system' | 'light' | 'dark';
  privacyLocalOnly: boolean;
  hasSampleData: boolean;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Drishti',
    subtitle: 'Your Financial Journey Starts Here',
    description:
      'Drishti helps you achieve financial independence through smart planning and tracking.',
    required: true,
    skippable: false,
  },
  {
    id: 'currency',
    title: 'Choose Your Currency',
    subtitle: 'Set your preferred currency',
    description: 'Select the currency you want to use throughout the app.',
    required: true,
    skippable: false,
  },
  {
    id: 'privacy',
    title: 'Privacy Mode',
    subtitle: 'Keep your data local',
    description:
      'Choose whether to store your data only on this device or sync across devices.',
    required: false,
    skippable: true,
  },
  {
    id: 'sample_data',
    title: 'Sample Data',
    subtitle: 'Explore with demo data',
    description:
      'Load sample data to explore the app features before adding your own accounts.',
    required: false,
    skippable: true,
  },
  {
    id: 'done',
    title: 'All Set!',
    subtitle: 'Ready to start your journey',
    description:
      "You're all set up and ready to start tracking your financial progress.",
    required: true,
    skippable: false,
  },
];

export const DEFAULT_PROFILE: Profile = {
  currency: 'AUD',
  theme: 'system',
  privacyLocalOnly: false,
  hasSampleData: false,
};

export const SUPPORTED_CURRENCIES = [
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
];
