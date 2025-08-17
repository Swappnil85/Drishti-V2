/**
 * Onboarding Storage Service for E5-S1
 * Handles persistence of onboarding progress and profile data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  OnboardingProgress,
  Profile,
  DEFAULT_PROFILE,
} from '../types/onboarding';

const STORAGE_KEYS = {
  ONBOARDING_PROGRESS: 'onboarding_progress',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  USER_PROFILE: 'user_profile',
} as const;

export class OnboardingStorageService {
  /**
   * Save onboarding progress
   */
  static async saveProgress(progress: OnboardingProgress): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.ONBOARDING_PROGRESS,
        JSON.stringify(progress)
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save onboarding progress:', error);
      throw error;
    }
  }

  /**
   * Load onboarding progress
   */
  static async loadProgress(): Promise<OnboardingProgress | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_PROGRESS);
      if (!raw) {
        return null;
      }

      return JSON.parse(raw) as OnboardingProgress;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load onboarding progress:', error);
      return null;
    }
  }

  /**
   * Clear onboarding progress
   */
  static async clearProgress(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_PROGRESS);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to clear onboarding progress:', error);
      throw error;
    }
  }

  /**
   * Mark onboarding as completed
   */
  static async markCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      await this.clearProgress();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to mark onboarding as completed:', error);
      throw error;
    }
  }

  /**
   * Check if onboarding is completed
   */
  static async isCompleted(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(
        STORAGE_KEYS.ONBOARDING_COMPLETED
      );
      return completed === 'true';
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to check onboarding completion:', error);
      return false;
    }
  }

  /**
   * Reset onboarding (for testing/debugging)
   */
  static async reset(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_PROGRESS);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to reset onboarding:', error);
      throw error;
    }
  }

  /**
   * Save user profile
   */
  static async saveProfile(profile: Profile): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PROFILE,
        JSON.stringify(profile)
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save user profile:', error);
      throw error;
    }
  }

  /**
   * Load user profile
   */
  static async loadProfile(): Promise<Profile> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (!raw) {
        return DEFAULT_PROFILE;
      }

      return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load user profile:', error);
      return DEFAULT_PROFILE;
    }
  }
}
