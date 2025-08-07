/**
 * EnhancedFeasibilityService Tests
 * Epic 8, Story: Goal Feasibility Analysis
 */

import { EnhancedFeasibilityService } from '../EnhancedFeasibilityService';
import { FinancialGoal, FIREGoalFeasibility, FIREGoalMetadata } from '@drishti/shared/types/financial';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('EnhancedFeasibilityService', () => {
  let enhancedFeasibilityService: EnhancedFeasibilityService;
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
      currentAge: 32,
      targetRetirementAge: 65,
      expectedReturn: 0.07,
      dependents: 0,
    } as FIREGoalMetadata,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockBaseFeasibility: FIREGoalFeasibility = {
    goalId: 'test-goal-id',
    feasibilityScore: 75,
    feasibilityRating: 'good',
    requiredSavingsRate: 0.28,
    currentSavingsRate: 0.25,
    requiredMonthlyContribution: 1867,
    projectedTimelineYears: 33,
    recommendations: [
      {
        action: 'Increase savings rate by 3%',
        impact: 'Improves feasibility by 15 points',
        priority: 'high',
        difficulty: 'moderate',
        estimatedTimeframe: '3 months',
      },
    ],
    riskFactors: [
      {
        description: 'Market volatility risk',
        severity: 'medium',
        impact: 'Could delay timeline by 2-3 years',
        mitigation: 'Diversify investments',
      },
    ],
    lastUpdated: new Date().toISOString(),
  };

  beforeEach(() => {
    enhancedFeasibilityService = EnhancedFeasibilityService.getInstance();
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue('[]');
    mockAsyncStorage.setItem.mockResolvedValue();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = EnhancedFeasibilityService.getInstance();
      const instance2 = EnhancedFeasibilityService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('performEnhancedAnalysis', () => {
    it('should perform comprehensive enhanced analysis', async () => {
      const analysis = await enhancedFeasibilityService.performEnhancedAnalysis(
        mockGoal,
        mockBaseFeasibility
      );

      expect(analysis).toBeDefined();
      expect(analysis.feasibilityScore).toBe(mockBaseFeasibility.feasibilityScore);
      expect(analysis.sensitivityAnalysis).toBeDefined();
      expect(analysis.alternativeTimelines).toBeDefined();
      expect(analysis.peerComparison).toBeDefined();
      expect(analysis.riskAdjustedAnalysis).toBeDefined();
      expect(analysis.lifeEventImpacts).toBeDefined();
      expect(analysis.improvementPlan).toBeDefined();
    });

    it('should include sensitivity analysis for all key parameters', async () => {
      const analysis = await enhancedFeasibilityService.performEnhancedAnalysis(
        mockGoal,
        mockBaseFeasibility
      );

      expect(analysis.sensitivityAnalysis).toHaveLength(4);
      const parameters = analysis.sensitivityAnalysis.map(s => s.parameter);
      expect(parameters).toContain('income');
      expect(parameters).toContain('expenses');
      expect(parameters).toContain('returns');
      expect(parameters).toContain('timeline');
    });

    it('should provide alternative timelines for challenging goals', async () => {
      const challengingFeasibility: FIREGoalFeasibility = {
        ...mockBaseFeasibility,
        feasibilityScore: 45,
        feasibilityRating: 'challenging',
      };

      const analysis = await enhancedFeasibilityService.performEnhancedAnalysis(
        mockGoal,
        challengingFeasibility
      );

      expect(analysis.alternativeTimelines.length).toBeGreaterThan(0);
      analysis.alternativeTimelines.forEach(timeline => {
        expect(timeline.suggestedYears).toBeGreaterThan(timeline.originalYears);
        expect(timeline.feasibilityImprovement).toBeGreaterThan(0);
      });
    });

    it('should provide accelerated timelines for excellent goals', async () => {
      const excellentFeasibility: FIREGoalFeasibility = {
        ...mockBaseFeasibility,
        feasibilityScore: 90,
        feasibilityRating: 'excellent',
      };

      const analysis = await enhancedFeasibilityService.performEnhancedAnalysis(
        mockGoal,
        excellentFeasibility
      );

      if (analysis.alternativeTimelines.length > 0) {
        const acceleratedTimelines = analysis.alternativeTimelines.filter(
          timeline => timeline.suggestedYears < timeline.originalYears
        );
        expect(acceleratedTimelines.length).toBeGreaterThan(0);
      }
    });

    it('should include peer comparison with demographic matching', async () => {
      const analysis = await enhancedFeasibilityService.performEnhancedAnalysis(
        mockGoal,
        mockBaseFeasibility
      );

      expect(analysis.peerComparison.userDemographic).toBeDefined();
      expect(analysis.peerComparison.userDemographic.ageRange).toBe('25-34');
      expect(analysis.peerComparison.peerMetrics).toBeDefined();
      expect(analysis.peerComparison.insights).toBeDefined();
      expect(analysis.peerComparison.recommendations).toBeDefined();
    });

    it('should perform risk-adjusted analysis', async () => {
      const analysis = await enhancedFeasibilityService.performEnhancedAnalysis(
        mockGoal,
        mockBaseFeasibility
      );

      expect(analysis.riskAdjustedAnalysis.baselineFeasibility).toBe(mockBaseFeasibility.feasibilityScore);
      expect(analysis.riskAdjustedAnalysis.riskAdjustedFeasibility).toBeLessThan(
        analysis.riskAdjustedAnalysis.baselineFeasibility
      );
      expect(analysis.riskAdjustedAnalysis.riskFactors.length).toBeGreaterThan(0);
      expect(analysis.riskAdjustedAnalysis.confidenceInterval).toBeDefined();
      expect(analysis.riskAdjustedAnalysis.worstCaseScenario).toBeDefined();
      expect(analysis.riskAdjustedAnalysis.bestCaseScenario).toBeDefined();
    });

    it('should analyze life event impacts', async () => {
      const analysis = await enhancedFeasibilityService.performEnhancedAnalysis(
        mockGoal,
        mockBaseFeasibility
      );

      expect(analysis.lifeEventImpacts.length).toBeGreaterThan(0);
      analysis.lifeEventImpacts.forEach(impact => {
        expect(impact.eventType).toBeDefined();
        expect(impact.probability).toBeGreaterThan(0);
        expect(impact.probability).toBeLessThanOrEqual(1);
        expect(impact.timeframe).toBeDefined();
        expect(impact.preparationSteps).toBeDefined();
      });
    });

    it('should generate improvement plan with quick wins and long-term strategies', async () => {
      const analysis = await enhancedFeasibilityService.performEnhancedAnalysis(
        mockGoal,
        mockBaseFeasibility
      );

      expect(analysis.improvementPlan.quickWins).toBeDefined();
      expect(analysis.improvementPlan.longTermStrategies).toBeDefined();
      
      if (analysis.improvementPlan.quickWins.length > 0) {
        analysis.improvementPlan.quickWins.forEach(win => {
          expect(win.action).toBeDefined();
          expect(win.feasibilityImprovement).toBeGreaterThan(0);
          expect(win.timeToImplement).toBeDefined();
          expect(['easy', 'moderate', 'difficult']).toContain(win.difficulty);
        });
      }
    });

    it('should store analysis for future reference', async () => {
      await enhancedFeasibilityService.performEnhancedAnalysis(
        mockGoal,
        mockBaseFeasibility
      );

      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('sensitivity analysis', () => {
    it('should show income sensitivity correctly', async () => {
      const analysis = await enhancedFeasibilityService.performEnhancedAnalysis(
        mockGoal,
        mockBaseFeasibility
      );

      const incomeAnalysis = analysis.sensitivityAnalysis.find(s => s.parameter === 'income');
      expect(incomeAnalysis).toBeDefined();
      expect(incomeAnalysis!.scenarios.length).toBeGreaterThan(0);
      
      // Higher income should generally improve feasibility
      const positiveIncomeChange = incomeAnalysis!.scenarios.find(s => s.change > 0);
      const negativeIncomeChange = incomeAnalysis!.scenarios.find(s => s.change < 0);
      
      if (positiveIncomeChange && negativeIncomeChange) {
        expect(positiveIncomeChange.feasibilityScore).toBeGreaterThan(
          negativeIncomeChange.feasibilityScore
        );
      }
    });

    it('should show expense sensitivity correctly', async () => {
      const analysis = await enhancedFeasibilityService.performEnhancedAnalysis(
        mockGoal,
        mockBaseFeasibility
      );

      const expenseAnalysis = analysis.sensitivityAnalysis.find(s => s.parameter === 'expenses');
      expect(expenseAnalysis).toBeDefined();
      expect(expenseAnalysis!.scenarios.length).toBeGreaterThan(0);
      
      // Lower expenses should generally improve feasibility
      const positiveExpenseChange = expenseAnalysis!.scenarios.find(s => s.change > 0);
      const negativeExpenseChange = expenseAnalysis!.scenarios.find(s => s.change < 0);
      
      if (positiveExpenseChange && negativeExpenseChange) {
        expect(negativeExpenseChange.feasibilityScore).toBeGreaterThan(
          positiveExpenseChange.feasibilityScore
        );
      }
    });
  });

  describe('peer comparison', () => {
    it('should categorize user demographics correctly', async () => {
      const analysis = await enhancedFeasibilityService.performEnhancedAnalysis(
        mockGoal,
        mockBaseFeasibility
      );

      const demographic = analysis.peerComparison.userDemographic;
      expect(demographic.ageRange).toBe('25-34'); // Age 32
      expect(demographic.incomeRange).toBe('$75K-$100K'); // Income 80000
      expect(demographic.familyStatus).toBe('no_dependents'); // 0 dependents
    });

    it('should provide meaningful peer insights', async () => {
      const analysis = await enhancedFeasibilityService.performEnhancedAnalysis(
        mockGoal,
        mockBaseFeasibility
      );

      expect(analysis.peerComparison.insights.length).toBeGreaterThan(0);
      analysis.peerComparison.insights.forEach(insight => {
        expect(typeof insight).toBe('string');
        expect(insight.length).toBeGreaterThan(0);
      });
    });
  });

  describe('risk analysis', () => {
    it('should identify appropriate risk factors', async () => {
      const analysis = await enhancedFeasibilityService.performEnhancedAnalysis(
        mockGoal,
        mockBaseFeasibility
      );

      const riskFactors = analysis.riskAdjustedAnalysis.riskFactors;
      expect(riskFactors.length).toBeGreaterThan(0);
      
      const riskTypes = riskFactors.map(r => r.factor);
      expect(riskTypes).toContain('Market Volatility');
      expect(riskTypes).toContain('Job Loss');
      expect(riskTypes).toContain('Health Issues');
      expect(riskTypes).toContain('Inflation');
    });

    it('should calculate confidence intervals', async () => {
      const analysis = await enhancedFeasibilityService.performEnhancedAnalysis(
        mockGoal,
        mockBaseFeasibility
      );

      const confidence = analysis.riskAdjustedAnalysis.confidenceInterval;
      expect(confidence.lower).toBeLessThan(confidence.upper);
      expect(confidence.confidence).toBe(95);
      expect(confidence.lower).toBeGreaterThanOrEqual(0);
      expect(confidence.upper).toBeLessThanOrEqual(100);
    });

    it('should provide realistic scenario analysis', async () => {
      const analysis = await enhancedFeasibilityService.performEnhancedAnalysis(
        mockGoal,
        mockBaseFeasibility
      );

      const worstCase = analysis.riskAdjustedAnalysis.worstCaseScenario;
      const bestCase = analysis.riskAdjustedAnalysis.bestCaseScenario;
      
      expect(worstCase.feasibilityScore).toBeLessThan(bestCase.feasibilityScore);
      expect(worstCase.probability).toBeGreaterThan(0);
      expect(worstCase.probability).toBeLessThan(1);
      expect(bestCase.probability).toBeGreaterThan(0);
      expect(bestCase.probability).toBeLessThan(1);
    });
  });

  describe('life event analysis', () => {
    it('should predict age-appropriate life events', async () => {
      const analysis = await enhancedFeasibilityService.performEnhancedAnalysis(
        mockGoal,
        mockBaseFeasibility
      );

      const eventTypes = analysis.lifeEventImpacts.map(e => e.eventType);
      
      // For a 32-year-old with no dependents, should include career advancement
      expect(eventTypes).toContain('Career Advancement');
      
      // Should include family expansion for young adults
      expect(eventTypes).toContain('Family Expansion');
    });

    it('should provide preparation steps for likely events', async () => {
      const analysis = await enhancedFeasibilityService.performEnhancedAnalysis(
        mockGoal,
        mockBaseFeasibility
      );

      analysis.lifeEventImpacts.forEach(impact => {
        expect(impact.preparationSteps.length).toBeGreaterThan(0);
        impact.preparationSteps.forEach(step => {
          expect(typeof step).toBe('string');
          expect(step.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('improvement plan', () => {
    it('should provide quick wins for lower feasibility scores', async () => {
      const lowFeasibility: FIREGoalFeasibility = {
        ...mockBaseFeasibility,
        feasibilityScore: 60,
        feasibilityRating: 'challenging',
      };

      const analysis = await enhancedFeasibilityService.performEnhancedAnalysis(
        mockGoal,
        lowFeasibility
      );

      expect(analysis.improvementPlan.quickWins.length).toBeGreaterThan(0);
      analysis.improvementPlan.quickWins.forEach(win => {
        expect(win.feasibilityImprovement).toBeGreaterThan(0);
        expect(['easy', 'moderate', 'difficult']).toContain(win.difficulty);
      });
    });

    it('should provide long-term strategies', async () => {
      const analysis = await enhancedFeasibilityService.performEnhancedAnalysis(
        mockGoal,
        mockBaseFeasibility
      );

      expect(analysis.improvementPlan.longTermStrategies.length).toBeGreaterThan(0);
      analysis.improvementPlan.longTermStrategies.forEach(strategy => {
        expect(strategy.feasibilityImprovement).toBeGreaterThan(0);
        expect(strategy.requirements).toBeDefined();
        expect(strategy.requirements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('error handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      // Should not throw, but should still return analysis
      const analysis = await enhancedFeasibilityService.performEnhancedAnalysis(
        mockGoal,
        mockBaseFeasibility
      );

      expect(analysis).toBeDefined();
      expect(analysis.feasibilityScore).toBe(mockBaseFeasibility.feasibilityScore);
    });

    it('should handle missing metadata gracefully', async () => {
      const goalWithoutMetadata: FinancialGoal = {
        ...mockGoal,
        metadata: {} as FIREGoalMetadata,
      };

      // Should not throw with incomplete metadata
      expect(async () => {
        await enhancedFeasibilityService.performEnhancedAnalysis(
          goalWithoutMetadata,
          mockBaseFeasibility
        );
      }).not.toThrow();
    });
  });
});
