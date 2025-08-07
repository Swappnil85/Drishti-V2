/**
 * FIREGoalService Tests
 * Epic 8, Story 1: FIRE Goal Creation & Management
 */

import { FIREGoalService } from '../FIREGoalService';
import { 
  FIREGoalMetadata, 
  CreateFIREGoalDto, 
  FIREGoalType 
} from '@drishti/shared/types/financial';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock CalculationService
jest.mock('../CalculationService', () => ({
  CalculationService: {
    getInstance: jest.fn(() => ({
      calculateFIRE: jest.fn(() => Promise.resolve({ fireNumber: 1000000 })),
    })),
  },
}));

describe('FIREGoalService', () => {
  let fireGoalService: FIREGoalService;
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    fireGoalService = FIREGoalService.getInstance();
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = FIREGoalService.getInstance();
      const instance2 = FIREGoalService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getTemplates', () => {
    it('should return available FIRE goal templates', () => {
      const templates = fireGoalService.getTemplates();
      
      expect(templates).toHaveLength(2);
      expect(templates[0].id).toBe('traditional_fire');
      expect(templates[0].fireType).toBe('fire_traditional');
      expect(templates[1].id).toBe('lean_fire');
      expect(templates[1].fireType).toBe('fire_lean');
    });

    it('should include proper template metadata', () => {
      const templates = fireGoalService.getTemplates();
      const traditionalTemplate = templates[0];
      
      expect(traditionalTemplate.name).toBe('Traditional FIRE');
      expect(traditionalTemplate.category).toBe('beginner');
      expect(traditionalTemplate.assumptions.withdrawalRate).toBe(0.04);
      expect(traditionalTemplate.guidance.tips).toHaveLength(4);
      expect(traditionalTemplate.customizableFields).toHaveLength(3);
    });
  });

  describe('getTemplate', () => {
    it('should return template by ID', () => {
      const template = fireGoalService.getTemplate('traditional_fire');
      
      expect(template).toBeDefined();
      expect(template?.id).toBe('traditional_fire');
      expect(template?.fireType).toBe('fire_traditional');
    });

    it('should return undefined for non-existent template', () => {
      const template = fireGoalService.getTemplate('non_existent');
      expect(template).toBeUndefined();
    });
  });

  describe('calculateFIRENumber', () => {
    it('should calculate FIRE number based on metadata', async () => {
      const metadata: FIREGoalMetadata = {
        fireType: 'fire_traditional',
        withdrawalRate: 0.04,
        safetyMargin: 0.1,
        monthlyExpenses: 4000,
        annualExpenses: 48000,
        currentAge: 30,
        expectedReturn: 0.07,
        inflationRate: 0.03,
        autoAdjustForInflation: true,
        includeHealthcareBuffer: true,
        includeTaxConsiderations: true,
      };

      const fireNumber = await fireGoalService.calculateFIRENumber(metadata);
      
      expect(fireNumber).toBe(1000000);
    });
  });

  describe('createFIREGoal', () => {
    beforeEach(() => {
      mockAsyncStorage.getItem.mockResolvedValue('[]');
      mockAsyncStorage.setItem.mockResolvedValue();
    });

    it('should create FIRE goal with provided data', async () => {
      const goalData: CreateFIREGoalDto = {
        name: 'My FIRE Goal',
        goal_type: 'fire_traditional',
        target_amount: 1000000,
        current_amount: 50000,
        priority: 1,
        description: 'Traditional FIRE approach',
        fireMetadata: {
          fireType: 'fire_traditional',
          withdrawalRate: 0.04,
          safetyMargin: 0.1,
          monthlyExpenses: 4000,
          annualExpenses: 48000,
          currentAge: 30,
          expectedReturn: 0.07,
          inflationRate: 0.03,
          autoAdjustForInflation: true,
          includeHealthcareBuffer: true,
          includeTaxConsiderations: true,
        },
        templateId: 'traditional_fire',
        templateName: 'Traditional FIRE',
      };

      const goal = await fireGoalService.createFIREGoal(goalData);

      expect(goal.name).toBe('My FIRE Goal');
      expect(goal.goal_type).toBe('fire_traditional');
      expect(goal.target_amount).toBe(1000000);
      expect(goal.current_amount).toBe(50000);
      expect(goal.is_active).toBe(true);
      expect(goal.metadata.templateId).toBe('traditional_fire');
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should calculate target amount if not provided', async () => {
      const goalData: CreateFIREGoalDto = {
        name: 'Auto-calculated Goal',
        goal_type: 'fire_traditional',
        target_amount: 0, // Will be calculated
        fireMetadata: {
          fireType: 'fire_traditional',
          withdrawalRate: 0.04,
          safetyMargin: 0.1,
          monthlyExpenses: 4000,
          annualExpenses: 48000,
          currentAge: 30,
          expectedReturn: 0.07,
          inflationRate: 0.03,
          autoAdjustForInflation: true,
          includeHealthcareBuffer: true,
          includeTaxConsiderations: true,
        },
      };

      const goal = await fireGoalService.createFIREGoal(goalData);

      expect(goal.target_amount).toBe(1000000); // From mocked calculation
    });
  });

  describe('calculateGoalProgress', () => {
    it('should calculate comprehensive goal progress', async () => {
      const goal = {
        id: 'test-goal',
        user_id: 'test-user',
        name: 'Test Goal',
        goal_type: 'fire_traditional' as const,
        target_amount: 1000000,
        current_amount: 250000,
        priority: 1,
        is_active: true,
        metadata: {},
        created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
        updated_at: new Date().toISOString(),
      };

      const progress = await fireGoalService.calculateGoalProgress(goal);

      expect(progress.goalId).toBe('test-goal');
      expect(progress.currentAmount).toBe(250000);
      expect(progress.targetAmount).toBe(1000000);
      expect(progress.progressPercentage).toBe(25);
      expect(progress.timeElapsed).toBe(12); // 12 months
      expect(progress.monthlyProgress).toBeCloseTo(20833.33, 2); // 250000 / 12
      expect(progress.progressVelocity).toBe('steady');
      expect(progress.nextMilestone.percentage).toBe(50);
      expect(progress.nextMilestone.amount).toBe(500000);
    });

    it('should handle zero progress correctly', async () => {
      const goal = {
        id: 'zero-progress-goal',
        user_id: 'test-user',
        name: 'Zero Progress Goal',
        goal_type: 'fire_traditional' as const,
        target_amount: 1000000,
        current_amount: 0,
        priority: 1,
        is_active: true,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const progress = await fireGoalService.calculateGoalProgress(goal);

      expect(progress.progressPercentage).toBe(0);
      expect(progress.monthlyProgress).toBe(0);
      expect(progress.estimatedTimeRemaining).toBe(Infinity);
      expect(progress.progressVelocity).toBe('stalled');
    });
  });

  describe('analyzeFeasibility', () => {
    it('should analyze goal feasibility comprehensively', async () => {
      const goal = {
        id: 'feasibility-test-goal',
        user_id: 'test-user',
        name: 'Feasibility Test Goal',
        goal_type: 'fire_traditional' as const,
        target_amount: 1000000,
        current_amount: 100000,
        priority: 1,
        is_active: true,
        metadata: {
          fireType: 'fire_traditional',
          currentAge: 30,
          targetRetirementAge: 50,
          currentIncome: 80000,
          currentSavingsRate: 0.2,
          expectedReturn: 0.07,
        } as FIREGoalMetadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const feasibility = await fireGoalService.analyzeFeasibility(goal);

      expect(feasibility.goalId).toBe('feasibility-test-goal');
      expect(feasibility.feasibilityScore).toBeGreaterThan(0);
      expect(feasibility.feasibilityScore).toBeLessThanOrEqual(100);
      expect(['excellent', 'good', 'challenging', 'unrealistic']).toContain(feasibility.feasibilityRating);
      expect(feasibility.currentSavingsRate).toBe(0.2);
      expect(feasibility.currentMonthlyContribution).toBeCloseTo(1333.33, 2); // 80000 * 0.2 / 12
      expect(feasibility.recommendations).toHaveLength(1);
      expect(feasibility.alternativeScenarios).toHaveLength(1);
    });

    it('should identify risk factors correctly', async () => {
      const goal = {
        id: 'risk-test-goal',
        user_id: 'test-user',
        name: 'Risk Test Goal',
        goal_type: 'fire_traditional' as const,
        target_amount: 1000000,
        current_amount: 0,
        priority: 1,
        is_active: true,
        metadata: {
          fireType: 'fire_traditional',
          currentAge: 55, // High age = risk factor
          expectedReturn: 0.12, // Aggressive return = risk factor
        } as FIREGoalMetadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const feasibility = await fireGoalService.analyzeFeasibility(goal);

      expect(feasibility.riskFactors.length).toBeGreaterThan(0);
      
      const timelineRisk = feasibility.riskFactors.find(r => r.type === 'timeline');
      const marketRisk = feasibility.riskFactors.find(r => r.type === 'market');
      
      expect(timelineRisk).toBeDefined();
      expect(timelineRisk?.severity).toBe('medium');
      expect(marketRisk).toBeDefined();
      expect(marketRisk?.severity).toBe('high');
    });
  });

  describe('storage operations', () => {
    it('should save goal to storage', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]');
      mockAsyncStorage.setItem.mockResolvedValue();

      const goalData: CreateFIREGoalDto = {
        name: 'Storage Test Goal',
        goal_type: 'fire_traditional',
        target_amount: 500000,
        fireMetadata: {
          fireType: 'fire_traditional',
          withdrawalRate: 0.04,
          safetyMargin: 0.1,
          monthlyExpenses: 2000,
          annualExpenses: 24000,
          currentAge: 25,
          expectedReturn: 0.07,
          inflationRate: 0.03,
          autoAdjustForInflation: true,
          includeHealthcareBuffer: true,
          includeTaxConsiderations: true,
        },
      };

      await fireGoalService.createFIREGoal(goalData);

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('fire_goals');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'fire_goals',
        expect.stringContaining('Storage Test Goal')
      );
    });

    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const goals = await fireGoalService.getGoalsFromStorage();
      expect(goals).toEqual([]);
    });
  });
});
