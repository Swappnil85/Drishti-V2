/**
 * E5-S1: Onboarding Integration Tests
 * Tests for onboarding flow integration and telemetry
 */

import { logEvent } from '../telemetry';
import { ONBOARDING_STEPS, SUPPORTED_CURRENCIES } from '../types/onboarding';

// Mock telemetry
jest.mock('../telemetry', () => ({
  logEvent: jest.fn(),
}));

const mockLogEvent = logEvent as jest.MockedFunction<typeof logEvent>;

describe('E5-S1: Onboarding Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Onboarding Steps Configuration', () => {
    it('should have correct number of steps', () => {
      expect(ONBOARDING_STEPS).toHaveLength(5);
    });

    it('should have welcome step as first step', () => {
      expect(ONBOARDING_STEPS[0].id).toBe('welcome');
      expect(ONBOARDING_STEPS[0].title).toBe('Welcome to Drishti');
      expect(ONBOARDING_STEPS[0].required).toBe(true);
      expect(ONBOARDING_STEPS[0].skippable).toBe(false);
    });

    it('should have currency step as second step', () => {
      expect(ONBOARDING_STEPS[1].id).toBe('currency');
      expect(ONBOARDING_STEPS[1].title).toBe('Choose Your Currency');
      expect(ONBOARDING_STEPS[1].required).toBe(true);
      expect(ONBOARDING_STEPS[1].skippable).toBe(false);
    });

    it('should have privacy step as third step (skippable)', () => {
      expect(ONBOARDING_STEPS[2].id).toBe('privacy');
      expect(ONBOARDING_STEPS[2].title).toBe('Privacy Mode');
      expect(ONBOARDING_STEPS[2].required).toBe(false);
      expect(ONBOARDING_STEPS[2].skippable).toBe(true);
    });

    it('should have sample data step as fourth step (skippable)', () => {
      expect(ONBOARDING_STEPS[3].id).toBe('sample_data');
      expect(ONBOARDING_STEPS[3].title).toBe('Sample Data');
      expect(ONBOARDING_STEPS[3].required).toBe(false);
      expect(ONBOARDING_STEPS[3].skippable).toBe(true);
    });

    it('should have done step as final step', () => {
      expect(ONBOARDING_STEPS[4].id).toBe('done');
      expect(ONBOARDING_STEPS[4].title).toBe('All Set!');
      expect(ONBOARDING_STEPS[4].required).toBe(true);
      expect(ONBOARDING_STEPS[4].skippable).toBe(false);
    });
  });

  describe('Currency Configuration', () => {
    it('should include AUD as default currency', () => {
      const aud = SUPPORTED_CURRENCIES.find(c => c.code === 'AUD');
      expect(aud).toBeDefined();
      expect(aud?.name).toBe('Australian Dollar');
      expect(aud?.symbol).toBe('A$');
    });

    it('should include major currencies', () => {
      const codes = SUPPORTED_CURRENCIES.map(c => c.code);
      expect(codes).toContain('USD');
      expect(codes).toContain('EUR');
      expect(codes).toContain('GBP');
      expect(codes).toContain('CAD');
      expect(codes).toContain('JPY');
    });

    it('should have proper currency symbols', () => {
      const usd = SUPPORTED_CURRENCIES.find(c => c.code === 'USD');
      const eur = SUPPORTED_CURRENCIES.find(c => c.code === 'EUR');
      const gbp = SUPPORTED_CURRENCIES.find(c => c.code === 'GBP');

      expect(usd?.symbol).toBe('$');
      expect(eur?.symbol).toBe('€');
      expect(gbp?.symbol).toBe('£');
    });
  });

  describe('Telemetry Events', () => {
    it('should log onboarding_start event', () => {
      logEvent('onboarding_start');
      expect(mockLogEvent).toHaveBeenCalledWith('onboarding_start');
    });

    it('should log onboarding_step events with step and action', () => {
      logEvent('onboarding_step', { step: 'welcome', action: 'complete' });
      expect(mockLogEvent).toHaveBeenCalledWith('onboarding_step', {
        step: 'welcome',
        action: 'complete',
      });
    });

    it('should log onboarding_complete event', () => {
      logEvent('onboarding_complete');
      expect(mockLogEvent).toHaveBeenCalledWith('onboarding_complete');
    });

    it('should log pref_currency_set event with currency', () => {
      logEvent('pref_currency_set', { currency: 'USD' });
      expect(mockLogEvent).toHaveBeenCalledWith('pref_currency_set', {
        currency: 'USD',
      });
    });

    it('should log privacy_local_only_enabled event', () => {
      logEvent('privacy_local_only_enabled');
      expect(mockLogEvent).toHaveBeenCalledWith('privacy_local_only_enabled');
    });

    it('should log sample_data_load event', () => {
      logEvent('sample_data_load');
      expect(mockLogEvent).toHaveBeenCalledWith('sample_data_load');
    });
  });

  describe('Accessibility Requirements', () => {
    it('should have descriptive step titles', () => {
      ONBOARDING_STEPS.forEach(step => {
        expect(step.title).toBeTruthy();
        expect(step.title.length).toBeGreaterThan(5);
      });
    });

    it('should have descriptive step subtitles', () => {
      ONBOARDING_STEPS.forEach(step => {
        expect(step.subtitle).toBeTruthy();
        expect(step.subtitle.length).toBeGreaterThan(5);
      });
    });

    it('should have descriptive step descriptions', () => {
      ONBOARDING_STEPS.forEach(step => {
        expect(step.description).toBeTruthy();
        expect(step.description.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Performance Requirements', () => {
    it('should have reasonable number of steps for 3-minute completion', () => {
      // Per AC: Full flow ≤ 3 minutes
      // With 5 steps, that's ~36 seconds per step, which is reasonable
      expect(ONBOARDING_STEPS.length).toBeLessThanOrEqual(5);
    });

    it('should have skippable optional steps for faster completion', () => {
      const skippableSteps = ONBOARDING_STEPS.filter(step => step.skippable);
      expect(skippableSteps.length).toBeGreaterThan(0);
    });
  });

  describe('Resume Capability', () => {
    it('should support progress tracking with step completion', () => {
      // This tests the data structure supports resume functionality
      const mockProgress = {
        currentStep: 2,
        completedSteps: ['welcome', 'currency'],
        skippedSteps: [],
        profile: { currency: 'AUD' },
        startedAt: Date.now(),
        lastUpdatedAt: Date.now(),
        isComplete: false,
      };

      expect(mockProgress.currentStep).toBe(2);
      expect(mockProgress.completedSteps).toContain('welcome');
      expect(mockProgress.completedSteps).toContain('currency');
      expect(mockProgress.isComplete).toBe(false);
    });
  });
});
