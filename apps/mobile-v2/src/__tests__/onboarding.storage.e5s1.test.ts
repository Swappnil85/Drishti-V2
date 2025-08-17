/**
 * E5-S1: Onboarding Storage Service Tests
 * Tests for onboarding progress persistence and profile management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingStorageService } from '../services/onboardingStorage';
import { OnboardingProgress, Profile, DEFAULT_PROFILE } from '../types/onboarding';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('E5-S1: OnboardingStorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Progress Management', () => {
    it('should save onboarding progress', async () => {
      const progress: OnboardingProgress = {
        currentStep: 1,
        completedSteps: ['welcome'],
        skippedSteps: [],
        profile: { currency: 'USD' },
        startedAt: Date.now(),
        lastUpdatedAt: Date.now(),
        isComplete: false,
      };

      await OnboardingStorageService.saveProgress(progress);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'onboarding_progress',
        JSON.stringify(progress)
      );
    });

    it('should load onboarding progress', async () => {
      const progress: OnboardingProgress = {
        currentStep: 2,
        completedSteps: ['welcome', 'currency'],
        skippedSteps: [],
        profile: { currency: 'AUD' },
        startedAt: Date.now(),
        lastUpdatedAt: Date.now(),
        isComplete: false,
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(progress));

      const result = await OnboardingStorageService.loadProgress();

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('onboarding_progress');
      expect(result).toEqual(progress);
    });

    it('should return null when no progress exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await OnboardingStorageService.loadProgress();

      expect(result).toBeNull();
    });

    it('should clear onboarding progress', async () => {
      await OnboardingStorageService.clearProgress();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('onboarding_progress');
    });
  });

  describe('Completion Management', () => {
    it('should mark onboarding as completed', async () => {
      await OnboardingStorageService.markCompleted();

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'onboarding_completed',
        'true'
      );
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('onboarding_progress');
    });

    it('should check if onboarding is completed', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('true');

      const result = await OnboardingStorageService.isCompleted();

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('onboarding_completed');
      expect(result).toBe(true);
    });

    it('should return false when onboarding is not completed', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await OnboardingStorageService.isCompleted();

      expect(result).toBe(false);
    });

    it('should reset onboarding state', async () => {
      await OnboardingStorageService.reset();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('onboarding_completed');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('onboarding_progress');
    });
  });

  describe('Profile Management', () => {
    it('should save user profile', async () => {
      const profile: Profile = {
        currency: 'EUR',
        theme: 'dark',
        privacyLocalOnly: true,
        hasSampleData: false,
      };

      await OnboardingStorageService.saveProfile(profile);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'user_profile',
        JSON.stringify(profile)
      );
    });

    it('should load user profile', async () => {
      const profile: Profile = {
        currency: 'GBP',
        theme: 'light',
        privacyLocalOnly: false,
        hasSampleData: true,
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(profile));

      const result = await OnboardingStorageService.loadProfile();

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('user_profile');
      expect(result).toEqual(profile);
    });

    it('should return default profile when no profile exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await OnboardingStorageService.loadProfile();

      expect(result).toEqual(DEFAULT_PROFILE);
    });

    it('should merge with default profile for partial data', async () => {
      const partialProfile = { currency: 'CAD' };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(partialProfile));

      const result = await OnboardingStorageService.loadProfile();

      expect(result).toEqual({
        ...DEFAULT_PROFILE,
        currency: 'CAD',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await OnboardingStorageService.loadProgress();

      expect(result).toBeNull();
    });

    it('should handle profile loading errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await OnboardingStorageService.loadProfile();

      expect(result).toEqual(DEFAULT_PROFILE);
    });

    it('should handle completion check errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await OnboardingStorageService.isCompleted();

      expect(result).toBe(false);
    });
  });
});
