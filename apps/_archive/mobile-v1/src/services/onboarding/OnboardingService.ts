/**
 * Onboarding Service
 * Manages user onboarding flow, progress tracking, and personalization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  illustration: string;
  required: boolean;
  completed: boolean;
  skippable: boolean;
  estimatedTime: number; // in seconds
}

export interface OnboardingProfile {
  age?: number;
  financialSituation: 'beginner' | 'intermediate' | 'advanced';
  primaryGoal: 'fire' | 'retirement' | 'savings' | 'investment';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  hasExistingAccounts: boolean;
  preferredLearningStyle: 'visual' | 'text' | 'interactive';
}

export interface OnboardingProgress {
  currentStep: number;
  completedSteps: string[];
  skippedSteps: string[];
  profile: Partial<OnboardingProfile>;
  startedAt: number;
  lastUpdatedAt: number;
  estimatedTimeRemaining: number;
  personalizedPath: string[];
}

export interface OnboardingVariant {
  id: string;
  name: string;
  description: string;
  steps: OnboardingStep[];
  targetAudience: string[];
  conversionRate?: number;
}

class OnboardingService {
  private storageKey = 'ONBOARDING_PROGRESS';
  private variantsKey = 'ONBOARDING_VARIANTS';
  private currentProgress: OnboardingProgress | null = null;
  private variants: OnboardingVariant[] = [];
  private currentVariant: OnboardingVariant | null = null;

  constructor() {
    this.initializeVariants();
  }

  /**
   * Initialize onboarding variants for A/B testing
   */
  private initializeVariants() {
    this.variants = [
      {
        id: 'default',
        name: 'Default Onboarding',
        description: 'Standard 5-step onboarding flow',
        targetAudience: ['all'],
        steps: this.getDefaultSteps(),
      },
      {
        id: 'fire_focused',
        name: 'FIRE-Focused Onboarding',
        description: 'FIRE methodology emphasis',
        targetAudience: ['fire', 'advanced'],
        steps: this.getFIREFocusedSteps(),
      },
      {
        id: 'beginner_friendly',
        name: 'Beginner-Friendly Onboarding',
        description: 'Extra education and guidance',
        targetAudience: ['beginner'],
        steps: this.getBeginnerFriendlySteps(),
      },
    ];
  }

  /**
   * Get default onboarding steps
   */
  private getDefaultSteps(): OnboardingStep[] {
    return [
      {
        id: 'welcome',
        title: 'Welcome to Drishti',
        subtitle: 'Your FIRE Journey Starts Here',
        description: 'Drishti helps you achieve Financial Independence and Retire Early through smart planning and tracking.',
        illustration: 'welcome',
        required: true,
        completed: false,
        skippable: false,
        estimatedTime: 30,
      },
      {
        id: 'fire_education',
        title: 'What is FIRE?',
        subtitle: 'Financial Independence, Retire Early',
        description: 'Learn the fundamentals of FIRE methodology and how it can transform your financial future.',
        illustration: 'fire_education',
        required: false,
        completed: false,
        skippable: true,
        estimatedTime: 60,
      },
      {
        id: 'profile_setup',
        title: 'Tell Us About Yourself',
        subtitle: 'Personalize Your Experience',
        description: 'Share your age, income, and financial goals so we can provide personalized recommendations.',
        illustration: 'profile_setup',
        required: true,
        completed: false,
        skippable: false,
        estimatedTime: 90,
      },
      {
        id: 'first_account',
        title: 'Add Your First Account',
        subtitle: 'Track Your Progress',
        description: 'Connect your primary savings or checking account to start tracking your FIRE journey.',
        illustration: 'first_account',
        required: false,
        completed: false,
        skippable: true,
        estimatedTime: 60,
      },
      {
        id: 'first_goal',
        title: 'Set Your FIRE Goal',
        subtitle: 'Define Your Target',
        description: 'Create your first FIRE goal based on your profile and start tracking your progress.',
        illustration: 'first_goal',
        required: true,
        completed: false,
        skippable: false,
        estimatedTime: 90,
      },
    ];
  }

  /**
   * Get FIRE-focused onboarding steps
   */
  private getFIREFocusedSteps(): OnboardingStep[] {
    return [
      {
        id: 'welcome',
        title: 'Welcome to Advanced FIRE Planning',
        subtitle: 'Accelerate Your Journey',
        description: 'Advanced tools and strategies for experienced FIRE practitioners.',
        illustration: 'welcome_advanced',
        required: true,
        completed: false,
        skippable: false,
        estimatedTime: 20,
      },
      {
        id: 'fire_strategies',
        title: 'FIRE Strategies',
        subtitle: 'Lean, Fat, or Barista FIRE?',
        description: 'Explore different FIRE approaches and find the one that fits your lifestyle.',
        illustration: 'fire_strategies',
        required: false,
        completed: false,
        skippable: true,
        estimatedTime: 90,
      },
      {
        id: 'advanced_profile',
        title: 'Advanced Profile Setup',
        subtitle: 'Detailed Financial Picture',
        description: 'Set up comprehensive financial profile including multiple income sources and investment accounts.',
        illustration: 'advanced_profile',
        required: true,
        completed: false,
        skippable: false,
        estimatedTime: 120,
      },
      {
        id: 'portfolio_setup',
        title: 'Portfolio Configuration',
        subtitle: 'Investment Strategy',
        description: 'Configure your investment portfolio and asset allocation strategy.',
        illustration: 'portfolio_setup',
        required: false,
        completed: false,
        skippable: true,
        estimatedTime: 90,
      },
      {
        id: 'scenario_planning',
        title: 'Scenario Planning',
        subtitle: 'Plan for Different Outcomes',
        description: 'Create scenarios for different market conditions and life events.',
        illustration: 'scenario_planning',
        required: true,
        completed: false,
        skippable: false,
        estimatedTime: 120,
      },
    ];
  }

  /**
   * Get beginner-friendly onboarding steps
   */
  private getBeginnerFriendlySteps(): OnboardingStep[] {
    return [
      {
        id: 'welcome',
        title: 'Welcome to Your Financial Journey',
        subtitle: 'Start Building Wealth Today',
        description: 'Take the first step towards financial freedom with easy-to-follow guidance.',
        illustration: 'welcome_beginner',
        required: true,
        completed: false,
        skippable: false,
        estimatedTime: 30,
      },
      {
        id: 'financial_basics',
        title: 'Financial Basics',
        subtitle: 'Building Strong Foundations',
        description: 'Learn essential financial concepts: budgeting, saving, and investing basics.',
        illustration: 'financial_basics',
        required: false,
        completed: false,
        skippable: true,
        estimatedTime: 120,
      },
      {
        id: 'fire_introduction',
        title: 'Introduction to FIRE',
        subtitle: 'A New Way to Think About Money',
        description: 'Discover how FIRE can help you achieve financial independence faster than traditional methods.',
        illustration: 'fire_intro',
        required: false,
        completed: false,
        skippable: true,
        estimatedTime: 90,
      },
      {
        id: 'simple_profile',
        title: 'Simple Profile Setup',
        subtitle: 'Just the Basics',
        description: 'Start with basic information - you can always add more details later.',
        illustration: 'simple_profile',
        required: true,
        completed: false,
        skippable: false,
        estimatedTime: 60,
      },
      {
        id: 'first_steps',
        title: 'Your First Steps',
        subtitle: 'Small Steps, Big Results',
        description: 'Set up your first savings goal and learn how small changes can make a big difference.',
        illustration: 'first_steps',
        required: true,
        completed: false,
        skippable: false,
        estimatedTime: 90,
      },
    ];
  }

  /**
   * Start onboarding flow
   */
  async startOnboarding(profile?: Partial<OnboardingProfile>): Promise<OnboardingProgress> {
    // Select appropriate variant based on profile
    const variant = this.selectVariant(profile);
    this.currentVariant = variant;

    // Create initial progress
    const progress: OnboardingProgress = {
      currentStep: 0,
      completedSteps: [],
      skippedSteps: [],
      profile: profile || {},
      startedAt: Date.now(),
      lastUpdatedAt: Date.now(),
      estimatedTimeRemaining: this.calculateTotalTime(variant.steps),
      personalizedPath: variant.steps.map(step => step.id),
    };

    this.currentProgress = progress;
    await this.saveProgress();

    return progress;
  }

  /**
   * Select onboarding variant based on user profile
   */
  private selectVariant(profile?: Partial<OnboardingProfile>): OnboardingVariant {
    if (!profile) {
      return this.variants.find(v => v.id === 'default')!;
    }

    // FIRE-focused variant for advanced users
    if (profile.financialSituation === 'advanced' || profile.primaryGoal === 'fire') {
      return this.variants.find(v => v.id === 'fire_focused')!;
    }

    // Beginner-friendly variant for new users
    if (profile.financialSituation === 'beginner') {
      return this.variants.find(v => v.id === 'beginner_friendly')!;
    }

    // Default variant for intermediate users
    return this.variants.find(v => v.id === 'default')!;
  }

  /**
   * Calculate total estimated time for steps
   */
  private calculateTotalTime(steps: OnboardingStep[]): number {
    return steps.reduce((total, step) => total + step.estimatedTime, 0);
  }

  /**
   * Get current onboarding progress
   */
  async getProgress(): Promise<OnboardingProgress | null> {
    if (this.currentProgress) {
      return this.currentProgress;
    }

    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        this.currentProgress = JSON.parse(stored);
        return this.currentProgress;
      }
    } catch (error) {
      console.error('Failed to load onboarding progress:', error);
    }

    return null;
  }

  /**
   * Complete current step and move to next
   */
  async completeStep(stepId: string, data?: any): Promise<OnboardingProgress | null> {
    if (!this.currentProgress || !this.currentVariant) {
      return null;
    }

    const stepIndex = this.currentVariant.steps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) {
      return null;
    }

    // Mark step as completed
    if (!this.currentProgress.completedSteps.includes(stepId)) {
      this.currentProgress.completedSteps.push(stepId);
    }

    // Update step data
    this.currentVariant.steps[stepIndex].completed = true;

    // Move to next step
    if (stepIndex < this.currentVariant.steps.length - 1) {
      this.currentProgress.currentStep = stepIndex + 1;
    }

    // Update progress
    this.currentProgress.lastUpdatedAt = Date.now();
    this.currentProgress.estimatedTimeRemaining = this.calculateRemainingTime();

    // Merge step data into profile
    if (data) {
      this.currentProgress.profile = { ...this.currentProgress.profile, ...data };
    }

    await this.saveProgress();
    return this.currentProgress;
  }

  /**
   * Skip current step
   */
  async skipStep(stepId: string): Promise<OnboardingProgress | null> {
    if (!this.currentProgress || !this.currentVariant) {
      return null;
    }

    const stepIndex = this.currentVariant.steps.findIndex(step => step.id === stepId);
    if (stepIndex === -1 || !this.currentVariant.steps[stepIndex].skippable) {
      return null;
    }

    // Mark step as skipped
    if (!this.currentProgress.skippedSteps.includes(stepId)) {
      this.currentProgress.skippedSteps.push(stepId);
    }

    // Move to next step
    if (stepIndex < this.currentVariant.steps.length - 1) {
      this.currentProgress.currentStep = stepIndex + 1;
    }

    // Update progress
    this.currentProgress.lastUpdatedAt = Date.now();
    this.currentProgress.estimatedTimeRemaining = this.calculateRemainingTime();

    await this.saveProgress();
    return this.currentProgress;
  }

  /**
   * Go to previous step
   */
  async goToPreviousStep(): Promise<OnboardingProgress | null> {
    if (!this.currentProgress || this.currentProgress.currentStep <= 0) {
      return null;
    }

    this.currentProgress.currentStep -= 1;
    this.currentProgress.lastUpdatedAt = Date.now();

    await this.saveProgress();
    return this.currentProgress;
  }

  /**
   * Go to specific step
   */
  async goToStep(stepIndex: number): Promise<OnboardingProgress | null> {
    if (!this.currentProgress || !this.currentVariant) {
      return null;
    }

    if (stepIndex < 0 || stepIndex >= this.currentVariant.steps.length) {
      return null;
    }

    this.currentProgress.currentStep = stepIndex;
    this.currentProgress.lastUpdatedAt = Date.now();

    await this.saveProgress();
    return this.currentProgress;
  }

  /**
   * Calculate remaining time based on incomplete steps
   */
  private calculateRemainingTime(): number {
    if (!this.currentVariant || !this.currentProgress) {
      return 0;
    }

    const remainingSteps = this.currentVariant.steps.slice(this.currentProgress.currentStep);
    return remainingSteps.reduce((total, step) => {
      if (!this.currentProgress!.completedSteps.includes(step.id)) {
        return total + step.estimatedTime;
      }
      return total;
    }, 0);
  }

  /**
   * Get current step
   */
  getCurrentStep(): OnboardingStep | null {
    if (!this.currentProgress || !this.currentVariant) {
      return null;
    }

    return this.currentVariant.steps[this.currentProgress.currentStep] || null;
  }

  /**
   * Get all steps for current variant
   */
  getAllSteps(): OnboardingStep[] {
    return this.currentVariant?.steps || [];
  }

  /**
   * Check if onboarding is complete
   */
  isComplete(): boolean {
    if (!this.currentProgress || !this.currentVariant) {
      return false;
    }

    const requiredSteps = this.currentVariant.steps.filter(step => step.required);
    return requiredSteps.every(step => 
      this.currentProgress!.completedSteps.includes(step.id)
    );
  }

  /**
   * Complete onboarding
   */
  async completeOnboarding(): Promise<void> {
    if (!this.currentProgress) {
      return;
    }

    // Mark onboarding as completed
    await AsyncStorage.setItem('ONBOARDING_COMPLETED', 'true');
    
    // Clear progress
    await AsyncStorage.removeItem(this.storageKey);
    this.currentProgress = null;
    this.currentVariant = null;
  }

  /**
   * Check if user has completed onboarding
   */
  async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem('ONBOARDING_COMPLETED');
      return completed === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Reset onboarding (for testing)
   */
  async resetOnboarding(): Promise<void> {
    await AsyncStorage.removeItem(this.storageKey);
    await AsyncStorage.removeItem('ONBOARDING_COMPLETED');
    this.currentProgress = null;
    this.currentVariant = null;
  }

  /**
   * Save progress to storage
   */
  private async saveProgress(): Promise<void> {
    if (!this.currentProgress) {
      return;
    }

    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.currentProgress));
    } catch (error) {
      console.error('Failed to save onboarding progress:', error);
    }
  }

  /**
   * Get onboarding analytics
   */
  getAnalytics(): {
    totalSteps: number;
    completedSteps: number;
    skippedSteps: number;
    progressPercentage: number;
    timeSpent: number;
    estimatedTimeRemaining: number;
  } {
    if (!this.currentProgress || !this.currentVariant) {
      return {
        totalSteps: 0,
        completedSteps: 0,
        skippedSteps: 0,
        progressPercentage: 0,
        timeSpent: 0,
        estimatedTimeRemaining: 0,
      };
    }

    const totalSteps = this.currentVariant.steps.length;
    const completedSteps = this.currentProgress.completedSteps.length;
    const skippedSteps = this.currentProgress.skippedSteps.length;
    const progressPercentage = (completedSteps / totalSteps) * 100;
    const timeSpent = Date.now() - this.currentProgress.startedAt;

    return {
      totalSteps,
      completedSteps,
      skippedSteps,
      progressPercentage,
      timeSpent,
      estimatedTimeRemaining: this.currentProgress.estimatedTimeRemaining,
    };
  }
}

export default new OnboardingService();
