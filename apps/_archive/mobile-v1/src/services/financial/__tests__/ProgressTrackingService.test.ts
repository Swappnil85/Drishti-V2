/**
 * ProgressTrackingService Tests
 * Epic 8, Story 2: Advanced Progress Tracking & Visualization
 */

import { ProgressTrackingService, ProgressSnapshot, VelocityAnalysis } from '../ProgressTrackingService';
import { FinancialGoal } from '@drishti/shared/types/financial';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('ProgressTrackingService', () => {
  let progressTrackingService: ProgressTrackingService;
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    progressTrackingService = ProgressTrackingService.getInstance();
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ProgressTrackingService.getInstance();
      const instance2 = ProgressTrackingService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('recordProgressSnapshot', () => {
    const mockGoal: FinancialGoal = {
      id: 'test-goal-id',
      user_id: 'test-user',
      name: 'Test Goal',
      goal_type: 'fire_traditional',
      target_amount: 1000000,
      current_amount: 250000,
      priority: 1,
      is_active: true,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    beforeEach(() => {
      mockAsyncStorage.getItem.mockResolvedValue('[]');
      mockAsyncStorage.setItem.mockResolvedValue();
    });

    it('should record progress snapshot successfully', async () => {
      await progressTrackingService.recordProgressSnapshot(mockGoal);

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('progress_snapshots_test-goal-id');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'progress_snapshots_test-goal-id',
        expect.stringContaining('test-goal-id')
      );
    });

    it('should include additional data in snapshot', async () => {
      const additionalData = {
        monthlyContribution: 5000,
        marketConditions: {
          volatilityIndex: 0.2,
          marketTrend: 'bull' as const,
        },
      };

      await progressTrackingService.recordProgressSnapshot(mockGoal, additionalData);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'progress_snapshots_test-goal-id',
        expect.stringContaining('5000')
      );
    });

    it('should limit snapshots to maximum count', async () => {
      // Mock existing snapshots at the limit
      const existingSnapshots = Array.from({ length: 100 }, (_, i) => ({
        goalId: 'test-goal-id',
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        amount: 100000 + i * 1000,
        targetAmount: 1000000,
        progressPercentage: (100000 + i * 1000) / 1000000 * 100,
      }));

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingSnapshots));

      await progressTrackingService.recordProgressSnapshot(mockGoal);

      const setItemCall = mockAsyncStorage.setItem.mock.calls[0];
      const savedSnapshots = JSON.parse(setItemCall[1]);
      
      expect(savedSnapshots).toHaveLength(100); // Should maintain max limit
      expect(savedSnapshots[savedSnapshots.length - 1].amount).toBe(250000); // New snapshot should be last
    });

    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      await expect(progressTrackingService.recordProgressSnapshot(mockGoal))
        .rejects.toThrow('Storage error');
    });
  });

  describe('analyzeVelocity', () => {
    it('should return default analysis for insufficient data', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]');

      const analysis = await progressTrackingService.analyzeVelocity('test-goal-id');

      expect(analysis.currentVelocity).toBe(0);
      expect(analysis.velocityTrend).toBe('stalled');
      expect(analysis.velocityChange).toBe(0);
      expect(analysis.confidenceLevel).toBe(50);
      expect(analysis.factors).toHaveLength(0);
    });

    it('should analyze velocity with sufficient data', async () => {
      const snapshots: ProgressSnapshot[] = [
        {
          goalId: 'test-goal-id',
          timestamp: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months ago
          amount: 100000,
          targetAmount: 1000000,
          progressPercentage: 10,
        },
        {
          goalId: 'test-goal-id',
          timestamp: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months ago
          amount: 200000,
          targetAmount: 1000000,
          progressPercentage: 20,
        },
        {
          goalId: 'test-goal-id',
          timestamp: new Date().toISOString(), // Now
          amount: 300000,
          targetAmount: 1000000,
          progressPercentage: 30,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(snapshots));

      const analysis = await progressTrackingService.analyzeVelocity('test-goal-id');

      expect(analysis.currentVelocity).toBeGreaterThan(0);
      expect(analysis.velocityTrend).toBeOneOf(['accelerating', 'steady', 'decelerating', 'stalled']);
      expect(analysis.confidenceLevel).toBeGreaterThan(50);
      expect(analysis.factors.length).toBeGreaterThan(0);
    });

    it('should detect accelerating velocity trend', async () => {
      const snapshots: ProgressSnapshot[] = [
        {
          goalId: 'test-goal-id',
          timestamp: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 12 months ago
          amount: 50000,
          targetAmount: 1000000,
          progressPercentage: 5,
        },
        {
          goalId: 'test-goal-id',
          timestamp: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months ago
          amount: 150000,
          targetAmount: 1000000,
          progressPercentage: 15,
        },
        {
          goalId: 'test-goal-id',
          timestamp: new Date().toISOString(), // Now
          amount: 400000, // Accelerated growth
          targetAmount: 1000000,
          progressPercentage: 40,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(snapshots));

      const analysis = await progressTrackingService.analyzeVelocity('test-goal-id');

      expect(analysis.velocityTrend).toBe('accelerating');
      expect(analysis.velocityChange).toBeGreaterThan(10);
    });

    it('should detect stalled velocity', async () => {
      const snapshots: ProgressSnapshot[] = [
        {
          goalId: 'test-goal-id',
          timestamp: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 100000,
          targetAmount: 1000000,
          progressPercentage: 10,
        },
        {
          goalId: 'test-goal-id',
          timestamp: new Date().toISOString(),
          amount: 100000, // No progress
          targetAmount: 1000000,
          progressPercentage: 10,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(snapshots));

      const analysis = await progressTrackingService.analyzeVelocity('test-goal-id');

      expect(analysis.velocityTrend).toBe('stalled');
      expect(analysis.currentVelocity).toBe(0);
    });
  });

  describe('calculateProjectionConfidence', () => {
    it('should return default confidence for insufficient data', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]');

      const confidence = await progressTrackingService.calculateProjectionConfidence('test-goal-id');

      expect(confidence.overall).toBe(50);
      expect(confidence.riskLevel).toBe('medium');
      expect(confidence.recommendations).toContain('Insufficient data for detailed analysis');
    });

    it('should calculate confidence with sufficient data', async () => {
      const snapshots: ProgressSnapshot[] = Array.from({ length: 12 }, (_, i) => ({
        goalId: 'test-goal-id',
        timestamp: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 100000 + i * 10000, // Consistent growth
        targetAmount: 1000000,
        progressPercentage: (100000 + i * 10000) / 1000000 * 100,
      }));

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(snapshots));

      const confidence = await progressTrackingService.calculateProjectionConfidence('test-goal-id');

      expect(confidence.overall).toBeGreaterThan(50);
      expect(confidence.factors.consistency).toBeGreaterThan(50);
      expect(['low', 'medium', 'high']).toContain(confidence.riskLevel);
    });

    it('should provide appropriate recommendations based on confidence factors', async () => {
      const inconsistentSnapshots: ProgressSnapshot[] = [
        {
          goalId: 'test-goal-id',
          timestamp: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 100000,
          targetAmount: 1000000,
          progressPercentage: 10,
        },
        {
          goalId: 'test-goal-id',
          timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 105000, // Small increase
          targetAmount: 1000000,
          progressPercentage: 10.5,
        },
        {
          goalId: 'test-goal-id',
          timestamp: new Date().toISOString(),
          amount: 150000, // Large jump
          targetAmount: 1000000,
          progressPercentage: 15,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(inconsistentSnapshots));

      const confidence = await progressTrackingService.calculateProjectionConfidence('test-goal-id');

      expect(confidence.recommendations).toContain('Improve contribution consistency for better projections');
    });
  });

  describe('performVarianceAnalysis', () => {
    const originalProjections = {
      estimatedMonths: 120, // 10 years
      plannedMonthlyContribution: 5000,
      expectedReturn: 0.07,
    };

    it('should return default analysis for insufficient data', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]');

      const variance = await progressTrackingService.performVarianceAnalysis('test-goal-id', originalProjections);

      expect(variance.timelineVariance.originalEstimate).toBe(120);
      expect(variance.contributionVariance.plannedMonthly).toBe(5000);
      expect(variance.contributionVariance.actualMonthly).toBe(0);
      expect(variance.contributionVariance.variancePercentage).toBe(-100);
    });

    it('should analyze variance with actual data', async () => {
      const snapshots: ProgressSnapshot[] = [
        {
          goalId: 'test-goal-id',
          timestamp: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months ago
          amount: 100000,
          targetAmount: 1000000,
          progressPercentage: 10,
        },
        {
          goalId: 'test-goal-id',
          timestamp: new Date().toISOString(), // Now
          amount: 130000, // 30k increase over 6 months = 5k/month
          targetAmount: 1000000,
          progressPercentage: 13,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(snapshots));

      const variance = await progressTrackingService.performVarianceAnalysis('test-goal-id', originalProjections);

      expect(variance.contributionVariance.actualMonthly).toBeCloseTo(5000, 0); // Should match planned
      expect(Math.abs(variance.contributionVariance.variancePercentage)).toBeLessThan(10); // Should be close to plan
    });

    it('should detect positive variance when ahead of schedule', async () => {
      const snapshots: ProgressSnapshot[] = [
        {
          goalId: 'test-goal-id',
          timestamp: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 100000,
          targetAmount: 1000000,
          progressPercentage: 10,
        },
        {
          goalId: 'test-goal-id',
          timestamp: new Date().toISOString(),
          amount: 200000, // Ahead of schedule
          targetAmount: 1000000,
          progressPercentage: 20,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(snapshots));

      const variance = await progressTrackingService.performVarianceAnalysis('test-goal-id', originalProjections);

      expect(variance.contributionVariance.actualMonthly).toBeGreaterThan(originalProjections.plannedMonthlyContribution);
      expect(variance.contributionVariance.variancePercentage).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle storage errors in velocity analysis', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const analysis = await progressTrackingService.analyzeVelocity('test-goal-id');

      // Should return default analysis instead of throwing
      expect(analysis.currentVelocity).toBe(0);
      expect(analysis.velocityTrend).toBe('stalled');
    });

    it('should handle storage errors in confidence calculation', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const confidence = await progressTrackingService.calculateProjectionConfidence('test-goal-id');

      // Should return default confidence instead of throwing
      expect(confidence.overall).toBe(50);
      expect(confidence.riskLevel).toBe('medium');
    });
  });
});
