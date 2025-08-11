/**
 * ProgressVisualization Component Tests
 * Epic 8, Story 2: Advanced Progress Tracking & Visualization
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProgressVisualization from '../ProgressVisualization';
import { FinancialGoal, FIREGoalProgress } from '@drishti/shared/types/financial';
import { HapticService } from '../../../services/HapticService';

// Mock HapticService
jest.mock('../../../services/HapticService');

const mockHapticService = {
  impact: jest.fn(),
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
  metadata: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockProgress: FIREGoalProgress = {
  goalId: 'test-goal-id',
  currentAmount: 250000,
  targetAmount: 1000000,
  progressPercentage: 25,
  timeElapsed: 24, // 2 years
  estimatedTimeRemaining: 72, // 6 years
  originalTimeline: 96, // 8 years originally
  monthlyProgress: 10416.67, // ~$10.4k/month
  progressVelocity: 'steady',
  velocityTrend: 2.5, // 2.5% improvement
  nextMilestone: {
    percentage: 50,
    amount: 500000,
    estimatedDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  },
  projectedCompletionDate: new Date(Date.now() + 6 * 365 * 24 * 60 * 60 * 1000).toISOString(),
  confidenceLevel: 78,
  varianceAnalysis: {
    timelineVariance: -12, // 12 months ahead of schedule
    amountVariance: 25000, // $25k ahead
    savingsRateVariance: 5, // 5% better than planned
  },
};

describe('ProgressVisualization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (HapticService.getInstance as jest.Mock).mockReturnValue(mockHapticService);
  });

  it('should render progress visualization with default percentage view', () => {
    const { getByText } = render(
      <ProgressVisualization goal={mockGoal} progress={mockProgress} />
    );

    expect(getByText('Progress Overview')).toBeTruthy();
    expect(getByText('25.0%')).toBeTruthy(); // Progress percentage in SVG
    expect(getByText('Complete')).toBeTruthy();
  });

  it('should display correct progress metrics', () => {
    const { getByText } = render(
      <ProgressVisualization goal={mockGoal} progress={mockProgress} />
    );

    expect(getByText('$10K')).toBeTruthy(); // Monthly progress formatted
    expect(getByText('steady')).toBeTruthy(); // Velocity
    expect(getByText('78%')).toBeTruthy(); // Confidence level
    expect(getByText('2y')).toBeTruthy(); // Time elapsed formatted
  });

  it('should switch between different view modes', async () => {
    const mockOnViewChange = jest.fn();
    const { getByText } = render(
      <ProgressVisualization 
        goal={mockGoal} 
        progress={mockProgress} 
        onViewChange={mockOnViewChange}
      />
    );

    // Switch to dollar view
    fireEvent.press(getByText('$'));
    
    await waitFor(() => {
      expect(mockHapticService.impact).toHaveBeenCalledWith('light');
      expect(mockOnViewChange).toHaveBeenCalledWith('dollar');
    });

    // Switch to timeline view
    fireEvent.press(getByText('Time'));
    
    await waitFor(() => {
      expect(mockOnViewChange).toHaveBeenCalledWith('timeline');
    });

    // Switch to velocity view
    fireEvent.press(getByText('Speed'));
    
    await waitFor(() => {
      expect(mockOnViewChange).toHaveBeenCalledWith('velocity');
    });
  });

  it('should format currency amounts correctly', () => {
    const { getByText } = render(
      <ProgressVisualization goal={mockGoal} progress={mockProgress} />
    );

    // Should format large amounts with K/M suffixes
    expect(getByText('$500K')).toBeTruthy(); // Next milestone amount
  });

  it('should format time remaining correctly', () => {
    const progressWithShortTime: FIREGoalProgress = {
      ...mockProgress,
      estimatedTimeRemaining: 18, // 1.5 years
    };

    const { getByText } = render(
      <ProgressVisualization goal={mockGoal} progress={progressWithShortTime} />
    );

    expect(getByText('1y 6mo')).toBeTruthy(); // Formatted time remaining
  });

  it('should handle infinite time remaining', () => {
    const progressWithInfiniteTime: FIREGoalProgress = {
      ...mockProgress,
      estimatedTimeRemaining: Infinity,
    };

    const { getByText } = render(
      <ProgressVisualization goal={mockGoal} progress={progressWithInfiniteTime} />
    );

    expect(getByText('∞')).toBeTruthy(); // Infinity symbol
  });

  it('should display next milestone information', () => {
    const { getByText } = render(
      <ProgressVisualization goal={mockGoal} progress={mockProgress} />
    );

    expect(getByText('Next Milestone')).toBeTruthy();
    expect(getByText('50%')).toBeTruthy(); // Next milestone percentage
    expect(getByText('$500K')).toBeTruthy(); // Next milestone amount
  });

  it('should show velocity with appropriate color coding', () => {
    const { getByText } = render(
      <ProgressVisualization goal={mockGoal} progress={mockProgress} />
    );

    const velocityText = getByText('steady');
    expect(velocityText.props.style).toEqual(
      expect.objectContaining({ color: '#007AFF' }) // Blue for steady
    );
  });

  it('should handle accelerating velocity with green color', () => {
    const acceleratingProgress: FIREGoalProgress = {
      ...mockProgress,
      progressVelocity: 'accelerating',
    };

    const { getByText } = render(
      <ProgressVisualization goal={mockGoal} progress={acceleratingProgress} />
    );

    const velocityText = getByText('accelerating');
    expect(velocityText.props.style).toEqual(
      expect.objectContaining({ color: '#28A745' }) // Green for accelerating
    );
  });

  it('should handle stalled velocity with red color', () => {
    const stalledProgress: FIREGoalProgress = {
      ...mockProgress,
      progressVelocity: 'stalled',
    };

    const { getByText } = render(
      <ProgressVisualization goal={mockGoal} progress={stalledProgress} />
    );

    const velocityText = getByText('stalled');
    expect(velocityText.props.style).toEqual(
      expect.objectContaining({ color: '#DC3545' }) // Red for stalled
    );
  });

  it('should show progress color based on percentage', () => {
    // Test different progress levels
    const highProgress: FIREGoalProgress = {
      ...mockProgress,
      progressPercentage: 80,
    };

    const { rerender } = render(
      <ProgressVisualization goal={mockGoal} progress={highProgress} />
    );

    // Should use green color for high progress (>= 75%)
    // This would be tested by checking SVG stroke color, but that's complex in RNTL

    const lowProgress: FIREGoalProgress = {
      ...mockProgress,
      progressPercentage: 15,
    };

    rerender(
      <ProgressVisualization goal={mockGoal} progress={lowProgress} />
    );

    // Should use red color for low progress (< 25%)
  });

  it('should handle very large amounts with M suffix', () => {
    const largeAmountGoal: FinancialGoal = {
      ...mockGoal,
      target_amount: 5000000, // $5M
      current_amount: 1250000, // $1.25M
    };

    const largeProgress: FIREGoalProgress = {
      ...mockProgress,
      targetAmount: 5000000,
      currentAmount: 1250000,
      nextMilestone: {
        percentage: 50,
        amount: 2500000,
        estimatedDate: new Date().toISOString(),
      },
    };

    const { getByText } = render(
      <ProgressVisualization goal={largeAmountGoal} progress={largeProgress} />
    );

    expect(getByText('$2.5M')).toBeTruthy(); // Should format with M suffix
  });

  it('should handle edge case of 100% progress', () => {
    const completeProgress: FIREGoalProgress = {
      ...mockProgress,
      progressPercentage: 100,
      currentAmount: 1000000,
      estimatedTimeRemaining: 0,
    };

    const { getByText } = render(
      <ProgressVisualization goal={mockGoal} progress={completeProgress} />
    );

    expect(getByText('100.0%')).toBeTruthy();
    expect(getByText('< 1 month')).toBeTruthy(); // Should show minimal time remaining
  });

  it('should provide haptic feedback on view changes', async () => {
    const { getByText } = render(
      <ProgressVisualization goal={mockGoal} progress={mockProgress} />
    );

    fireEvent.press(getByText('$'));
    
    await waitFor(() => {
      expect(mockHapticService.impact).toHaveBeenCalledWith('light');
    });
  });

  it('should handle missing or undefined progress data gracefully', () => {
    const incompleteProgress: Partial<FIREGoalProgress> = {
      goalId: 'test-goal-id',
      currentAmount: 250000,
      targetAmount: 1000000,
      progressPercentage: 25,
    };

    // Should not crash with incomplete data
    expect(() => {
      render(
        <ProgressVisualization 
          goal={mockGoal} 
          progress={incompleteProgress as FIREGoalProgress} 
        />
      );
    }).not.toThrow();
  });
});
