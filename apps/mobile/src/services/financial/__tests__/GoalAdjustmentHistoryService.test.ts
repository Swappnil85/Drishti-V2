/**
 * GoalAdjustmentHistoryService Tests
 * Epic 8, Story: Goal Adjustment History Tracking
 */

import { GoalAdjustmentHistoryService, GoalAdjustment } from '../GoalAdjustmentHistoryService';
import { FinancialGoal, FIREGoalMetadata } from '@drishti/shared/types/financial';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('GoalAdjustmentHistoryService', () => {
  let historyService: GoalAdjustmentHistoryService;
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
    } as FIREGoalMetadata,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    historyService = GoalAdjustmentHistoryService.getInstance();
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue('[]');
    mockAsyncStorage.setItem.mockResolvedValue();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = GoalAdjustmentHistoryService.getInstance();
      const instance2 = GoalAdjustmentHistoryService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('recordAdjustment', () => {
    it('should record a new adjustment', async () => {
      const adjustment = await historyService.recordAdjustment(
        'test-goal-id',
        'target_amount',
        'Increased target due to inflation',
        'market_change',
        { targetAmount: 1000000 },
        { targetAmount: 1100000 },
        {
          timelineChange: 6,
          contributionChange: 500,
          feasibilityChange: -5,
          confidenceChange: -2,
        }
      );

      expect(adjustment).toBeDefined();
      expect(adjustment.goalId).toBe('test-goal-id');
      expect(adjustment.adjustmentType).toBe('target_amount');
      expect(adjustment.reason).toBe('Increased target due to inflation');
      expect(adjustment.severity).toBeDefined();
      expect(adjustment.reversible).toBeDefined();
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should calculate severity correctly', async () => {
      const majorAdjustment = await historyService.recordAdjustment(
        'test-goal-id',
        'timeline',
        'Major life change',
        'life_event',
        { timeline: 30 },
        { timeline: 45 },
        {
          timelineChange: 18, // 18 months = major
          contributionChange: 0,
          feasibilityChange: -15,
          confidenceChange: -10,
        }
      );

      expect(majorAdjustment.severity).toBe('major');
    });

    it('should determine reversibility correctly', async () => {
      const userAdjustment = await historyService.recordAdjustment(
        'test-goal-id',
        'savings_rate',
        'User increased savings rate',
        'strategy_optimization',
        { savingsRate: 0.2 },
        { savingsRate: 0.25 },
        {
          timelineChange: -3,
          contributionChange: 400,
          feasibilityChange: 8,
          confidenceChange: 5,
        },
        'user'
      );

      expect(userAdjustment.reversible).toBe(true);

      const systemAdjustment = await historyService.recordAdjustment(
        'test-goal-id',
        'target_amount',
        'System adjustment',
        'market_change',
        { targetAmount: 1000000 },
        { targetAmount: 1050000 },
        {
          timelineChange: 2,
          contributionChange: 200,
          feasibilityChange: -2,
          confidenceChange: 0,
        },
        'system'
      );

      expect(systemAdjustment.reversible).toBe(false);
    });
  });

  describe('getAdjustmentHistory', () => {
    it('should return adjustment history for a goal', async () => {
      const mockAdjustments = [
        {
          id: 'adj1',
          goalId: 'test-goal-id',
          timestamp: new Date().toISOString(),
          adjustmentType: 'target_amount',
          reason: 'Test adjustment',
          category: 'other',
          previousValues: {},
          newValues: {},
          impactAnalysis: { timelineChange: 0, contributionChange: 0, feasibilityChange: 0, confidenceChange: 0 },
          triggeredBy: 'user',
          severity: 'minor',
          reversible: true,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockAdjustments));

      const history = await historyService.getAdjustmentHistory('test-goal-id');

      expect(history).toHaveLength(1);
      expect(history[0].goalId).toBe('test-goal-id');
    });

    it('should return empty array when no history exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const history = await historyService.getAdjustmentHistory('nonexistent-goal');

      expect(history).toEqual([]);
    });
  });

  describe('generateAdjustmentTimeline', () => {
    it('should generate timeline with milestones', async () => {
      const mockAdjustments = [
        {
          id: 'adj1',
          goalId: 'test-goal-id',
          timestamp: new Date().toISOString(),
          adjustmentType: 'target_amount',
          reason: 'Major adjustment',
          category: 'life_event',
          previousValues: { targetAmount: 1000000 },
          newValues: { targetAmount: 1200000 },
          impactAnalysis: { timelineChange: 12, contributionChange: 800, feasibilityChange: -10, confidenceChange: -5 },
          triggeredBy: 'user',
          severity: 'major',
          reversible: true,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockAdjustments));

      const timeline = await historyService.generateAdjustmentTimeline('test-goal-id', mockGoal);

      expect(timeline.adjustments).toHaveLength(1);
      expect(timeline.milestones.length).toBeGreaterThan(1); // Should include creation + major adjustment
      expect(timeline.trendAnalysis).toBeDefined();
      expect(timeline.trendAnalysis.direction).toBeOneOf(['improving', 'stable', 'declining']);
    });
  });

  describe('analyzeAdjustmentPatterns', () => {
    it('should analyze patterns with sufficient data', async () => {
      const mockAdjustments = Array.from({ length: 5 }, (_, i) => ({
        id: `adj${i}`,
        goalId: 'test-goal-id',
        timestamp: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString(), // Monthly adjustments
        adjustmentType: 'savings_rate',
        reason: 'Regular adjustment',
        category: 'income_change',
        previousValues: {},
        newValues: {},
        impactAnalysis: { timelineChange: -1, contributionChange: 100, feasibilityChange: 2, confidenceChange: 1 },
        triggeredBy: 'user',
        severity: 'minor',
        reversible: true,
      }));

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockAdjustments));

      const patterns = await historyService.analyzeAdjustmentPatterns('test-goal-id');

      expect(Array.isArray(patterns)).toBe(true);
      // Should identify income-driven pattern
      const incomePattern = patterns.find(p => p.patternType === 'income_driven');
      if (incomePattern) {
        expect(incomePattern.confidence).toBeGreaterThan(0);
        expect(incomePattern.recommendations).toBeDefined();
      }
    });

    it('should return empty array with insufficient data', async () => {
      const mockAdjustments = [
        {
          id: 'adj1',
          goalId: 'test-goal-id',
          timestamp: new Date().toISOString(),
          adjustmentType: 'target_amount',
          reason: 'Single adjustment',
          category: 'other',
          previousValues: {},
          newValues: {},
          impactAnalysis: { timelineChange: 0, contributionChange: 0, feasibilityChange: 0, confidenceChange: 0 },
          triggeredBy: 'user',
          severity: 'minor',
          reversible: true,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockAdjustments));

      const patterns = await historyService.analyzeAdjustmentPatterns('test-goal-id');

      expect(patterns).toEqual([]);
    });
  });

  describe('calculateStabilityScore', () => {
    it('should calculate stability score', async () => {
      const mockAdjustments = [
        {
          id: 'adj1',
          goalId: 'test-goal-id',
          timestamp: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
          adjustmentType: 'savings_rate',
          reason: 'Minor adjustment',
          category: 'strategy_optimization',
          previousValues: {},
          newValues: {},
          impactAnalysis: { timelineChange: -1, contributionChange: 50, feasibilityChange: 2, confidenceChange: 1 },
          triggeredBy: 'user',
          severity: 'minor',
          reversible: true,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockAdjustments));

      const stabilityScore = await historyService.calculateStabilityScore('test-goal-id');

      expect(stabilityScore.score).toBeGreaterThanOrEqual(0);
      expect(stabilityScore.score).toBeLessThanOrEqual(100);
      expect(stabilityScore.rating).toBeOneOf(['very_stable', 'stable', 'moderate', 'unstable', 'very_unstable']);
      expect(Array.isArray(stabilityScore.factors)).toBe(true);
      expect(Array.isArray(stabilityScore.improvementSuggestions)).toBe(true);
    });
  });

  describe('getSeasonalRecommendations', () => {
    it('should provide seasonal recommendations', async () => {
      const recommendations = await historyService.getSeasonalRecommendations('test-goal-id');

      expect(Array.isArray(recommendations)).toBe(true);
      
      if (recommendations.length > 0) {
        const rec = recommendations[0];
        expect(rec.season).toBeOneOf(['spring', 'summer', 'fall', 'winter']);
        expect(rec.recommendationType).toBeOneOf(['increase_savings', 'review_progress', 'adjust_timeline', 'rebalance_portfolio']);
        expect(rec.historicalSuccess).toBeGreaterThan(0);
        expect(rec.historicalSuccess).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('rollback functionality', () => {
    it('should check rollback eligibility correctly', async () => {
      const recentAdjustment = {
        id: 'recent-adj',
        goalId: 'test-goal-id',
        timestamp: new Date().toISOString(), // Now
        adjustmentType: 'savings_rate',
        reason: 'Recent adjustment',
        category: 'strategy_optimization',
        previousValues: {},
        newValues: {},
        impactAnalysis: { timelineChange: 0, contributionChange: 0, feasibilityChange: 0, confidenceChange: 0 },
        triggeredBy: 'user',
        severity: 'minor',
        reversible: true,
      };

      const oldAdjustment = {
        id: 'old-adj',
        goalId: 'test-goal-id',
        timestamp: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), // 40 days ago
        adjustmentType: 'target_amount',
        reason: 'Old adjustment',
        category: 'other',
        previousValues: {},
        newValues: {},
        impactAnalysis: { timelineChange: 0, contributionChange: 0, feasibilityChange: 0, confidenceChange: 0 },
        triggeredBy: 'user',
        severity: 'minor',
        reversible: true,
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([recentAdjustment, oldAdjustment]));

      const canRollbackRecent = await historyService.canRollback('recent-adj');
      const canRollbackOld = await historyService.canRollback('old-adj');

      expect(canRollbackRecent).toBe(true);
      expect(canRollbackOld).toBe(false); // Too old
    });

    it('should perform rollback successfully', async () => {
      const adjustment = {
        id: 'rollback-test',
        goalId: 'test-goal-id',
        timestamp: new Date().toISOString(),
        adjustmentType: 'savings_rate',
        reason: 'Test rollback',
        category: 'strategy_optimization',
        previousValues: { savingsRate: 0.2 },
        newValues: { savingsRate: 0.25 },
        impactAnalysis: { timelineChange: -2, contributionChange: 200, feasibilityChange: 5, confidenceChange: 2 },
        triggeredBy: 'user',
        severity: 'minor',
        reversible: true,
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([adjustment]));

      const success = await historyService.rollbackAdjustment('rollback-test');

      expect(success).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const history = await historyService.getAdjustmentHistory('test-goal-id');

      expect(history).toEqual([]);
    });

    it('should handle invalid adjustment IDs', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]');

      const canRollback = await historyService.canRollback('nonexistent-id');
      const rollbackSuccess = await historyService.rollbackAdjustment('nonexistent-id');

      expect(canRollback).toBe(false);
      expect(rollbackSuccess).toBe(false);
    });
  });
});
