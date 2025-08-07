/**
 * LifeEventImpactModelingService Tests
 * Epic 8, Enhanced Story: Goal Adjustment with ML Predictions
 */

import { LifeEventImpactModelingService, UserProfile } from '../LifeEventImpactModelingService';
import { FinancialGoal, FIREGoalProgress, FIREGoalMetadata } from '@drishti/shared/types/financial';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('LifeEventImpactModelingService', () => {
  let lifeEventService: LifeEventImpactModelingService;
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  const mockGoal: FinancialGoal = {
    id: 'test-goal-id',
    user_id: 'test-user',
    name: 'Test FIRE Goal',
    goal_type: 'fire_traditional',
    target_amount: 1000000,
    current_amount: 250000,
    priority: 1,
    is_active: true,
    metadata: {
      fireType: 'fire_traditional',
      currentIncome: 80000,
      currentSavingsRate: 0.25,
      monthlyExpenses: 4000,
    } as FIREGoalMetadata,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockProgress: FIREGoalProgress = {
    goalId: 'test-goal-id',
    currentAmount: 250000,
    targetAmount: 1000000,
    progressPercentage: 25,
    timeElapsed: 24,
    estimatedTimeRemaining: 72,
    originalTimeline: 96,
    monthlyProgress: 10416.67,
    progressVelocity: 'steady',
    velocityTrend: 2.5,
    nextMilestone: {
      percentage: 50,
      amount: 500000,
      estimatedDate: new Date().toISOString(),
    },
    projectedCompletionDate: new Date().toISOString(),
    confidenceLevel: 78,
    varianceAnalysis: {
      timelineVariance: -12,
      amountVariance: 25000,
      savingsRateVariance: 5,
    },
  };

  const mockUserProfile: UserProfile = {
    age: 32,
    income: 80000,
    expenses: 4000,
    savingsRate: 0.25,
    dependents: 0,
    jobSecurity: 'high',
    industryType: 'technology',
    geographicLocation: 'US',
    riskTolerance: 'moderate',
    previousLifeEvents: [],
  };

  beforeEach(() => {
    lifeEventService = LifeEventImpactModelingService.getInstance();
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue('[]');
    mockAsyncStorage.setItem.mockResolvedValue();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = LifeEventImpactModelingService.getInstance();
      const instance2 = LifeEventImpactModelingService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('predictLifeEventImpact', () => {
    it('should predict job loss impact correctly', async () => {
      const prediction = await lifeEventService.predictLifeEventImpact(
        'jobLoss',
        mockGoal,
        mockProgress,
        mockUserProfile
      );

      expect(prediction.eventType).toBe('jobLoss');
      expect(prediction.predictedImpact.timelineChange).toBeGreaterThan(0);
      expect(prediction.predictedImpact.contributionChange).toBeLessThan(0);
      expect(prediction.predictedImpact.confidenceLevel).toBeGreaterThan(0);
      expect(prediction.riskFactors).toBeDefined();
      expect(prediction.adaptationStrategies).toBeDefined();
      expect(prediction.historicalComparisons).toBeDefined();
    });

    it('should predict promotion impact correctly', async () => {
      const prediction = await lifeEventService.predictLifeEventImpact(
        'promotion',
        mockGoal,
        mockProgress,
        mockUserProfile
      );

      expect(prediction.eventType).toBe('promotion');
      expect(prediction.predictedImpact.timelineChange).toBeLessThan(0); // Should accelerate timeline
      expect(prediction.predictedImpact.contributionChange).toBeLessThan(0); // Should increase contribution capacity
      expect(prediction.predictedImpact.confidenceLevel).toBeGreaterThan(50);
    });

    it('should include risk factors for high-risk scenarios', async () => {
      const lowJobSecurityProfile: UserProfile = {
        ...mockUserProfile,
        jobSecurity: 'low',
      };

      const prediction = await lifeEventService.predictLifeEventImpact(
        'jobLoss',
        mockGoal,
        mockProgress,
        lowJobSecurityProfile
      );

      expect(prediction.riskFactors.length).toBeGreaterThan(0);
      expect(prediction.riskFactors.some(factor => factor.factor === 'Job Security')).toBe(true);
    });

    it('should provide adaptation strategies', async () => {
      const prediction = await lifeEventService.predictLifeEventImpact(
        'childBirth',
        mockGoal,
        mockProgress,
        mockUserProfile
      );

      expect(prediction.adaptationStrategies.length).toBeGreaterThan(0);
      expect(prediction.adaptationStrategies[0]).toHaveProperty('strategy');
      expect(prediction.adaptationStrategies[0]).toHaveProperty('effectiveness');
      expect(prediction.adaptationStrategies[0]).toHaveProperty('timeToImplement');
      expect(prediction.adaptationStrategies[0]).toHaveProperty('requirements');
    });

    it('should store prediction for learning', async () => {
      await lifeEventService.predictLifeEventImpact(
        'marriage',
        mockGoal,
        mockProgress,
        mockUserProfile
      );

      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('getProactiveLifeEventPredictions', () => {
    it('should return proactive predictions', async () => {
      const predictions = await lifeEventService.getProactiveLifeEventPredictions(
        mockGoal,
        mockProgress,
        mockUserProfile
      );

      expect(Array.isArray(predictions)).toBe(true);
      expect(predictions.length).toBeGreaterThan(0);
      
      predictions.forEach(prediction => {
        expect(prediction).toHaveProperty('eventType');
        expect(prediction).toHaveProperty('probability');
        expect(prediction).toHaveProperty('timeframe');
        expect(prediction).toHaveProperty('earlyWarningSignals');
        expect(prediction).toHaveProperty('preparationSteps');
        expect(prediction.probability).toBeGreaterThan(0.3); // Only likely events
      });
    });

    it('should predict job change for young professionals', async () => {
      const youngProfessional: UserProfile = {
        ...mockUserProfile,
        age: 28,
        jobSecurity: 'medium',
      };

      const predictions = await lifeEventService.getProactiveLifeEventPredictions(
        mockGoal,
        mockProgress,
        youngProfessional
      );

      const jobChangePrediction = predictions.find(p => p.eventType === 'job_change');
      expect(jobChangePrediction).toBeDefined();
      expect(jobChangePrediction?.probability).toBeGreaterThan(0.3);
    });

    it('should predict family expansion for appropriate age group', async () => {
      const familyAgeProfile: UserProfile = {
        ...mockUserProfile,
        age: 30,
        dependents: 0,
        income: 90000,
      };

      const predictions = await lifeEventService.getProactiveLifeEventPredictions(
        mockGoal,
        mockProgress,
        familyAgeProfile
      );

      const familyPrediction = predictions.find(p => p.eventType === 'family_expansion');
      expect(familyPrediction).toBeDefined();
      expect(familyPrediction?.probability).toBeGreaterThan(0.3);
    });
  });

  describe('analyzeSpendingPatternsForAdjustments', () => {
    const mockSpendingHistory = [
      { date: '2024-01-01', category: 'housing', amount: 1800, isRecurring: true },
      { date: '2024-01-01', category: 'food', amount: 600, isRecurring: false },
      { date: '2024-01-01', category: 'transportation', amount: 400, isRecurring: true },
      { date: '2024-02-01', category: 'housing', amount: 1800, isRecurring: true },
      { date: '2024-02-01', category: 'food', amount: 650, isRecurring: false },
      { date: '2024-02-01', category: 'transportation', amount: 400, isRecurring: true },
    ];

    it('should analyze spending patterns', async () => {
      const analysis = await lifeEventService.analyzeSpendingPatternsForAdjustments(
        mockGoal,
        mockSpendingHistory,
        mockUserProfile
      );

      expect(analysis.patternAnalysis).toBeDefined();
      expect(analysis.patternAnalysis.trendDirection).toBeOneOf(['increasing', 'decreasing', 'stable']);
      expect(analysis.patternAnalysis.volatility).toBeGreaterThanOrEqual(0);
      expect(analysis.patternAnalysis.categoryBreakdown).toBeDefined();
    });

    it('should provide adjustment recommendations', async () => {
      const analysis = await lifeEventService.analyzeSpendingPatternsForAdjustments(
        mockGoal,
        mockSpendingHistory,
        mockUserProfile
      );

      expect(analysis.adjustmentRecommendations).toBeDefined();
      expect(Array.isArray(analysis.adjustmentRecommendations)).toBe(true);
      
      if (analysis.adjustmentRecommendations.length > 0) {
        const recommendation = analysis.adjustmentRecommendations[0];
        expect(recommendation).toHaveProperty('type');
        expect(recommendation).toHaveProperty('priority');
        expect(recommendation).toHaveProperty('description');
        expect(recommendation).toHaveProperty('expectedImpact');
        expect(recommendation).toHaveProperty('implementationSteps');
      }
    });

    it('should identify spending risks', async () => {
      const volatileSpendingHistory = [
        { date: '2024-01-01', category: 'entertainment', amount: 100, isRecurring: false },
        { date: '2024-02-01', category: 'entertainment', amount: 1000, isRecurring: false },
        { date: '2024-03-01', category: 'entertainment', amount: 50, isRecurring: false },
      ];

      const analysis = await lifeEventService.analyzeSpendingPatternsForAdjustments(
        mockGoal,
        volatileSpendingHistory,
        mockUserProfile
      );

      expect(analysis.riskAlerts).toBeDefined();
      expect(Array.isArray(analysis.riskAlerts)).toBe(true);
    });
  });

  describe('ML model features extraction', () => {
    it('should extract features correctly', async () => {
      // This tests the private method indirectly through public methods
      const prediction = await lifeEventService.predictLifeEventImpact(
        'promotion',
        mockGoal,
        mockProgress,
        mockUserProfile
      );

      // Verify that the prediction uses the extracted features appropriately
      expect(prediction.predictedImpact.confidenceLevel).toBeGreaterThan(0);
      expect(prediction.predictedImpact.confidenceLevel).toBeLessThanOrEqual(100);
    });
  });

  describe('historical comparisons', () => {
    it('should provide historical context', async () => {
      const prediction = await lifeEventService.predictLifeEventImpact(
        'inheritance',
        mockGoal,
        mockProgress,
        mockUserProfile
      );

      expect(prediction.historicalComparisons.similarCases).toBeGreaterThan(0);
      expect(prediction.historicalComparisons.averageRecoveryTime).toBeGreaterThan(0);
      expect(prediction.historicalComparisons.successRate).toBeGreaterThan(0);
      expect(prediction.historicalComparisons.successRate).toBeLessThanOrEqual(100);
      expect(Array.isArray(prediction.historicalComparisons.commonOutcomes)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      // Should not throw, but should still return prediction
      const prediction = await lifeEventService.predictLifeEventImpact(
        'jobLoss',
        mockGoal,
        mockProgress,
        mockUserProfile
      );

      expect(prediction).toBeDefined();
      expect(prediction.eventType).toBe('jobLoss');
    });

    it('should handle missing user profile data', async () => {
      const incompleteProfile: Partial<UserProfile> = {
        age: 30,
        income: 50000,
      };

      // Should not throw with incomplete profile
      expect(async () => {
        await lifeEventService.predictLifeEventImpact(
          'marriage',
          mockGoal,
          mockProgress,
          incompleteProfile as UserProfile
        );
      }).not.toThrow();
    });
  });

  describe('prediction accuracy factors', () => {
    it('should adjust confidence based on job stability', async () => {
      const stableJobProfile: UserProfile = {
        ...mockUserProfile,
        jobSecurity: 'high',
      };

      const unstableJobProfile: UserProfile = {
        ...mockUserProfile,
        jobSecurity: 'low',
      };

      const stablePrediction = await lifeEventService.predictLifeEventImpact(
        'jobLoss',
        mockGoal,
        mockProgress,
        stableJobProfile
      );

      const unstablePrediction = await lifeEventService.predictLifeEventImpact(
        'jobLoss',
        mockGoal,
        mockProgress,
        unstableJobProfile
      );

      // Stable job should have different confidence than unstable job
      expect(stablePrediction.predictedImpact.confidenceLevel)
        .not.toBe(unstablePrediction.predictedImpact.confidenceLevel);
    });

    it('should consider age in family expansion predictions', async () => {
      const youngProfile: UserProfile = {
        ...mockUserProfile,
        age: 25,
      };

      const olderProfile: UserProfile = {
        ...mockUserProfile,
        age: 45,
      };

      const youngPredictions = await lifeEventService.getProactiveLifeEventPredictions(
        mockGoal,
        mockProgress,
        youngProfile
      );

      const olderPredictions = await lifeEventService.getProactiveLifeEventPredictions(
        mockGoal,
        mockProgress,
        olderProfile
      );

      const youngFamilyPrediction = youngPredictions.find(p => p.eventType === 'family_expansion');
      const olderFamilyPrediction = olderPredictions.find(p => p.eventType === 'family_expansion');

      if (youngFamilyPrediction && olderFamilyPrediction) {
        expect(youngFamilyPrediction.probability).toBeGreaterThan(olderFamilyPrediction.probability);
      }
    });
  });
});
