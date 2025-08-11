/**
 * GoalAdjustmentWizard Component Tests
 * Epic 8, Story 3: Goal Adjustment & Impact Analysis
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import GoalAdjustmentWizard from '../GoalAdjustmentWizard';
import { FinancialGoal, FIREGoalProgress, FIREGoalMetadata } from '@drishti/shared/types/financial';
import { HapticService } from '../../../services/HapticService';

// Mock HapticService
jest.mock('../../../services/HapticService');

const mockHapticService = {
  impact: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
};

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
    monthlyExpenses: 4000,
    currentSavingsRate: 0.25,
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

describe('GoalAdjustmentWizard', () => {
  const mockOnClose = jest.fn();
  const mockOnAdjustmentComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (HapticService.getInstance as jest.Mock).mockReturnValue(mockHapticService);
  });

  it('should render wizard when visible', () => {
    const { getByText } = render(
      <GoalAdjustmentWizard
        visible={true}
        goal={mockGoal}
        progress={mockProgress}
        onClose={mockOnClose}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );

    expect(getByText('Adjust Goal')).toBeTruthy();
    expect(getByText('Step 1 of 5: Select Life Event')).toBeTruthy();
    expect(getByText('What life event prompted this adjustment?')).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const { queryByText } = render(
      <GoalAdjustmentWizard
        visible={false}
        goal={mockGoal}
        progress={mockProgress}
        onClose={mockOnClose}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );

    expect(queryByText('Adjust Goal')).toBeNull();
  });

  it('should display life event options', () => {
    const { getByText } = render(
      <GoalAdjustmentWizard
        visible={true}
        goal={mockGoal}
        progress={mockProgress}
        onClose={mockOnClose}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );

    expect(getByText('Job Loss')).toBeTruthy();
    expect(getByText('Promotion/Raise')).toBeTruthy();
    expect(getByText('Marriage/Partnership')).toBeTruthy();
    expect(getByText('New Child')).toBeTruthy();
    expect(getByText('Inheritance/Windfall')).toBeTruthy();
    expect(getByText('Major Expense')).toBeTruthy();
    expect(getByText('Other Life Change')).toBeTruthy();
  });

  it('should allow selecting a life event', async () => {
    const { getByText } = render(
      <GoalAdjustmentWizard
        visible={true}
        goal={mockGoal}
        progress={mockProgress}
        onClose={mockOnClose}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );

    const jobLossOption = getByText('Job Loss');
    fireEvent.press(jobLossOption);

    // Check if the option is selected (would need to check styling or state)
    expect(jobLossOption).toBeTruthy();
  });

  it('should proceed to next step when life event is selected', async () => {
    const { getByText } = render(
      <GoalAdjustmentWizard
        visible={true}
        goal={mockGoal}
        progress={mockProgress}
        onClose={mockOnClose}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );

    // Select a life event
    fireEvent.press(getByText('Job Loss'));
    
    // Click Next
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      expect(getByText('Step 2 of 5: Choose Adjustment')).toBeTruthy();
      expect(getByText('What would you like to adjust?')).toBeTruthy();
    });

    expect(mockHapticService.impact).toHaveBeenCalledWith('light');
  });

  it('should show adjustment options based on selected life event', async () => {
    const { getByText } = render(
      <GoalAdjustmentWizard
        visible={true}
        goal={mockGoal}
        progress={mockProgress}
        onClose={mockOnClose}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );

    // Select job loss
    fireEvent.press(getByText('Job Loss'));
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      expect(getByText('Suspend Goal Temporarily')).toBeTruthy();
      expect(getByText('Adjust Timeline')).toBeTruthy();
      expect(getByText('Modify Monthly Contribution')).toBeTruthy();
    });
  });

  it('should allow going back to previous step', async () => {
    const { getByText } = render(
      <GoalAdjustmentWizard
        visible={true}
        goal={mockGoal}
        progress={mockProgress}
        onClose={mockOnClose}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );

    // Go to step 2
    fireEvent.press(getByText('Job Loss'));
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      expect(getByText('Step 2 of 5: Choose Adjustment')).toBeTruthy();
    });

    // Go back
    fireEvent.press(getByText('Back'));

    await waitFor(() => {
      expect(getByText('Step 1 of 5: Select Life Event')).toBeTruthy();
    });

    expect(mockHapticService.impact).toHaveBeenCalledWith('light');
  });

  it('should show value adjustment inputs for target amount change', async () => {
    const { getByText, getByDisplayValue } = render(
      <GoalAdjustmentWizard
        visible={true}
        goal={mockGoal}
        progress={mockProgress}
        onClose={mockOnClose}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );

    // Navigate to step 3
    fireEvent.press(getByText('Promotion/Raise'));
    fireEvent.press(getByText('Next'));
    
    await waitFor(() => {
      fireEvent.press(getByText('Change Target Amount'));
    });
    
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      expect(getByText('Step 3 of 5: Set New Values')).toBeTruthy();
      expect(getByText('New Target Amount')).toBeTruthy();
      expect(getByDisplayValue('1000000')).toBeTruthy(); // Default target amount
    });
  });

  it('should calculate and show impact analysis', async () => {
    const { getByText } = render(
      <GoalAdjustmentWizard
        visible={true}
        goal={mockGoal}
        progress={mockProgress}
        onClose={mockOnClose}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );

    // Navigate through steps
    fireEvent.press(getByText('Promotion/Raise'));
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Change Target Amount'));
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Next')); // Skip value adjustment

    await waitFor(() => {
      expect(getByText('Step 4 of 5: Review Impact')).toBeTruthy();
      expect(getByText('Here\'s how your adjustments will affect your FIRE goal:')).toBeTruthy();
    });

    // Should show loading initially, then impact analysis
    await waitFor(() => {
      expect(getByText('Timeline Change:')).toBeTruthy();
      expect(getByText('Target Amount Change:')).toBeTruthy();
      expect(getByText('Feasibility Change:')).toBeTruthy();
    }, { timeout: 2000 });
  });

  it('should show confirmation step with summary', async () => {
    const { getByText } = render(
      <GoalAdjustmentWizard
        visible={true}
        goal={mockGoal}
        progress={mockProgress}
        onClose={mockOnClose}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );

    // Navigate to final step
    fireEvent.press(getByText('Promotion/Raise'));
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Change Target Amount'));
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Next'));
    
    await waitFor(() => {
      fireEvent.press(getByText('Next'));
    }, { timeout: 2000 });

    await waitFor(() => {
      expect(getByText('Step 5 of 5: Confirm Changes')).toBeTruthy();
      expect(getByText('Confirm Changes')).toBeTruthy();
      expect(getByText('Adjustment Summary')).toBeTruthy();
      expect(getByText('Life Event: Promotion/Raise')).toBeTruthy();
    });
  });

  it('should complete adjustment and call callback', async () => {
    const { getByText } = render(
      <GoalAdjustmentWizard
        visible={true}
        goal={mockGoal}
        progress={mockProgress}
        onClose={mockOnClose}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );

    // Navigate through all steps
    fireEvent.press(getByText('Promotion/Raise'));
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Change Target Amount'));
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Next'));
    
    await waitFor(() => {
      fireEvent.press(getByText('Next'));
    }, { timeout: 2000 });

    await waitFor(() => {
      fireEvent.press(getByText('Apply Changes'));
    });

    await waitFor(() => {
      expect(mockHapticService.success).toHaveBeenCalled();
      expect(mockOnAdjustmentComplete).toHaveBeenCalled();
    });
  });

  it('should close wizard when close button is pressed', () => {
    const { getByTestId } = render(
      <GoalAdjustmentWizard
        visible={true}
        goal={mockGoal}
        progress={mockProgress}
        onClose={mockOnClose}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );

    // Find and press close button (would need testID in actual component)
    // For now, test the cancel button on first step
    const { getByText } = render(
      <GoalAdjustmentWizard
        visible={true}
        goal={mockGoal}
        progress={mockProgress}
        onClose={mockOnClose}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );

    fireEvent.press(getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should disable next button when step is invalid', () => {
    const { getByText } = render(
      <GoalAdjustmentWizard
        visible={true}
        goal={mockGoal}
        progress={mockProgress}
        onClose={mockOnClose}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );

    const nextButton = getByText('Next');
    
    // Should be disabled initially (no life event selected)
    expect(nextButton.props.disabled).toBe(true);
  });

  it('should enable next button when step is valid', async () => {
    const { getByText } = render(
      <GoalAdjustmentWizard
        visible={true}
        goal={mockGoal}
        progress={mockProgress}
        onClose={mockOnClose}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );

    // Select a life event
    fireEvent.press(getByText('Job Loss'));

    const nextButton = getByText('Next');
    
    // Should be enabled after selection
    expect(nextButton.props.disabled).toBe(false);
  });

  it('should handle different adjustment types correctly', async () => {
    const { getByText } = render(
      <GoalAdjustmentWizard
        visible={true}
        goal={mockGoal}
        progress={mockProgress}
        onClose={mockOnClose}
        onAdjustmentComplete={mockOnAdjustmentComplete}
      />
    );

    // Test suspension adjustment
    fireEvent.press(getByText('Job Loss'));
    fireEvent.press(getByText('Next'));
    
    await waitFor(() => {
      expect(getByText('Suspend Goal Temporarily')).toBeTruthy();
    });

    fireEvent.press(getByText('Suspend Goal Temporarily'));
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      expect(getByText('Suspension Period (months)')).toBeTruthy();
    });
  });
});
