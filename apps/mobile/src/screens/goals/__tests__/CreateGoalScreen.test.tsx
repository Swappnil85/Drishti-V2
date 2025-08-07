/**
 * CreateGoalScreen Tests
 * Epic 8, Story 1: FIRE Goal Creation & Management
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CreateGoalScreen from '../CreateGoalScreen';
import { FIREGoalService } from '../../../services/financial/FIREGoalService';
import { HapticService } from '../../../services/HapticService';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
};

const mockRoute = {
  params: {},
};

// Mock services
jest.mock('../../../services/financial/FIREGoalService');
jest.mock('../../../services/HapticService');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

const mockFIREGoalService = {
  getTemplates: jest.fn(),
  calculateFIRENumber: jest.fn(),
  createFIREGoal: jest.fn(),
};

const mockHapticService = {
  impact: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
};

describe('CreateGoalScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (FIREGoalService.getInstance as jest.Mock).mockReturnValue(mockFIREGoalService);
    (HapticService.getInstance as jest.Mock).mockReturnValue(mockHapticService);
    
    mockFIREGoalService.getTemplates.mockReturnValue([
      {
        id: 'traditional_fire',
        name: 'Traditional FIRE',
        description: 'Standard FIRE approach using the 4% rule',
        fireType: 'fire_traditional',
        category: 'beginner',
        defaultMetadata: {
          fireType: 'fire_traditional',
          withdrawalRate: 0.04,
          safetyMargin: 0.1,
          expectedReturn: 0.07,
          inflationRate: 0.03,
        },
        assumptions: {
          withdrawalRate: 0.04,
          expectedReturn: 0.07,
          inflationRate: 0.03,
          safetyMargin: 0.1,
        },
        guidance: {
          title: 'Traditional FIRE Strategy',
          description: 'Achieve financial independence using the proven 4% withdrawal rule',
          tips: ['Save 25x your annual expenses', 'Invest in low-cost index funds'],
          recommendedFor: ['First-time FIRE planners'],
        },
        customizableFields: [],
      },
    ]);
    
    mockFIREGoalService.calculateFIRENumber.mockResolvedValue(1000000);
    mockFIREGoalService.createFIREGoal.mockResolvedValue({
      id: 'test-goal-id',
      name: 'Test Goal',
    });
  });

  it('should render initial template selection step', () => {
    const { getByText } = render(
      <CreateGoalScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    expect(getByText('Choose FIRE Strategy')).toBeTruthy();
    expect(getByText('Step 1 of 5')).toBeTruthy();
    expect(getByText('Traditional FIRE')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
    expect(getByText('Next')).toBeTruthy();
  });

  it('should navigate through wizard steps', async () => {
    const { getByText, getByPlaceholderText } = render(
      <CreateGoalScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // Step 1: Select template
    fireEvent.press(getByText('Traditional FIRE'));
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      expect(getByText('Basic Information')).toBeTruthy();
      expect(getByText('Step 2 of 5')).toBeTruthy();
    });

    // Step 2: Basic info
    fireEvent.changeText(getByPlaceholderText('e.g., My FIRE Goal'), 'My Test Goal');
    fireEvent.changeText(getByPlaceholderText('30'), '35');
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      expect(getByText('Expense Planning')).toBeTruthy();
      expect(getByText('Step 3 of 5')).toBeTruthy();
    });

    // Step 3: Expenses
    fireEvent.changeText(getByPlaceholderText('4000'), '5000');
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      expect(getByText('Your FIRE Number')).toBeTruthy();
      expect(getByText('Step 4 of 5')).toBeTruthy();
    });
  });

  it('should validate step requirements', () => {
    const { getByText } = render(
      <CreateGoalScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // Next button should be disabled initially (no template selected)
    const nextButton = getByText('Next');
    expect(nextButton.props.accessibilityState?.disabled).toBe(true);

    // Select template to enable next button
    fireEvent.press(getByText('Traditional FIRE'));
    expect(nextButton.props.accessibilityState?.disabled).toBe(false);
  });

  it('should calculate FIRE number automatically', async () => {
    const { getByText, getByPlaceholderText } = render(
      <CreateGoalScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // Navigate to calculation step
    fireEvent.press(getByText('Traditional FIRE'));
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      fireEvent.changeText(getByPlaceholderText('e.g., My FIRE Goal'), 'Test Goal');
      fireEvent.changeText(getByPlaceholderText('30'), '30');
    });
    
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      fireEvent.changeText(getByPlaceholderText('4000'), '4000');
    });
    
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      expect(mockFIREGoalService.calculateFIRENumber).toHaveBeenCalled();
      expect(getByText('$1,000,000')).toBeTruthy();
    });
  });

  it('should create goal successfully', async () => {
    const { getByText, getByPlaceholderText } = render(
      <CreateGoalScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // Complete all steps
    fireEvent.press(getByText('Traditional FIRE'));
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      fireEvent.changeText(getByPlaceholderText('e.g., My FIRE Goal'), 'Complete Test Goal');
      fireEvent.changeText(getByPlaceholderText('30'), '30');
    });
    
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      fireEvent.changeText(getByPlaceholderText('4000'), '4000');
    });
    
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      fireEvent.press(getByText('Next'));
    });

    await waitFor(() => {
      expect(getByText('Review Your Goal')).toBeTruthy();
      expect(getByText('Complete Test Goal')).toBeTruthy();
    });

    // Create goal
    await act(async () => {
      fireEvent.press(getByText('Create Goal'));
    });

    await waitFor(() => {
      expect(mockFIREGoalService.createFIREGoal).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Complete Test Goal',
          goal_type: 'fire_traditional',
          target_amount: 1000000,
        })
      );
      expect(mockHapticService.success).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Goal Created!',
        expect.stringContaining('Complete Test Goal'),
        expect.any(Array)
      );
    });
  });

  it('should handle goal creation errors', async () => {
    mockFIREGoalService.createFIREGoal.mockRejectedValue(new Error('Creation failed'));

    const { getByText, getByPlaceholderText } = render(
      <CreateGoalScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // Complete wizard quickly
    fireEvent.press(getByText('Traditional FIRE'));
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      fireEvent.changeText(getByPlaceholderText('e.g., My FIRE Goal'), 'Error Test Goal');
      fireEvent.changeText(getByPlaceholderText('30'), '30');
    });
    
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      fireEvent.changeText(getByPlaceholderText('4000'), '4000');
    });
    
    fireEvent.press(getByText('Next'));
    
    await waitFor(() => {
      fireEvent.press(getByText('Next'));
    });

    // Try to create goal
    await act(async () => {
      fireEvent.press(getByText('Create Goal'));
    });

    await waitFor(() => {
      expect(mockHapticService.error).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to create goal. Please try again.',
        expect.any(Array)
      );
    });
  });

  it('should handle back navigation', () => {
    const { getByText } = render(
      <CreateGoalScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // Cancel from first step should go back
    fireEvent.press(getByText('Cancel'));
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('should recalculate FIRE number when requested', async () => {
    const { getByText, getByPlaceholderText } = render(
      <CreateGoalScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // Navigate to calculation step
    fireEvent.press(getByText('Traditional FIRE'));
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      fireEvent.changeText(getByPlaceholderText('e.g., My FIRE Goal'), 'Recalc Test');
      fireEvent.changeText(getByPlaceholderText('30'), '30');
    });
    
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      fireEvent.changeText(getByPlaceholderText('4000'), '4000');
    });
    
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      // Clear previous calls
      mockFIREGoalService.calculateFIRENumber.mockClear();
      
      // Click recalculate
      fireEvent.press(getByText('Recalculate'));
      
      expect(mockFIREGoalService.calculateFIRENumber).toHaveBeenCalled();
    });
  });

  it('should show expense preview when monthly expenses are entered', async () => {
    const { getByText, getByPlaceholderText } = render(
      <CreateGoalScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // Navigate to expense step
    fireEvent.press(getByText('Traditional FIRE'));
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      fireEvent.changeText(getByPlaceholderText('e.g., My FIRE Goal'), 'Expense Test');
      fireEvent.changeText(getByPlaceholderText('30'), '30');
    });
    
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      fireEvent.changeText(getByPlaceholderText('4000'), '3500');
      
      // Should show annual expenses preview
      expect(getByText('$42,000')).toBeTruthy(); // 3500 * 12
    });
  });

  it('should provide haptic feedback on interactions', async () => {
    const { getByText } = render(
      <CreateGoalScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    fireEvent.press(getByText('Next'));
    expect(mockHapticService.impact).toHaveBeenCalledWith('light');

    fireEvent.press(getByText('Cancel'));
    expect(mockHapticService.impact).toHaveBeenCalledWith('light');
  });
});
