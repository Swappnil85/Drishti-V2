/**
 * GoalSuspensionService Tests
 * Epic 8, Story 3: Goal Adjustment & Impact Analysis
 */

import { GoalSuspensionService, SuspensionRecommendation } from '../GoalSuspensionService';
import { FinancialGoal, FIREGoalMetadata } from '@drishti/shared/types/financial';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('GoalSuspensionService', () => {
  let goalSuspensionService: GoalSuspensionService;
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

  beforeEach(() => {
    goalSuspensionService = GoalSuspensionService.getInstance();
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue('[]');
    mockAsyncStorage.setItem.mockResolvedValue();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = GoalSuspensionService.getInstance();
      const instance2 = GoalSuspensionService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('analyzeSuspensionNeed', () => {
    it('should recommend suspension for low emergency fund', async () => {
      const financialSituation = {
        monthlyIncome: 6000,
        monthlyExpenses: 4000,
        emergencyFund: 8000, // 2 months only
        debtPayments: 500,
        jobSecurity: 'stable' as const,
      };

      const recommendation = await goalSuspensionService.analyzeSuspensionNeed(
        mockGoal,
        financialSituation
      );

      expect(recommendation.recommendedAction).toBe('suspend');
      expect(recommendation.confidence).toBeGreaterThan(80);
      expect(recommendation.reasoning).toContain('Emergency fund below 3 months of expenses');
    });

    it('should recommend reduction for high contribution strain', async () => {
      const financialSituation = {
        monthlyIncome: 5000,
        monthlyExpenses: 4000,
        emergencyFund: 20000, // 5 months - good
        debtPayments: 200,
        jobSecurity: 'stable' as const,
      };

      const recommendation = await goalSuspensionService.analyzeSuspensionNeed(
        mockGoal,
        financialSituation
      );

      expect(recommendation.recommendedAction).toBe('reduce');
      expect(recommendation.reasoning).toContain('Current contribution rate is unsustainable');
    });

    it('should recommend suspension for job insecurity', async () => {
      const financialSituation = {
        monthlyIncome: 6000,
        monthlyExpenses: 4000,
        emergencyFund: 20000,
        debtPayments: 500,
        jobSecurity: 'at_risk' as const,
      };

      const recommendation = await goalSuspensionService.analyzeSuspensionNeed(
        mockGoal,
        financialSituation
      );

      expect(recommendation.recommendedAction).toBe('suspend');
      expect(recommendation.reasoning).toContain('Job security concerns require financial flexibility');
    });

    it('should recommend continue for healthy financial situation', async () => {
      const financialSituation = {
        monthlyIncome: 8000,
        monthlyExpenses: 4000,
        emergencyFund: 30000, // 7.5 months
        debtPayments: 500,
        jobSecurity: 'stable' as const,
      };

      const recommendation = await goalSuspensionService.analyzeSuspensionNeed(
        mockGoal,
        financialSituation
      );

      expect(recommendation.recommendedAction).toBe('continue');
      expect(recommendation.confidence).toBeGreaterThan(50);
    });

    it('should provide alternatives for suspension recommendation', async () => {
      const financialSituation = {
        monthlyIncome: 6000,
        monthlyExpenses: 4000,
        emergencyFund: 8000,
        debtPayments: 500,
        jobSecurity: 'stable' as const,
      };

      const recommendation = await goalSuspensionService.analyzeSuspensionNeed(
        mockGoal,
        financialSituation
      );

      expect(recommendation.alternatives).toHaveLength(2);
      expect(recommendation.alternatives[0].action).toContain('Reduce contributions');
      expect(recommendation.alternatives[1].action).toContain('Pause for 6 months');
    });

    it('should calculate timeline impact correctly', async () => {
      const financialSituation = {
        monthlyIncome: 6000,
        monthlyExpenses: 4000,
        emergencyFund: 8000,
        debtPayments: 500,
        jobSecurity: 'stable' as const,
      };

      const recommendation = await goalSuspensionService.analyzeSuspensionNeed(
        mockGoal,
        financialSituation
      );

      expect(recommendation.timelineImpact.suspensionMonths).toBeGreaterThan(0);
      expect(recommendation.timelineImpact.totalDelayMonths).toBeGreaterThan(
        recommendation.timelineImpact.suspensionMonths
      );
      expect(recommendation.timelineImpact.recoveryMonths).toBeGreaterThan(0);
    });
  });

  describe('suspendGoal', () => {
    it('should create suspension record successfully', async () => {
      const suspensionDetails = {
        reason: 'Job loss',
        suspensionType: 'temporary' as const,
        plannedRestartDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const suspension = await goalSuspensionService.suspendGoal(mockGoal, suspensionDetails);

      expect(suspension.goalId).toBe(mockGoal.id);
      expect(suspension.reason).toBe('Job loss');
      expect(suspension.suspensionType).toBe('temporary');
      expect(suspension.isActive).toBe(true);
      expect(suspension.impactAnalysis).toBeDefined();
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should calculate impact analysis for suspension', async () => {
      const suspensionDetails = {
        reason: 'Financial hardship',
        suspensionType: 'indefinite' as const,
      };

      const suspension = await goalSuspensionService.suspendGoal(mockGoal, suspensionDetails);

      expect(suspension.impactAnalysis.timelineExtension).toBeGreaterThan(0);
      expect(suspension.impactAnalysis.compoundingLoss).toBeGreaterThan(0);
      expect(['easy', 'moderate', 'difficult']).toContain(suspension.impactAnalysis.restartDifficulty);
    });

    it('should include restart plan when provided', async () => {
      const suspensionDetails = {
        reason: 'Temporary setback',
        suspensionType: 'temporary' as const,
        plannedRestartDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        restartPlan: {
          restartStrategy: 'gradual' as const,
          modifiedContribution: 500,
        },
      };

      const suspension = await goalSuspensionService.suspendGoal(mockGoal, suspensionDetails);

      expect(suspension.restartPlan).toBeDefined();
      expect(suspension.restartPlan?.restartStrategy).toBe('gradual');
      expect(suspension.restartPlan?.modifiedContribution).toBe(500);
    });
  });

  describe('restartGoal', () => {
    beforeEach(() => {
      const mockSuspension = {
        goalId: 'test-goal-id',
        suspensionDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        reason: 'Test suspension',
        suspensionType: 'temporary',
        impactAnalysis: {
          timelineExtension: 6,
          compoundingLoss: 5000,
          restartDifficulty: 'moderate',
        },
        isActive: true,
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([mockSuspension]));
    });

    it('should restart goal successfully', async () => {
      const result = await goalSuspensionService.restartGoal(
        'test-goal-id',
        'gradual',
        1000
      );

      expect(result.updatedGoal).toBeDefined();
      expect(result.restartPlan).toBeDefined();
      expect(result.updatedGoal.is_active).toBe(true);
      expect(result.restartPlan.restartStrategy).toBe('gradual');
    });

    it('should create appropriate restart plan for gradual strategy', async () => {
      const result = await goalSuspensionService.restartGoal(
        'test-goal-id',
        'gradual'
      );

      expect(result.restartPlan.milestones).toHaveLength(3);
      expect(result.restartPlan.milestones[0].contributionPercentage).toBe(25);
      expect(result.restartPlan.milestones[1].contributionPercentage).toBe(50);
      expect(result.restartPlan.milestones[2].contributionPercentage).toBe(100);
    });

    it('should throw error for non-existent suspension', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]');

      await expect(
        goalSuspensionService.restartGoal('non-existent-goal', 'full')
      ).rejects.toThrow('No active suspension found for this goal');
    });

    it('should update suspension record to inactive', async () => {
      await goalSuspensionService.restartGoal('test-goal-id', 'full');

      const setItemCalls = mockAsyncStorage.setItem.mock.calls;
      const lastCall = setItemCalls[setItemCalls.length - 1];
      const savedSuspensions = JSON.parse(lastCall[1]);
      
      expect(savedSuspensions[0].isActive).toBe(false);
      expect(savedSuspensions[0].actualRestartDate).toBeDefined();
    });
  });

  describe('getRestartRecommendations', () => {
    beforeEach(() => {
      const mockSuspension = {
        goalId: 'test-goal-id',
        suspensionDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        reason: 'Test suspension',
        suspensionType: 'temporary',
        impactAnalysis: {
          timelineExtension: 6,
          compoundingLoss: 5000,
          restartDifficulty: 'moderate',
        },
        isActive: true,
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([mockSuspension]));
    });

    it('should provide high readiness score for good financial situation', async () => {
      const currentSituation = {
        monthlyIncome: 8000,
        monthlyExpenses: 4000,
        emergencyFund: 30000, // 7.5 months
        improvementsSinceSupension: ['New job', 'Debt paid off', 'Increased income'],
      };

      const recommendations = await goalSuspensionService.getRestartRecommendations(
        'test-goal-id',
        currentSituation
      );

      expect(recommendations.readinessScore).toBeGreaterThan(80);
      expect(recommendations.suggestedStrategy).toBe('full');
    });

    it('should provide low readiness score for poor financial situation', async () => {
      const currentSituation = {
        monthlyIncome: 5000,
        monthlyExpenses: 4500,
        emergencyFund: 5000, // 1.1 months
        improvementsSinceSupension: [],
      };

      const recommendations = await goalSuspensionService.getRestartRecommendations(
        'test-goal-id',
        currentSituation
      );

      expect(recommendations.readinessScore).toBeLessThan(60);
      expect(recommendations.suggestedStrategy).toBe('modified');
      expect(recommendations.recommendations).toContain(
        'Build emergency fund to at least 3 months before restarting'
      );
    });

    it('should suggest gradual strategy for moderate readiness', async () => {
      const currentSituation = {
        monthlyIncome: 6500,
        monthlyExpenses: 4000,
        emergencyFund: 15000, // 3.75 months
        improvementsSinceSupension: ['Stable job'],
      };

      const recommendations = await goalSuspensionService.getRestartRecommendations(
        'test-goal-id',
        currentSituation
      );

      expect(recommendations.readinessScore).toBeGreaterThan(60);
      expect(recommendations.readinessScore).toBeLessThan(80);
      expect(recommendations.suggestedStrategy).toBe('gradual');
    });

    it('should calculate timeline adjustment correctly', async () => {
      const currentSituation = {
        monthlyIncome: 7000,
        monthlyExpenses: 4000,
        emergencyFund: 20000,
        improvementsSinceSupension: ['New job'],
      };

      const recommendations = await goalSuspensionService.getRestartRecommendations(
        'test-goal-id',
        currentSituation
      );

      expect(recommendations.timelineAdjustment).toBeGreaterThan(6); // Suspension months + impact
    });

    it('should throw error for non-existent suspension', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]');

      await expect(
        goalSuspensionService.getRestartRecommendations('non-existent-goal', {
          monthlyIncome: 6000,
          monthlyExpenses: 4000,
          emergencyFund: 20000,
          improvementsSinceSupension: [],
        })
      ).rejects.toThrow('No suspension record found');
    });
  });

  describe('error handling', () => {
    it('should handle storage errors in suspension creation', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      await expect(
        goalSuspensionService.suspendGoal(mockGoal, {
          reason: 'Test',
          suspensionType: 'temporary',
        })
      ).rejects.toThrow('Storage error');
    });

    it('should handle storage errors in restart gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      await expect(
        goalSuspensionService.restartGoal('test-goal-id', 'full')
      ).rejects.toThrow('No active suspension found for this goal');
    });
  });
});
