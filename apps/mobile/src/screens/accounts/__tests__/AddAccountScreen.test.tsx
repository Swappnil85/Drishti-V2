/**
 * AddAccountScreen Tests
 * Integration tests for the enhanced account creation wizard
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AddAccountScreen from '../AddAccountScreen';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { AuthProvider } from '../../../contexts/AuthContext';
import { database } from '../../../database';

// Mock dependencies
jest.mock('../../../database', () => ({
  database: {
    write: jest.fn(),
    get: jest.fn(() => ({
      create: jest.fn(),
    })),
  },
}));

jest.mock('../../../services/financial/InstitutionService', () => ({
  institutionService: {
    searchInstitutions: jest.fn(() => Promise.resolve({
      institutions: [
        {
          id: 'test-institution',
          name: 'Test Bank',
          institutionType: 'bank',
          getDefaultInterestRate: jest.fn(() => 0.02),
        },
      ],
      hasMore: false,
      total: 1,
    })),
  },
}));

jest.mock('../../../hooks/useHaptic', () => ({
  useFormHaptic: () => ({
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    selection: jest.fn(),
  }),
}));

const Stack = createStackNavigator();

const MockedAddAccountScreen = () => (
  <NavigationContainer>
    <AuthProvider>
      <ThemeProvider>
        <Stack.Navigator>
          <Stack.Screen 
            name="AddAccount" 
            component={AddAccountScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </ThemeProvider>
    </AuthProvider>
  </NavigationContainer>
);

describe('AddAccountScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Step 1: Basic Information', () => {
    it('should render the first step correctly', () => {
      const { getByText, getByTestId } = render(<MockedAddAccountScreen />);
      
      expect(getByText('Basic Information')).toBeTruthy();
      expect(getByText('Let\'s start with the basics about your account')).toBeTruthy();
      expect(getByTestId('account-name-input')).toBeTruthy();
      expect(getByTestId('account-type-picker')).toBeTruthy();
    });

    it('should validate required fields in step 1', async () => {
      const { getByTestId, getByText } = render(<MockedAddAccountScreen />);
      
      const nextButton = getByTestId('next-button');
      
      await act(async () => {
        fireEvent.press(nextButton);
      });
      
      await waitFor(() => {
        expect(getByText('Account name is required')).toBeTruthy();
        expect(getByText('Please select an account type')).toBeTruthy();
      });
    });

    it('should allow proceeding to step 2 with valid data', async () => {
      const { getByTestId, getByText, queryByText } = render(<MockedAddAccountScreen />);
      
      const nameInput = getByTestId('account-name-input');
      const checkingTypeButton = getByTestId('account-type-checking');
      const nextButton = getByTestId('next-button');
      
      await act(async () => {
        fireEvent.changeText(nameInput, 'Test Checking Account');
        fireEvent.press(checkingTypeButton);
        fireEvent.press(nextButton);
      });
      
      await waitFor(() => {
        expect(getByText('Institution & Details')).toBeTruthy();
        expect(queryByText('Basic Information')).toBeFalsy();
      });
    });
  });

  describe('Step 2: Institution & Details', () => {
    beforeEach(async () => {
      const { getByTestId } = render(<MockedAddAccountScreen />);
      
      const nameInput = getByTestId('account-name-input');
      const checkingTypeButton = getByTestId('account-type-checking');
      const nextButton = getByTestId('next-button');
      
      await act(async () => {
        fireEvent.changeText(nameInput, 'Test Checking Account');
        fireEvent.press(checkingTypeButton);
        fireEvent.press(nextButton);
      });
    });

    it('should render step 2 correctly', async () => {
      const { getByText, getByTestId } = render(<MockedAddAccountScreen />);
      
      // Navigate to step 2
      await act(async () => {
        const nameInput = getByTestId('account-name-input');
        const checkingTypeButton = getByTestId('account-type-checking');
        const nextButton = getByTestId('next-button');
        
        fireEvent.changeText(nameInput, 'Test Account');
        fireEvent.press(checkingTypeButton);
        fireEvent.press(nextButton);
      });
      
      await waitFor(() => {
        expect(getByText('Institution & Details')).toBeTruthy();
        expect(getByTestId('institution-picker')).toBeTruthy();
        expect(getByTestId('balance-input')).toBeTruthy();
        expect(getByTestId('interest-rate-input')).toBeTruthy();
      });
    });

    it('should validate balance field', async () => {
      const { getByTestId, getByText } = render(<MockedAddAccountScreen />);
      
      // Navigate to step 2
      await act(async () => {
        const nameInput = getByTestId('account-name-input');
        const checkingTypeButton = getByTestId('account-type-checking');
        const nextButton = getByTestId('next-button');
        
        fireEvent.changeText(nameInput, 'Test Account');
        fireEvent.press(checkingTypeButton);
        fireEvent.press(nextButton);
      });
      
      const nextButton = getByTestId('next-button');
      
      await act(async () => {
        fireEvent.press(nextButton);
      });
      
      await waitFor(() => {
        expect(getByText('Balance is required')).toBeTruthy();
      });
    });

    it('should validate numeric balance input', async () => {
      const { getByTestId, getByText } = render(<MockedAddAccountScreen />);
      
      // Navigate to step 2
      await act(async () => {
        const nameInput = getByTestId('account-name-input');
        const checkingTypeButton = getByTestId('account-type-checking');
        const nextButton = getByTestId('next-button');
        
        fireEvent.changeText(nameInput, 'Test Account');
        fireEvent.press(checkingTypeButton);
        fireEvent.press(nextButton);
      });
      
      const balanceInput = getByTestId('balance-input');
      const nextButton = getByTestId('next-button');
      
      await act(async () => {
        fireEvent.changeText(balanceInput, 'invalid-number');
        fireEvent.press(nextButton);
      });
      
      await waitFor(() => {
        expect(getByText('Please enter a valid number')).toBeTruthy();
      });
    });

    it('should show tax treatment picker for retirement accounts', async () => {
      const { getByTestId, queryByTestId } = render(<MockedAddAccountScreen />);
      
      // Navigate to step 2 with retirement account
      await act(async () => {
        const nameInput = getByTestId('account-name-input');
        const retirementTypeButton = getByTestId('account-type-retirement');
        const nextButton = getByTestId('next-button');
        
        fireEvent.changeText(nameInput, 'Test Retirement Account');
        fireEvent.press(retirementTypeButton);
        fireEvent.press(nextButton);
      });
      
      await waitFor(() => {
        expect(queryByTestId('tax-treatment-picker')).toBeTruthy();
      });
    });
  });

  describe('Step 3: Additional Information', () => {
    beforeEach(async () => {
      const { getByTestId } = render(<MockedAddAccountScreen />);
      
      // Navigate to step 3
      await act(async () => {
        const nameInput = getByTestId('account-name-input');
        const checkingTypeButton = getByTestId('account-type-checking');
        let nextButton = getByTestId('next-button');
        
        fireEvent.changeText(nameInput, 'Test Account');
        fireEvent.press(checkingTypeButton);
        fireEvent.press(nextButton);
        
        const balanceInput = getByTestId('balance-input');
        nextButton = getByTestId('next-button');
        
        fireEvent.changeText(balanceInput, '5000');
        fireEvent.press(nextButton);
      });
    });

    it('should render step 3 correctly', async () => {
      const { getByText, getByTestId } = render(<MockedAddAccountScreen />);
      
      // Navigate to step 3
      await act(async () => {
        const nameInput = getByTestId('account-name-input');
        const checkingTypeButton = getByTestId('account-type-checking');
        let nextButton = getByTestId('next-button');
        
        fireEvent.changeText(nameInput, 'Test Account');
        fireEvent.press(checkingTypeButton);
        fireEvent.press(nextButton);
        
        const balanceInput = getByTestId('balance-input');
        nextButton = getByTestId('next-button');
        
        fireEvent.changeText(balanceInput, '5000');
        fireEvent.press(nextButton);
      });
      
      await waitFor(() => {
        expect(getByText('Additional Information')).toBeTruthy();
        expect(getByTestId('tag-manager')).toBeTruthy();
        expect(getByTestId('color-picker')).toBeTruthy();
        expect(getByTestId('notes-input')).toBeTruthy();
      });
    });

    it('should show create button in final step', async () => {
      const { getByTestId } = render(<MockedAddAccountScreen />);
      
      // Navigate to step 3
      await act(async () => {
        const nameInput = getByTestId('account-name-input');
        const checkingTypeButton = getByTestId('account-type-checking');
        let nextButton = getByTestId('next-button');
        
        fireEvent.changeText(nameInput, 'Test Account');
        fireEvent.press(checkingTypeButton);
        fireEvent.press(nextButton);
        
        const balanceInput = getByTestId('balance-input');
        nextButton = getByTestId('next-button');
        
        fireEvent.changeText(balanceInput, '5000');
        fireEvent.press(nextButton);
      });
      
      await waitFor(() => {
        expect(getByTestId('create-button')).toBeTruthy();
      });
    });
  });

  describe('Account Creation', () => {
    it('should create account with valid data', async () => {
      const mockCreate = jest.fn();
      const mockWrite = jest.fn((callback) => callback());
      const mockCollection = { create: mockCreate };
      
      (database.write as jest.Mock).mockImplementation(mockWrite);
      (database.get as jest.Mock).mockReturnValue(mockCollection);
      
      const { getByTestId } = render(<MockedAddAccountScreen />);
      
      // Fill out all steps
      await act(async () => {
        // Step 1
        const nameInput = getByTestId('account-name-input');
        const checkingTypeButton = getByTestId('account-type-checking');
        let nextButton = getByTestId('next-button');
        
        fireEvent.changeText(nameInput, 'Test Checking Account');
        fireEvent.press(checkingTypeButton);
        fireEvent.press(nextButton);
        
        // Step 2
        const balanceInput = getByTestId('balance-input');
        nextButton = getByTestId('next-button');
        
        fireEvent.changeText(balanceInput, '5000');
        fireEvent.press(nextButton);
        
        // Step 3
        const createButton = getByTestId('create-button');
        fireEvent.press(createButton);
      });
      
      await waitFor(() => {
        expect(mockWrite).toHaveBeenCalled();
        expect(mockCreate).toHaveBeenCalled();
      });
    });

    it('should handle creation errors gracefully', async () => {
      const mockWrite = jest.fn(() => Promise.reject(new Error('Database error')));
      (database.write as jest.Mock).mockImplementation(mockWrite);
      
      const { getByTestId, getByText } = render(<MockedAddAccountScreen />);
      
      // Fill out all steps and attempt creation
      await act(async () => {
        // Step 1
        const nameInput = getByTestId('account-name-input');
        const checkingTypeButton = getByTestId('account-type-checking');
        let nextButton = getByTestId('next-button');
        
        fireEvent.changeText(nameInput, 'Test Account');
        fireEvent.press(checkingTypeButton);
        fireEvent.press(nextButton);
        
        // Step 2
        const balanceInput = getByTestId('balance-input');
        nextButton = getByTestId('next-button');
        
        fireEvent.changeText(balanceInput, '5000');
        fireEvent.press(nextButton);
        
        // Step 3
        const createButton = getByTestId('create-button');
        fireEvent.press(createButton);
      });
      
      // Should handle error gracefully (would show alert in real app)
      await waitFor(() => {
        expect(mockWrite).toHaveBeenCalled();
      });
    });
  });

  describe('Navigation', () => {
    it('should allow going back between steps', async () => {
      const { getByTestId, getByText } = render(<MockedAddAccountScreen />);
      
      // Navigate to step 2
      await act(async () => {
        const nameInput = getByTestId('account-name-input');
        const checkingTypeButton = getByTestId('account-type-checking');
        const nextButton = getByTestId('next-button');
        
        fireEvent.changeText(nameInput, 'Test Account');
        fireEvent.press(checkingTypeButton);
        fireEvent.press(nextButton);
      });
      
      // Go back to step 1
      await act(async () => {
        const backButton = getByTestId('back-button');
        fireEvent.press(backButton);
      });
      
      await waitFor(() => {
        expect(getByText('Basic Information')).toBeTruthy();
      });
    });

    it('should show progress indicator', () => {
      const { getByText } = render(<MockedAddAccountScreen />);
      
      expect(getByText('Step 1 of 3')).toBeTruthy();
    });
  });

  describe('Real-time Validation', () => {
    it('should show validation warnings for unusual values', async () => {
      const { getByTestId, queryByText } = render(<MockedAddAccountScreen />);
      
      // Navigate to step 2
      await act(async () => {
        const nameInput = getByTestId('account-name-input');
        const checkingTypeButton = getByTestId('account-type-checking');
        const nextButton = getByTestId('next-button');
        
        fireEvent.changeText(nameInput, 'Test Account');
        fireEvent.press(checkingTypeButton);
        fireEvent.press(nextButton);
      });
      
      // Enter unusually high balance
      await act(async () => {
        const balanceInput = getByTestId('balance-input');
        fireEvent.changeText(balanceInput, '10000000');
      });
      
      // Should show warning (implementation depends on validation service)
      await waitFor(() => {
        // This would depend on the actual validation implementation
        expect(queryByText(/unusually high/i)).toBeTruthy();
      }, { timeout: 1000 });
    });
  });
});
